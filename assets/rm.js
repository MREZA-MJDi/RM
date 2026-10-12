(() => {
  "use strict";
  const root = document.documentElement;
  const progress = document.querySelector(".scroll-progress span");
  const art = document.querySelector(".hero-art");
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("#year").forEach((node) => node.textContent = String(new Date().getFullYear()));

  let frame = 0;
  const updateProgress = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.width = (ratio * 100).toFixed(2) + "%";
  };
  window.addEventListener("scroll", () => {
    if (!frame) frame = window.requestAnimationFrame(updateProgress);
  }, { passive: true });
  updateProgress();

  if (!reduceMotion && art) {
    let pointerFrame = 0;
    let pointer = null;
    art.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      pointer = event;
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!pointer) return;
        const box = art.getBoundingClientRect();
        const x = ((pointer.clientX - box.left) / box.width - .5) * 2;
        const y = ((pointer.clientY - box.top) / box.height - .5) * 2;
        art.style.setProperty("--mx", x.toFixed(3));
        art.style.setProperty("--my", y.toFixed(3));
        pointer = null;
      });
    }, { passive: true });
    art.addEventListener("pointerleave", () => {
      art.style.setProperty("--mx", "0");
      art.style.setProperty("--my", "0");
    }, { passive: true });
  }

  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: "0px 0px -45px 0px" });
    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
  } else {
    document.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
  }

  if (menu && nav) {
    menu.addEventListener("click", () => {
      const open = menu.getAttribute("aria-expanded") !== "true";
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      nav.classList.toggle("is-open", open);
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open navigation");
      nav.classList.remove("is-open");
    }));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) {
        menu.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    }, { passive: true });
  }

  document.querySelectorAll(".lab-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch" || reduceMotion) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--card-x", (((event.clientX - box.left) / box.width) * 100).toFixed(1) + "%");
      card.style.setProperty("--card-y", (((event.clientY - box.top) / box.height) * 100).toFixed(1) + "%");
    }, { passive: true });
  });
})();