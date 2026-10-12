# RM — Interactive Engineering Studio

RM is a dark, motion-led personal studio for interactive web experiments, selected work, reusable components, and educational content.

## Current experience

- **RM home** — studio identity, intro, selected interactions, and clear paths into the lab.
- **Image Stack** — layered-image interaction with shape, rotation, blur, monochrome, opacity, parallax, and 3D controls.
- **Spatial Cube** — pointer/touch-driven 3D image cube with keyboard fallback.
- **Offline-first** — local styles, scripts, and artwork; no runtime CDN or remote font dependency.

## Run locally

Because this is a static site, no package installation is required.

```bash
python3 -m http.server 8083
```

Open `http://localhost:8083/`.

## Structure

```text
/
├── index.html
├── assets/
│   ├── rm.css
│   ├── rm.js
│   └── images/
└── experiences/
    ├── image-stack/
    └── cube-3d/
```

## Motion implementation note

The uploaded Image Stack archive included a local runtime that imitates the subset of the GSAP API used by that demo; it did not contain the official GSAP distribution. The Cube archive uses native JavaScript and `requestAnimationFrame`. This repository keeps both experiences dependency-free and locally served. The code is structured so official GSAP can be introduced as a build-time dependency later, without a CDN dependency in production.

## Design direction

Matte black surfaces, high-contrast editorial typography, graphite details, and restrained chromatic light (violet, blue, cyan, magenta, and amber). No acid-green accent.
