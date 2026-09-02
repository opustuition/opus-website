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
    scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
  });

  const revealElements = document.querySelectorAll(".value-prop, .guarantee, .feature-img, .tutor-content section");
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
