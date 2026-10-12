(() => {
  "use strict";

  const root = document.documentElement;
  const progress = document.querySelector(".scroll-progress span");
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scene = document.querySelector(".scene");
  const container = document.querySelector(".scene .container");
  const cube = document.querySelector(".scene #cube");
  const faces = Array.from(document.querySelectorAll(".scene .face"));
  const images = faces.map((face) => face.querySelector("img"));
  const readout = document.querySelector("[data-readout]");
  const resetButton = document.querySelector("[data-reset-cube]");

  document.querySelectorAll("#year").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  // Page chrome: one rAF-throttled scroll progress update, no scroll work per pixel.
  let scrollFrame = 0;
  const updateProgress = () => {
    scrollFrame = 0;
    const max = root.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${(max > 0 ? window.scrollY / max : 0) * 100}%`;
  };
  window.addEventListener("scroll", () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateProgress);
  }, { passive: true });
  updateProgress();

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -38px 0px" });
    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
  } else {
    document.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
  }

  // Compact mobile navigation; every link remains an in-page anchor.
  if (menu && nav) {
    const closeMenu = () => {
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open navigation");
      nav.classList.remove("is-open");
    };
    menu.addEventListener("click", () => {
      const open = menu.getAttribute("aria-expanded") !== "true";
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      nav.classList.toggle("is-open", open);
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeMenu();
    }, { passive: true });
  }

  if (scene && container && cube && faces.length === 6 && images.every(Boolean)) {
    // Core cube behavior stays true to the supplied component:
    // viewport pointer position drives a smooth 360° X/Y rotation and image-plane parallax.
    const state = {
      pointerX: window.innerWidth / 2,
      pointerY: window.innerHeight / 2,
      targetRotationX: 0,
      targetRotationY: 0,
      rotationX: 0,
      rotationY: 0,
      depth: 150,
      targetImageX: -75,
      targetImageY: -75,
      imageX: -75,
      imageY: -75,
      frame: 0,
      resizeFrame: 0,
      lastTime: 0
    };

    const renderImages = () => {
      const transform = `translate3d(${state.imageX.toFixed(3)}px, ${state.imageY.toFixed(3)}px, 0)`;
      images.forEach((image) => { image.style.transform = transform; });
    };

    const renderCube = () => {
      cube.style.transform = `rotateX(${state.rotationX.toFixed(3)}deg) rotateY(${state.rotationY.toFixed(3)}deg)`;
      if (readout) {
        const fmt = (value) => `${String(((Math.round(value) % 360) + 360) % 360).padStart(3, "0")}°`;
        readout.textContent = `ROT X ${fmt(state.rotationX)} · ROT Y ${fmt(state.rotationY)}`;
      }
    };

    const setGeometry = () => {
      const size = container.getBoundingClientRect().width || 300;
      state.depth = size / 2;
      container.style.perspective = `${Math.round(size * 5)}px`;
      updateTargets(state.pointerX, state.pointerY, false);
      renderImages();
    };

    const animate = (time) => {
      state.frame = 0;
      const delta = state.lastTime ? Math.min(time - state.lastTime, 48) : 16;
      state.lastTime = time;
      const amount = 1 - Math.exp(-delta / 210);
      state.rotationX += (state.targetRotationX - state.rotationX) * amount;
      state.rotationY += (state.targetRotationY - state.rotationY) * amount;
      state.imageX += (state.targetImageX - state.imageX) * amount;
      state.imageY += (state.targetImageY - state.imageY) * amount;
      renderCube();
      renderImages();

      const remaining = Math.max(
        Math.abs(state.targetRotationX - state.rotationX),
        Math.abs(state.targetRotationY - state.rotationY),
        Math.abs(state.targetImageX - state.imageX),
        Math.abs(state.targetImageY - state.imageY)
      );
      if (remaining > 0.08 && !reduceMotion.matches) {
        state.frame = window.requestAnimationFrame(animate);
      } else {
        state.rotationX = state.targetRotationX;
        state.rotationY = state.targetRotationY;
        state.imageX = state.targetImageX;
        state.imageY = state.targetImageY;
        renderCube();
        renderImages();
        state.lastTime = 0;
      }
    };

    const startAnimation = () => {
      if (!state.frame) state.frame = window.requestAnimationFrame(animate);
    };

    function updateTargets(clientX, clientY, animate = true) {
      state.pointerX = clientX;
      state.pointerY = clientY;
      const x = Math.min(1, Math.max(0, clientX / Math.max(window.innerWidth, 1)));
      const y = Math.min(1, Math.max(0, clientY / Math.max(window.innerHeight, 1)));
      state.targetRotationX = -180 + 360 * y;
      state.targetRotationY = -180 + 360 * x;
      state.targetImageX = -state.depth + state.depth * x;
      state.targetImageY = -state.depth * y;

      if (!animate || reduceMotion.matches) {
        state.rotationX = state.targetRotationX;
        state.rotationY = state.targetRotationY;
        state.imageX = state.targetImageX;
        state.imageY = state.targetImageY;
        renderCube();
        renderImages();
        return;
      }
      startAnimation();
    }

    const handlePointer = (event) => {
      if (event.pointerType === "touch" && event.buttons === 0) return;
      updateTargets(event.clientX, event.clientY);
    };

    // Entry transition is decorative only; geometry and interaction remain native and local.
    container.classList.add("is-entering");
    setGeometry();
    updateTargets(state.pointerX, state.pointerY, false);
    window.requestAnimationFrame(() => {
      container.classList.remove("is-entering");
      container.classList.add("is-ready");
    });

    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") updateTargets(event.clientX, event.clientY);
    }, { passive: true });

    resetButton?.addEventListener("click", () => {
      updateTargets(window.innerWidth / 2, window.innerHeight / 2);
    });
    scene.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 22 : 10;
      if (event.key === "ArrowLeft") { event.preventDefault(); updateTargets(window.innerWidth / 2, window.innerHeight / 2); state.targetRotationY -= step; startAnimation(); }
      else if (event.key === "ArrowRight") { event.preventDefault(); updateTargets(window.innerWidth / 2, window.innerHeight / 2); state.targetRotationY += step; startAnimation(); }
      else if (event.key === "ArrowUp") { event.preventDefault(); updateTargets(window.innerWidth / 2, window.innerHeight / 2); state.targetRotationX -= step; startAnimation(); }
      else if (event.key === "ArrowDown") { event.preventDefault(); updateTargets(window.innerWidth / 2, window.innerHeight / 2); state.targetRotationX += step; startAnimation(); }
      else if (event.key === "Home") { event.preventDefault(); updateTargets(window.innerWidth / 2, window.innerHeight / 2); }
    });
    window.addEventListener("resize", () => {
      if (state.resizeFrame) window.cancelAnimationFrame(state.resizeFrame);
      state.resizeFrame = window.requestAnimationFrame(() => {
        state.resizeFrame = 0;
        setGeometry();
        updateTargets(state.pointerX, state.pointerY);
      });
    }, { passive: true });

    images.forEach((image) => image.addEventListener("error", () => {
      image.parentElement.style.background = "linear-gradient(145deg,#302b42,#111117)";
      console.error("RM Spatial Cube: image could not load:", image.getAttribute("src"));
    }, { once: true }));

    reduceMotion.addEventListener?.("change", () => {
      if (reduceMotion.matches) updateTargets(state.pointerX, state.pointerY, false);
    });
  } else {
    console.error("RM Spatial Cube: expected scene, container, #cube and six image faces.");
  }

  // Subtle pointer-aware light in the mechanic cards, throttled to one frame.
  if (!reduceMotion.matches) {
    document.querySelectorAll(".mechanic-card").forEach((card) => {
      let pending = null;
      let frame = 0;
      card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;
        pending = event;
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (!pending) return;
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--card-x", `${((pending.clientX - rect.left) / rect.width) * 100}%`);
          card.style.setProperty("--card-y", `${((pending.clientY - rect.top) / rect.height) * 100}%`);
          pending = null;
        });
      }, { passive: true });
    });
  }
})();
