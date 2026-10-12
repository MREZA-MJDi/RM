(() => {
  "use strict";
  const stage = document.querySelector("[data-image-stage]");
  const stack = document.querySelector("[data-image-stack]");
  if (!stage || !stack) return;

  const layers = Array.from(stack.querySelectorAll(".image-layer"));
  const shapeButtons = Array.from(document.querySelectorAll("[data-shape-picker] [data-shape]"));
  const effectButtons = Array.from(document.querySelectorAll("[data-effect]"));
  const tuner = document.querySelector("[data-tuner]");
  const stateLabel = document.querySelector("[data-stage-state]");
  const shapeLabel = document.querySelector("[data-shape-value]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = { open: false, shape: "rectangle", rotation: false, blur: false, color: false, opacity: false, parallax: false, threeD: false, tilt: 22, pan: 52, depth: 28, amp: .58, x: 0, y: 0, frame: 0, pointer: null };

  layers.forEach((layer, index) => {
    layer.style.setProperty("--layer-index", String(index));
    layer.style.setProperty("--layer-angle", ((index % 2 ? -1 : 1) * index * 1.7) + "deg");
    layer.style.zIndex = String(layers.length - index);
    layer.style.setProperty("--layer-depth", String(index * state.depth));
  });

  function applyLayerPose() {
    const box = stage.getBoundingClientRect();
    const spread = state.open ? 1 : 0;
    const reduce = reducedMotion.matches;
    layers.forEach((layer, index) => {
      const depth = index * state.depth * (state.threeD ? 1 : .12) * spread;
      const s = Math.max(.73, 1 - index * .025);
      const angle = state.rotation && state.open ? (index % 2 ? -1 : 1) * (index * 1.9) : 0;
      const side = state.parallax && state.open ? state.x * state.pan * state.amp * Math.min(index, 5) / 5 : 0;
      const lift = state.parallax && state.open ? state.y * state.pan * state.amp * Math.min(index, 5) / 5 : 0;
      const normalY = state.open ? index * 1.5 : 0;
      const normalX = state.open ? (index % 2 ? -1 : 1) * index * 1.1 : 0;
      layer.style.setProperty("--layer-depth", String(depth));
      layer.style.transform = "translate3d(" + (side + normalX) + "px," + (lift + normalY) + "px," + depth + "px) rotateZ(" + angle + "deg) scale(" + (state.open ? s : (index === 0 ? 1 : .985)) + ")";
      let opacity = index === 0 ? 1 : (state.open ? Math.max(.14, .78 - index * .065) : 0);
      if (state.opacity && index > 0) opacity *= .66;
      layer.style.opacity = String(opacity);
      layer.style.filter = (state.blur && index > 1 ? "blur(" + Math.min(3.2, index * .28) + "px) " : "") + (state.color ? (index % 3 === 0 ? "grayscale(.15) saturate(.6)" : "grayscale(1)") : "");
      layer.style.transitionDuration = reduce ? "1ms" : (state.open ? (0.46 + index * .035) + "s" : (0.32 + index * .018) + "s");
    });
    stack.style.transform = state.threeD && !reduce ? "perspective(1000px) rotateX(" + (-state.y * state.tilt) + "deg) rotateY(" + (state.x * state.tilt) + "deg)" : "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    stage.style.setProperty("--pointer-x", state.x.toFixed(3));
    stage.style.setProperty("--pointer-y", state.y.toFixed(3));
    stage.style.setProperty("--rx", (-state.y * state.tilt) + "deg");
    stage.style.setProperty("--ry", (state.x * state.tilt) + "deg");
    if (stateLabel) stateLabel.textContent = state.open ? "INTERACTING" : "READY TO MOVE";
  }

  function applyMode(key, value) {
    state[key] = value;
    stage.setAttribute("data-" + (key === "threeD" ? "three-d" : key), String(value));
    if (key === "threeD") {
      if (tuner) tuner.hidden = !value;
      if (value && state.parallax) {
        state.parallax = false;
        stage.dataset.parallax = "false";
        const button = document.querySelector('[data-effect="parallax"]');
        if (button) button.setAttribute("aria-pressed", "false");
      }
    }
    if (key === "parallax" && value && state.threeD) {
      state.threeD = false;
      stage.dataset.threeD = "false";
      const button = document.querySelector('[data-effect="threeD"]');
      if (button) button.setAttribute("aria-pressed", "false");
      if (tuner) tuner.hidden = true;
    }
    applyLayerPose();
  }

  function setOpen(value) {
    state.open = value;
    stage.classList.toggle("is-open", value);
    applyLayerPose();
  }

  stage.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") setOpen(true);
  });
  stage.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch" && !stage.contains(document.activeElement)) setOpen(false);
    state.pointer = null;
  });
  stage.addEventListener("focus", () => setOpen(true));
  stage.addEventListener("blur", (event) => {
    if (!stage.contains(event.relatedTarget)) setOpen(false);
  });
  stage.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    state.pointer = event;
    if (state.frame) return;
    state.frame = requestAnimationFrame(() => {
      state.frame = 0;
      if (!state.pointer) return;
      const rect = stage.getBoundingClientRect();
      state.x = Math.max(-1, Math.min(1, ((state.pointer.clientX - rect.left) / rect.width - .5) * 2));
      state.y = Math.max(-1, Math.min(1, ((state.pointer.clientY - rect.top) / rect.height - .5) * 2));
      applyLayerPose();
      state.pointer = null;
    });
  }, { passive: true });
  stage.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") { setOpen(!state.open); }
  }, { passive: true });

  shapeButtons.forEach((button) => button.addEventListener("click", () => {
    state.shape = button.dataset.shape;
    stage.dataset.shape = state.shape;
    shapeButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    if (shapeLabel) shapeLabel.textContent = state.shape.toUpperCase();
  }));

  effectButtons.forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.effect;
    const next = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(next));
    applyMode(key, next);
  }));

  document.querySelectorAll("[data-tune]").forEach((input) => {
    const key = input.dataset.tune;
    const output = document.querySelector('[data-output="' + key + '"]');
    const update = () => {
      const number = Number(input.value);
      if (key === "amp") state.amp = number / 100;
      else state[key] = number;
      if (output) output.value = key === "amp" ? state.amp.toFixed(2) : number + (key === "tilt" ? "°" : "px");
      applyLayerPose();
    };
    input.addEventListener("input", update);
    update();
  });

  document.querySelector("[data-reset]")?.addEventListener("click", () => {
    state.rotation = state.blur = state.color = state.opacity = state.parallax = state.threeD = false;
    state.shape = "rectangle"; state.tilt = 22; state.pan = 52; state.depth = 28; state.amp = .58; state.x = state.y = 0;
    stage.dataset.shape = "rectangle";
    ["rotation","blur","color","opacity","parallax","threeD"].forEach((key) => {
      const button = document.querySelector('[data-effect="' + key + '"]');
      if (button) button.setAttribute("aria-pressed", "false");
    });
    shapeButtons.forEach((button) => {
      const active = button.dataset.shape === "rectangle";
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (shapeLabel) shapeLabel.textContent = "RECTANGLE";
    document.querySelectorAll("[data-tune]").forEach((input) => {
      input.value = ({tilt:22,pan:52,depth:28,amp:58})[input.dataset.tune];
      input.dispatchEvent(new Event("input", {bubbles:true}));
    });
    if (tuner) tuner.hidden = true;
    applyLayerPose();
  });

  window.addEventListener("resize", () => {
    state.x = Math.max(-1, Math.min(1, state.x));
    state.y = Math.max(-1, Math.min(1, state.y));
    applyLayerPose();
  }, { passive: true });
  reducedMotion.addEventListener?.("change", applyLayerPose);
  applyLayerPose();
})();