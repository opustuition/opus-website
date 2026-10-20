/* The site remains static; Supabase stores only guest interactions. */
(async () => {
  const root = document.querySelector("[data-post-engagement]");
  if (!root) return;
  const find = (selector) => root.querySelector(selector);
  const status = find("[data-engagement-status]");
  const likeButton = find("[data-like]");
  const form = find("[data-comment-form]");
  const moreButton = find("[data-load-comments]");
  const postId = root.dataset.postId;
  const shareUrl = root.dataset.shareUrl;

  const shareButton = find("[data-share]");
  shareButton.hidden = false;
  shareButton.addEventListener("click", async () => {
    const shareStatus = find("[data-share-status]");
    try {
      if (navigator.share) {
        await navigator.share({ title: root.dataset.title, url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        shareStatus.textContent = "Article link copied.";
      } else {
        throw new Error("Copy manually");
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      find("[data-share-fallback]").hidden = false;
      const input = find("#article-share-url");
      input.focus();
      input.select();
      shareStatus.textContent = "Copy the link above to share this article.";
    }
  });

  if (!root.dataset.supabaseUrl || !root.dataset.supabaseKey) return;
  status.textContent = "Loading likes and comments…";

  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load service"));
    document.head.append(script);
  });

  try {
    await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/dist/umd/supabase.js");
    const client = window.supabase.createClient(root.dataset.supabaseUrl, root.dataset.supabaseKey);
    let { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    let captchaToken;
    let captchaWidget;
    let guestRequest;
    let offset = 0;
    const pageSize = 20;

    const check = ({ data, error }) => {
      if (error) throw error;
      return data;
    };
    const showError = (error) => {
      status.textContent = error.message?.startsWith("Please ")
        ? error.message
        : "We couldn’t save that. Please check your connection and try again.";
    };
    const updateLikes = (data) => {
      find("[data-like-count]").textContent = `(${data.like_count})`;
      likeButton.setAttribute("aria-pressed", String(data.liked));
      find("[data-like-label]").textContent = data.liked ? "Liked" : "Like";
    };
    const refreshLikes = async () => {
      updateLikes(check(await client.rpc("get_blog_likes", { p_post_id: postId })));
    };
    const loadComments = async () => {
      const comments = check(await client.from("blog_comments")
        .select("id, display_name, body, created_at")
        .eq("post_id", postId).eq("approved", true)
        .order("created_at", { ascending: false }).order("id", { ascending: false })
        .range(offset, offset + pageSize - 1));
      if (offset === 0) find("[data-comments]").replaceChildren();
      for (const comment of comments) {
        const article = document.createElement("article");
        article.className = "post-comment";
        const name = document.createElement("strong");
        name.textContent = comment.display_name;
        const time = document.createElement("time");
        time.dateTime = comment.created_at;
        time.textContent = new Date(comment.created_at).toLocaleDateString(undefined, {
          year: "numeric", month: "short", day: "numeric",
        });
        const body = document.createElement("p");
        body.textContent = comment.body;
        article.append(name, time, body);
        find("[data-comments]").append(article);
      }
      if (offset === 0 && comments.length === 0) {
        find("[data-comments]").textContent = "No comments yet. Start the conversation!";
      }
      offset += comments.length;
      moreButton.hidden = comments.length < pageSize;
    };
    const ensureGuest = async () => {
      // Supabase refreshes persisted sessions; never invent a browser-supplied user ID.
      const current = check(await client.auth.getSession());
      session = current.session;
      if (session) return;
      if (!guestRequest) {
        guestRequest = (async () => {
          if (root.dataset.turnstileKey && !captchaToken) {
            find("[data-captcha]").scrollIntoView({ block: "center", behavior: "smooth" });
            throw new Error("Please complete the security check below, then try again.");
          }
          try {
            const data = check(await client.auth.signInAnonymously({
              options: { captchaToken },
            }));
            session = data.session;
          } finally {
            captchaToken = undefined;
            if (captchaWidget !== undefined) window.turnstile.reset(captchaWidget);
          }
          find("[data-captcha]").hidden = true;
        })();
      }
      try { await guestRequest; } finally { guestRequest = undefined; }
    };

    if (root.dataset.turnstileKey && !session) {
      const captcha = find("[data-captcha]");
      captcha.hidden = false;
      await loadScript("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit");
      captchaWidget = window.turnstile.render(captcha, {
        sitekey: root.dataset.turnstileKey,
        callback: (token) => { captchaToken = token; },
        "expired-callback": () => { captchaToken = undefined; },
        "error-callback": () => { captchaToken = undefined; },
      });
    }

    // No guest account is created until a visitor likes or comments.
    await Promise.all([refreshLikes(), loadComments()]);
    status.textContent = "No sign-in needed. Comments are reviewed before appearing.";
    likeButton.disabled = false;
    form.hidden = false;

    likeButton.addEventListener("click", async () => {
      likeButton.disabled = true;
      try {
        await ensureGuest();
        // Read the current browser identity before deciding the new state.
        await refreshLikes();
        const liked = likeButton.getAttribute("aria-pressed") !== "true";
        updateLikes(check(await client.rpc("set_blog_like", { p_post_id: postId, p_liked: liked })));
        status.textContent = liked ? "Thanks for liking this article!" : "Like removed.";
      } catch (error) { showError(error); }
      finally { likeButton.disabled = false; }
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button");
      button.disabled = true;
      try {
        const name = form.elements.display_name.value.trim();
        const body = form.elements.body.value.trim();
        if (!name || !body) throw new Error("Please enter your name and a comment.");
        await ensureGuest();
        check(await client.rpc("submit_blog_comment", {
          p_post_id: postId, p_display_name: name, p_body: body,
        }));
        form.elements.body.value = "";
        status.textContent = "Thanks! Your comment has been sent for approval.";
      } catch (error) { showError(error); }
      finally { button.disabled = false; }
    });
    moreButton.addEventListener("click", async () => {
      moreButton.disabled = true;
      try { await loadComments(); }
      catch { status.textContent = "Couldn’t load more comments. Please try again."; }
      finally { moreButton.disabled = false; }
    });
  } catch {
    status.textContent = "Likes and comments are temporarily unavailable. Please try again later.";
  }
})();
