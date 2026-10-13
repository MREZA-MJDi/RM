# RM® — Spatial Scene

A single-page, responsive interactive engineering showcase that combines a six-face 3D image cube and a floating ten-layer image stack in one continuous hero scene. Both objects keep their own interaction instead of being decorative screenshots.

## Run locally

This is a dependency-free static site. From the repository root:

```bash
python3 -m http.server 8083
```

Open `http://localhost:8083/`.

## Interaction

- Move the pointer across the page to rotate the six-face cube on its X/Y axes.
- The cube's six image planes shift independently for a layered parallax effect.
- The ten-layer image stack floats independently in the same hero scene.
- Hover the stack to fan its layers apart; click it to pin or release the expanded state. It also works with keyboard activation.
- Use the cube's reset control or arrow keys to change/reset the view.
- Motion respects `prefers-reduced-motion`; touch interactions and responsive layouts are supported.
- The existing mechanics, six-surface gallery, and closing sections remain below the interactive hero.
- No runtime CDN, npm install, or third-party runtime dependency is required.

The original standalone Image Stack and Cube experiments remain in `experiences/`.
