document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
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
    if (!originalTestimonials.length) return;

    const addTestimonialSet = () => {
      originalTestimonials.forEach((testimonial) => {
        const duplicate = testimonial.cloneNode(true);
        duplicate.setAttribute("aria-hidden", "true");
        scroller.append(duplicate);
      });
    };

    addTestimonialSet();
    const loopAt = scroller.scrollWidth / 2;

    while (scroller.scrollWidth < scroller.clientWidth + loopAt) {
      addTestimonialSet();
    }

    let isPaused = false;
    let lastFrame;

    scroller.scrollLeft = 0;

    const pause = () => {
      isPaused = true;
    };

    const resume = () => {
      isPaused = false;
      lastFrame = undefined;
    };

    ["pointerdown", "focusin", "touchstart"].forEach((eventName) => {
      scroller.addEventListener(eventName, pause, { passive: true });
    });
    ["pointerup", "focusout", "touchend", "touchcancel"].forEach((eventName) => {
      scroller.addEventListener(eventName, resume, { passive: true });
    });

    const autoScroll = (timestamp) => {
      if (!isPaused && !reduceMotion && loopAt > 0) {
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
      }

      requestAnimationFrame(autoScroll);
    };

    requestAnimationFrame(autoScroll);
  });

  const revealElements = document.querySelectorAll(".value-prop, .guarantee, .feature-img, .tutor-content section, .programme-content > section, .blog-content section");
  const counters = document.querySelectorAll("[data-counter-target]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
