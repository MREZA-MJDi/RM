(() => {
  "use strict";
  const scene = document.querySelector("[data-cube-scene]");
  const cube = document.querySelector("[data-cube]");
  const readout = document.querySelector("[data-readout]");
  const reset = document.querySelector("[data-reset-cube]");
  if (!scene || !cube) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = { x: -22, y: -28, targetX: -22, targetY: -28, frame: 0, lastTime: 0, dragging: false, pointerX: 0, pointerY: 0, dragX: -28, dragY: -22 };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const render = () => {
    cube.style.transform = "rotateX(" + state.x.toFixed(2) + "deg) rotateY(" + state.y.toFixed(2) + "deg)";
    if (readout) readout.textContent = "ROT X " + Math.round(state.x) + "°  /  ROT Y " + Math.round(state.y) + "°";
  };
  const animate = (time) => {
    state.frame = 0;
    const dt = state.lastTime ? Math.min(time - state.lastTime, 50) : 16;
    state.lastTime = time;
    const easing = 1 - Math.exp(-dt / 115);
    state.x += (state.targetX - state.x) * easing;
    state.y += (state.targetY - state.y) * easing;
    render();
    if (Math.abs(state.targetX - state.x) > .04 || Math.abs(state.targetY - state.y) > .04) state.frame = requestAnimationFrame(animate);
    else { state.x = state.targetX; state.y = state.targetY; state.lastTime = 0; render(); }
  };
  const moveTo = (x, y, immediate) => {
    state.targetX = clamp(x, -360, 360);
    state.targetY = clamp(y, -360, 360);
    if (reduceMotion.matches || immediate) { state.x = state.targetX; state.y = state.targetY; render(); return; }
    if (!state.frame) state.frame = requestAnimationFrame(animate);
  };
  const pointerTarget = (event) => {
    const rect = scene.getBoundingClientRect();
    const nx = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const ny = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    moveTo(-18 + (ny - .5) * 52, -28 + (nx - .5) * 82, false);
  };

  scene.addEventListener("pointermove", (event) => {
    if (state.dragging) {
      const dx = event.clientX - state.pointerX;
      const dy = event.clientY - state.pointerY;
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
      state.dragY += dx * .68;
      state.dragX -= dy * .68;
      moveTo(state.dragX, state.dragY, false);
      return;
    }
    if (event.pointerType !== "touch") pointerTarget(event);
  }, { passive: true });

  scene.addEventListener("pointerdown", (event) => {
    state.dragging = true;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    state.dragX = state.targetX;
    state.dragY = state.targetY;
    scene.classList.add("is-dragging");
    scene.focus({ preventScroll: true });
    try { scene.setPointerCapture(event.pointerId); } catch (_) {}
  });
  const endDrag = (event) => {
    state.dragging = false;
    scene.classList.remove("is-dragging");
    try { if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId); } catch (_) {}
  };
  scene.addEventListener("pointerup", endDrag);
  scene.addEventListener("pointercancel", endDrag);
  scene.addEventListener("pointerleave", (event) => {
    if (!state.dragging && event.pointerType !== "touch") moveTo(-22, -28, false);
  });

  scene.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 22 : 10;
    if (event.key === "ArrowLeft") { event.preventDefault(); moveTo(state.targetX, state.targetY - step, false); }
    else if (event.key === "ArrowRight") { event.preventDefault(); moveTo(state.targetX, state.targetY + step, false); }
    else if (event.key === "ArrowUp") { event.preventDefault(); moveTo(state.targetX - step, state.targetY, false); }
    else if (event.key === "ArrowDown") { event.preventDefault(); moveTo(state.targetX + step, state.targetY, false); }
    else if (event.key === "Home") { event.preventDefault(); resetCube(); }
  });

  function resetCube() {
    state.dragX = -22;
    state.dragY = -28;
    moveTo(-22, -28, false);
  }
  reset?.addEventListener("click", resetCube);
  reduceMotion.addEventListener?.("change", () => {
    if (reduceMotion.matches) moveTo(state.targetX, state.targetY, true);
  });

  cube.querySelectorAll("img").forEach((image) => image.addEventListener("error", () => {
    image.style.display = "none";
    image.parentElement.style.background = "linear-gradient(135deg,#26232e,#121216)";
    console.error("RM cube asset failed to load:", image.getAttribute("src"));
  }, { once: true }));

  render();
})();