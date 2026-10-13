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

  // Independent interaction for the floating ten-layer image stack.
  // The planes fan open on hover; a separate eased tilt follows the pointer in the same 3D scene.
  const stackButton = document.querySelector("[data-floating-stack]");
  if (stackButton) {
    const stackLayers = Array.from(stackButton.querySelectorAll("[data-stack-layer]"));
    const stackPlanes = stackButton.querySelector("[data-stack-planes]");
    const stackStatus = stackButton.querySelector("[data-stack-status]");
    const stackAction = stackButton.querySelector("[data-stack-action]");
    const stackState = {
      x: 0, y: 0, targetX: 0, targetY: 0,
      open: false, pinned: false, hovered: false, tiltFrame: 0
    };

    const applyStackTilt = () => {
      if (!stackPlanes) return;
      stackPlanes.style.transform =
        "rotateX(" + (-stackState.y * 6).toFixed(2) + "deg) rotateY(" + (stackState.x * 8).toFixed(2) + "deg)";
    };

    const animateStackTilt = () => {
      stackState.tiltFrame = 0;
      const dx = stackState.targetX - stackState.x;
      const dy = stackState.targetY - stackState.y;
      stackState.x += dx * 0.2;
      stackState.y += dy * 0.2;
      applyStackTilt();
      if (Math.abs(dx) > 0.008 || Math.abs(dy) > 0.008) {
        stackState.tiltFrame = window.requestAnimationFrame(animateStackTilt);
      } else {
        stackState.x = stackState.targetX;
        stackState.y = stackState.targetY;
        applyStackTilt();
      }
    };

    const scheduleStackTilt = () => {
      if (reduceMotion.matches) {
        stackState.x = stackState.targetX;
        stackState.y = stackState.targetY;
        applyStackTilt();
        return;
      }
      if (!stackState.tiltFrame) stackState.tiltFrame = window.requestAnimationFrame(animateStackTilt);
    };

    const renderStack = () => {
      const spread = stackState.open ? 1 : 0.12;
      stackLayers.forEach((layer, index) => {
        const direction = index % 2 === 0 ? -1 : 1;
        const x = direction * index * spread * 2.55;
        const y = -index * spread * 0.78;
        const z = index * spread * 7.2;
        const rotation = direction * index * spread * 1.02;
        const scale = 1 - index * (stackState.open ? 0.008 : 0.001);
        const opacity = index === 0 ? 1 : (stackState.open ? Math.max(0.2, 0.84 - index * 0.063) : 0.18);
        layer.style.zIndex = String(stackLayers.length - index);
        layer.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px," + z.toFixed(2) + "px) rotateZ(" + rotation.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
        layer.style.opacity = String(opacity);
        if (reduceMotion.matches) layer.style.transitionDuration = "1ms";
        else layer.style.removeProperty("transition-duration");
      });
      if (stackStatus) stackStatus.textContent = stackState.pinned ? "PINNED" : (stackState.open ? "ACTIVE" : "DRIFT");
      if (stackAction) stackAction.textContent = stackState.pinned ? "CLICK TO RELEASE ↗" : (stackState.open ? "CLICK TO PIN ↗" : "HOVER / CLICK TO PIN ↗");
      stackButton.setAttribute("aria-pressed", String(stackState.pinned));
      stackButton.setAttribute("aria-label", stackState.pinned ? "Release the floating image layers" : "Pin the floating image layers open");
      stackButton.classList.toggle("is-open", stackState.open);
      applyStackTilt();
    };

    stackButton.addEventListener("pointerenter", (event) => {
      stackState.hovered = true;
      if (event.pointerType !== "touch" && !stackState.pinned) stackState.open = true;
      renderStack();
    });
    stackButton.addEventListener("pointerleave", (event) => {
      stackState.hovered = false;
      if (!stackState.pinned) stackState.open = false;
      stackState.targetX = 0;
      stackState.targetY = 0;
      scheduleStackTilt();
      renderStack();
    });
    stackButton.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const rect = stackButton.getBoundingClientRect();
      stackState.targetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2));
      stackState.targetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2));
      scheduleStackTilt();
    }, { passive: true });
    stackButton.addEventListener("click", () => {
      stackState.pinned = !stackState.pinned;
      stackState.open = stackState.pinned || stackState.hovered;
      renderStack();
    });
    reduceMotion.addEventListener?.("change", () => {
      if (reduceMotion.matches) {
        if (stackState.tiltFrame) window.cancelAnimationFrame(stackState.tiltFrame);
        stackState.tiltFrame = 0;
        stackState.x = stackState.targetX;
        stackState.y = stackState.targetY;
      }
      renderStack();
    });
    renderStack();
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
