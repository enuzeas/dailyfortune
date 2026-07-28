# Design reference: html.non.io/tarot

Source: https://html.non.io/tarot/ (vanilla HTML/CSS/JS — `css/style.css`, `js/card.js`)

## Technique inventory

- **WebGL2 PBR relighting** — a transparent `<canvas>` sits over the card image. A fragment shader reads diffuse/normal/roughness/height maps; the pointer position becomes a moving candle-warm key light with per-pixel parallax (from the height map) and roughness-shaped specular highlights. Falls back to a plain `<img>` if WebGL2 isn't available.
- **3D tilt** — `perspective` + `transform-style: preserve-3d` on a mount div. Pointer offset maps to `rotateX/rotateY`, smoothed every animation frame via `cur += (goal - cur) * 0.055` (lerp) instead of a CSS transition, plus a small idle sway (`Math.sin/cos`) so the card is never fully static.
- **Card flip** — classic `rotateY(180deg)` + `backface-visibility: hidden` two-face structure. The back face carries its own WebGL relighting layer.
- **Dynamic shadow** — a separate blurred div behind the card, translated opposite the current tilt angle; opacity/scale scale with how far off-axis the light is.
- **Draw animation** — a hand-rolled tween engine (`requestAnimationFrame` + `performance.now()`, no CSS transitions). The outgoing card is cloned into a `position: fixed` element and flies off-screen while flipping; the incoming card rises from off-screen back-first and flips face-up just before landing. Custom cubic easing (`1 - (1-p)^3`).
- **Accessibility / perf** — respects `prefers-reduced-motion` (disables all of the above); preloads/caches per-card textures in a `Map` so repeat draws never hit the network; caps devicePixelRatio at 2 for the WebGL canvas.

## Applicability to `fortune-app`

Current state: `app/components/FortuneCard.tsx` + `app/globals.css` already implement a Pokemon-holo-card style — CSS custom-property-driven pointer tilt, `rotateY` flip, rainbow holo-shine/glare via `mix-blend-mode`. Visual language is pop-art bento (bright lime/lavender/mustard on void-black), intentionally different from the tarot site's moody mystical tone.

**Worth adding (cheap, fits existing structure):**
- Idle sway — add a small `sin/cos` rAF loop to the existing `--tilt-x`/`--tilt-y` state so the card isn't fully static when the pointer is away.
- Dynamic drop shadow — one more div translated opposite `--tilt-x`/`--tilt-y`, currently missing entirely.
- `prefers-reduced-motion` handling — not implemented anywhere in `fortune-app` yet; cheap accessibility win.

**Optional upgrade:**
- Replace the CSS `transition`-based tilt smoothing with a JS lerp loop, so the shadow and tilt stay physically consistent frame-to-frame. Not required — the current transition already looks fine.
- Fly-out/fly-in clone animation for the draw. Nice-to-have; the existing flip already covers the core interaction.

**Not recommended:**
- WebGL2 PBR shader (normal/roughness/height maps) — large lift for a course project. The existing CSS `mix-blend-mode` holo-glare already achieves "the card feels alive" at a fraction of the complexity; don't add a rendering pipeline to chase the same goal.
- Copying the tarot site's palette/typography wholesale — `fortune-app`'s pop-art bento look is a deliberate, different aesthetic; porting the moody serif/gold palette would clash with it.
