document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const sidebar = document.querySelector(".sidebar");
  const sidebarBackdrop = document.querySelector(".sidebar-wrapper");
  const openButton = document.querySelector(".menu-open");
  const closeButton = document.querySelector(".menu-close");

  const setMenuOpen = (isOpen) => {
    if (!sidebar || !sidebarBackdrop || !openButton) return;

    sidebar.classList.toggle("expand", isOpen);
    sidebarBackdrop.classList.toggle("expand", isOpen);
    document.body.classList.toggle("menu-expanded", isOpen);
    openButton.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      closeButton?.focus();
    } else if (document.activeElement === closeButton) {
      openButton.focus();
    }
  };

  openButton?.addEventListener("click", () => setMenuOpen(true));
  closeButton?.addEventListener("click", () => setMenuOpen(false));
  sidebarBackdrop?.addEventListener("click", () => setMenuOpen(false));

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      sidebar?.classList.contains("expand")
    ) {
      setMenuOpen(false);
    }
  });

  /* =========================
     Testimonial carousel
  ========================= */

  document.querySelectorAll(".testimonial-scroll").forEach((scroller) => {
    if (reduceMotion) return;

    let isVisible = false;
    let isInteracting = false;
    let animationFrame = null;
    let lastTime = 0;

    const speed = 24; // px per second

    const start = () => {
      if (
        animationFrame !== null ||
        !isVisible ||
        isInteracting ||
        document.hidden
      ) {
        return;
      }

      lastTime = 0;
      animationFrame = requestAnimationFrame(animate);
    };

    const stop = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      lastTime = 0;
    };

    const animate = (timestamp) => {
      animationFrame = null;

      if (
        !isVisible ||
        isInteracting ||
        document.hidden
      ) {
        return;
      }

      if (lastTime === 0) {
        lastTime = timestamp;
      }

      const elapsed = Math.min(timestamp - lastTime, 50);
      lastTime = timestamp;

      const maxScroll = scroller.scrollWidth - scroller.clientWidth;

      if (maxScroll <= 0) {
        return;
      }

      scroller.scrollLeft += (speed * elapsed) / 1000;

      if (scroller.scrollLeft >= maxScroll) {
        scroller.scrollLeft = 0;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    const pauseInteraction = () => {
      isInteracting = true;
      stop();
    };

    const resumeInteraction = () => {
      isInteracting = false;
      start();
    };

    scroller.addEventListener("pointerdown", pauseInteraction, {
      passive: true,
    });

    scroller.addEventListener("pointerup", resumeInteraction, {
      passive: true,
    });

    scroller.addEventListener("pointercancel", resumeInteraction, {
      passive: true,
    });

    scroller.addEventListener("touchstart", pauseInteraction, {
      passive: true,
    });

    scroller.addEventListener("touchend", resumeInteraction, {
      passive: true,
    });

    scroller.addEventListener("touchcancel", resumeInteraction, {
      passive: true,
    });

    scroller.addEventListener("mouseenter", pauseInteraction);
    scroller.addEventListener("mouseleave", resumeInteraction);

    scroller.addEventListener("focusin", pauseInteraction);
    scroller.addEventListener("focusout", resumeInteraction);

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;

          if (isVisible) {
            start();
          } else {
            stop();
          }
        },
        {
          threshold: 0.1,
        }
      );

      observer.observe(scroller);
    } else {
      isVisible = true;
      start();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });
  });

  /* =========================
     Reveal animations
  ========================= */

  const revealElements = document.querySelectorAll(
    ".value-prop, .guarantee, .feature-img, .tutor-content section, .programme-content > section, .blog-content section"
  );

  const counters = document.querySelectorAll(
    "[data-counter-target]"
  );

  const showElement = (element) => {
    element.classList.add("intersecting");
  };

  const animateCounter = (element) => {
    const start = Number(
      element.dataset.counterStart || 0
    );

    const target = Number(
      element.dataset.counterTarget || 0
    );

    const decimals = Number(
      element.dataset.counterDecimals || 0
    );

    if (reduceMotion) {
      element.textContent = target.toFixed(decimals);
      return;
    }

    const duration = 900;
    const startedAt = performance.now();

    const update = (now) => {
      const progress = Math.min(
        (now - startedAt) / duration,
        1
      );

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      const value =
        start + (target - start) * easedProgress;

      element.textContent = value.toFixed(decimals);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  if (
    reduceMotion ||
    !("IntersectionObserver" in window)
  ) {
    revealElements.forEach(showElement);
    counters.forEach(animateCounter);
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        showElement(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
    }
  );

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.5,
    }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });

  counters.forEach((counter) => {
    counterObserver.observe(counter);
  });
});