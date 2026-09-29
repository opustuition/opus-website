document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    if (event.key === "Escape" && sidebar?.classList.contains("expand")) {
      setMenuOpen(false);
    }
  });

  document.querySelectorAll(".testimonial-scroll").forEach((scroller) => {
    const originalTestimonials = Array.from(scroller.children);
    if (!originalTestimonials.length || reduceMotion) return;

    const addTestimonialSet = () => {
      originalTestimonials.forEach((testimonial) => {
        const duplicate = testimonial.cloneNode(true);
        duplicate.setAttribute("aria-hidden", "true");
        scroller.append(duplicate);
      });
    };

    const loopAt = scroller.scrollWidth;

    while (scroller.scrollWidth < scroller.clientWidth + loopAt) {
      addTestimonialSet();
    }

    let isInteracting = false;
    let isVisible = false;
    let frameId;
    let lastFrame;

    scroller.scrollLeft = 0;

    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = undefined;
      lastFrame = undefined;
    };

    const canAnimate = () => isVisible && !isInteracting && !document.hidden && loopAt > 0;

    const start = () => {
      if (!frameId && canAnimate()) frameId = requestAnimationFrame(autoScroll);
    };

    ["pointerdown", "focusin", "touchstart"].forEach((eventName) => {
      scroller.addEventListener(eventName, () => {
        isInteracting = true;
        stop();
      }, { passive: true });
    });
    ["pointerup", "focusout", "touchend", "touchcancel"].forEach((eventName) => {
      scroller.addEventListener(eventName, () => {
        isInteracting = false;
        start();
      }, { passive: true });
    });

    const autoScroll = (timestamp) => {
      frameId = undefined;
      if (!canAnimate()) return;

      if (lastFrame) {
        const distance = (timestamp - lastFrame) * .04;
        const nextPosition = scroller.scrollLeft + distance;

        if (nextPosition >= loopAt) {
          scroller.scrollLeft = nextPosition - loopAt;
        } else {
          scroller.scrollLeft = nextPosition;
        }
      }
      lastFrame = timestamp;

      frameId = requestAnimationFrame(autoScroll);
    };

    if ("IntersectionObserver" in window) {
      const carouselObserver = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) start();
        else stop();
      }, { threshold: 0.1 });

      carouselObserver.observe(scroller);
    } else {
      isVisible = true;
      start();
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
  });

  const revealElements = document.querySelectorAll(".value-prop, .guarantee, .feature-img, .tutor-content section, .programme-content > section, .blog-content section");
  const counters = document.querySelectorAll("[data-counter-target]");

  const showElement = (element) => element.classList.add("intersecting");

  const animateCounter = (element) => {
    const start = Number(element.dataset.counterStart || 0);
    const target = Number(element.dataset.counterTarget || 0);
    const decimals = Number(element.dataset.counterDecimals || 0);

    if (reduceMotion) {
      element.textContent = target.toFixed(decimals);
      return;
    }

    const duration = 900;
    const startedAt = performance.now();

    const update = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const value = start + (target - start) * easedProgress;
      element.textContent = value.toFixed(decimals);

      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach(showElement);
    counters.forEach(animateCounter);
    return;
  }

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      showElement(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  revealElements.forEach((element) => revealObserver.observe(element));
  counters.forEach((counter) => counterObserver.observe(counter));
});
