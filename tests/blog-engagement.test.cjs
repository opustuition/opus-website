const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const source = readFileSync(require("node:path").join(__dirname, "../assets/js/blog-engagement.js"), "utf8");

// A small browser harness exercises the shipped script with service responses.
class Element {
  constructor() {
    this.hidden = true;
    this.disabled = false;
    this.textContent = "";
    this.children = [];
    this.attributes = { "aria-pressed": "false" };
    this.listeners = {};
  }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  append(...children) { this.children.push(...children); }
  replaceChildren() { this.children = []; this.textContent = ""; }
  focus() { this.focused = true; }
  select() { this.selected = true; }
  scrollIntoView() {}
  async fire(type) { await this.listeners[type]?.({ preventDefault() {} }); }
}

async function browser({ configured = true, comments = [], offline = false, navigator = {}, captcha = false } = {}) {
  const elements = new Map();
  const find = (selector) => {
    if (!elements.has(selector)) elements.set(selector, new Element());
    return elements.get(selector);
  };
  const root = new Element();
  root.querySelector = find;
  root.dataset = {
    postId: "/blog/test-article/", title: "An article",
    shareUrl: "https://opustuition.com/blog/test-article/",
    supabaseUrl: configured ? "https://example.supabase.co" : "",
    supabaseKey: configured ? "sb_publishable_example" : "",
    turnstileKey: captcha ? "site-key" : "",
  };
  const form = find("[data-comment-form]");
  form.elements = { display_name: { value: " Guest " }, body: { value: " A comment " } };
  form.querySelector = () => find("submit-button");
  const calls = [];
  let session = null;
  let liked = false;
  let captchaOptions;
  const client = {
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      signInAnonymously: async (options) => {
        calls.push(["guest", options]);
        session = { user: { id: "server-generated-id" } };
        return { data: { session }, error: null };
      },
    },
    rpc: async (name, args) => {
      calls.push([name, args]);
      if (name === "set_blog_like") liked = args.p_liked;
      return { data: { like_count: liked ? 1 : 0, liked }, error: null };
    },
    from: () => {
      const query = {};
      for (const method of ["select", "eq", "order"]) query[method] = () => query;
      query.range = async () => ({ data: comments, error: null });
      return query;
    },
  };
  const document = {
    querySelector: () => root,
    createElement: () => new Element(),
    head: { append: (script) => { queueMicrotask(() => offline ? script.onerror() : script.onload()); } },
  };
  await vm.runInNewContext(source, {
    document, navigator,
    window: {
      supabase: { createClient: () => client },
      turnstile: { render: (_, options) => { captchaOptions = options; return 1; }, reset() {} },
    },
  });
  return { find, calls, form, getCaptchaOptions: () => captchaOptions };
}

test("sharing works without configuration and without creating a guest", async () => {
  let copied;
  const b = await browser({ configured: false, navigator: { clipboard: { writeText: async (url) => { copied = url; } } } });
  await b.find("[data-share]").fire("click");
  assert.equal(copied, "https://opustuition.com/blog/test-article/");
  assert.equal(b.find("[data-comment-form]").hidden, true);
  assert.equal(b.calls.length, 0);
});

test("clipboard denial exposes a selectable link; native cancellation is quiet", async () => {
  const b = await browser({ configured: false, navigator: { clipboard: { writeText: async () => { throw Error("Denied"); } } } });
  await b.find("[data-share]").fire("click");
  assert.equal(b.find("[data-share-fallback]").hidden, false);
  assert.equal(b.find("#article-share-url").selected, true);
  const cancelled = await browser({ configured: false, navigator: { share: async () => { const e = Error(); e.name = "AbortError"; throw e; } } });
  await cancelled.find("[data-share]").fire("click");
  assert.equal(cancelled.find("[data-share-fallback]").hidden, true);
});

test("reading creates no guest; like/unlike reuses the guest session", async () => {
  const b = await browser();
  assert.equal(b.calls.filter(([name]) => name === "guest").length, 0);
  await b.find("[data-like]").fire("click");
  assert.equal(b.find("[data-like]").getAttribute("aria-pressed"), "true");
  await b.find("[data-like]").fire("click");
  assert.equal(b.find("[data-like]").getAttribute("aria-pressed"), "false");
  assert.equal(b.calls.filter(([name]) => name === "guest").length, 1);
});

test("comment submission trims text, sends no approval or identity fields, and stays pending", async () => {
  const b = await browser();
  await b.form.fire("submit");
  const args = b.calls.find(([name]) => name === "submit_blog_comment")[1];
  assert.deepEqual(JSON.parse(JSON.stringify(args)), {
    p_post_id: "/blog/test-article/", p_display_name: "Guest", p_body: "A comment",
  });
  assert.equal(b.form.elements.body.value, "");
  assert.match(b.find("[data-engagement-status]").textContent, /sent for approval/);
  assert.equal(b.find("[data-comments]").children.length, 0);
});

test("untrusted comment markup is rendered as text", async () => {
  const markup = '<img src=x onerror="alert(1)">';
  const b = await browser({ comments: [{ display_name: markup, body: markup, created_at: "2026-10-20T00:00:00Z" }] });
  const article = b.find("[data-comments]").children[0];
  assert.equal(article.children[0].textContent, markup);
  assert.equal(article.children[2].textContent, markup);
  assert.equal(article.children[2].children.length, 0);
});

test("CAPTCHA blocks guest creation until solved and passes the token to Auth", async () => {
  const b = await browser({ captcha: true });
  await b.find("[data-like]").fire("click");
  assert.equal(b.calls.filter(([name]) => name === "guest").length, 0);
  assert.match(b.find("[data-engagement-status]").textContent, /security check/);
  b.getCaptchaOptions().callback("verified-token");
  await b.find("[data-like]").fire("click");
  assert.equal(b.calls.find(([name]) => name === "guest")[1].options.captchaToken, "verified-token");
  assert.equal(b.find("[data-captcha]").hidden, true);
});

test("service-load failure leaves sharing available and comment submission hidden", async () => {
  const b = await browser({ offline: true });
  assert.match(b.find("[data-engagement-status]").textContent, /temporarily unavailable/);
  assert.equal(b.find("[data-comment-form]").hidden, true);
  assert.equal(b.find("[data-share]").hidden, false);
});
