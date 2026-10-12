# RM® — Spatial Cube

A single-page, responsive interactive engineering showcase centered on a six-face 3D image cube.

## Run locally

This is a dependency-free static site. From the repository root:

```bash
python3 -m http.server 8083
```

Open `http://localhost:8083/`.

## Interaction

- Pointer position maps to full-range X/Y cube rotation.
- Six image planes shift independently for a layered parallax effect.
- Motion is eased through a single `requestAnimationFrame` loop.
- Includes touch input, keyboard arrows, reset control, and reduced-motion support.
- The page is divided into the interactive hero, mechanics, six-surface gallery, and closing section.
- No runtime CDN or third-party runtime dependency.

The original Image Stack and Cube experiments remain in `experiences/`.
