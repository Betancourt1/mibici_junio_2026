# Design QA

## Comparison setup

- Source visual truth: `/Users/betancourt/.codex/generated_images/019f879d-6a06-7412-8376-f7989782442b/exec-4f1385ac-2dcd-463f-ba22-4e24db46033e.png` (1559 × 1009 px).
- Desktop implementation, city view: `/tmp/mibici-halo-desktop-final.png` (1440 × 1024 px; 1440 × 1024 CSS viewport; density 1).
- Desktop implementation, trail detail: `/tmp/mibici-halo-desktop-close.png` (1440 × 1024 px; 1440 × 1024 CSS viewport; density 1; zoom level 16).
- Phone implementation: `/tmp/mibici-halo-mobile-final.png` (390 × 844 px; 390 × 844 CSS viewport; density 1).
- Final live-review capture: `/tmp/mibici-halo-handoff.png` (1440 × 1024 px; 1440 × 1024 CSS viewport; density 1; zoom level 16).
- Full-view comparison evidence: `/tmp/mibici-halo-comparison.png` (1568 × 528 px). Source and implementation were normalized into equal 768 × 512 tiles before comparison.
- Focused trail comparison evidence: `/tmp/mibici-halo-focus-comparison.png` (1832 × 329 px). Matching map bands from the source and implementation were placed in one image to inspect the halo edge, inner fill, fade, and arrow sharpness.
- State: dark theme, 17 June 2026, 18:24:32, arrow riders, 60× speed, gender colors, and the previous five simulated minutes of movement.

## Findings

- P0: none.
- P1: none.
- P2: none after iteration.
- P3: the generated mock uses a deliberately sparse rider set and a photographic Gaussian bloom. The live view uses the complete replay data, so overlapping halos are denser. The implementation keeps the same visual hierarchy by lowering halo opacity while preserving crisp arrows.
- P3: the live halo uses two broad translucent layers instead of a per-segment blur filter. The visual remains line-free, but this constraint prevents the severe animation slowdown observed with the literal blur implementation.

## Required fidelity surfaces

- Fonts and typography: unchanged from the previously approved HUD; title, time, speed, count, and legend retain their family, weight, sizing, and wrapping.
- Spacing and layout rhythm: no layout code changed. Desktop and 390 × 844 phone controls preserve their approved positions, and the expanded phone HUD ends exactly at the viewport bottom without covering the map controls.
- Colors and visual tokens: women remain `#ff4d9d`, men remain `#2bd6cc`, and each trail uses only low-opacity versions of its rider color. No neutral or white centerline is introduced.
- Image and asset quality: the CARTO basemap, Canvas 2D stations, and Phosphor interface icons remain unchanged. The halo is rendered natively on the rider canvas and adds no raster asset or improvised icon.
- Copy and content: no text changed. Date, time, playback speed, active-rider count, and the gender legend remain data-derived.

## Comparison history

1. The first implementation used a blurred Canvas stroke. It visually matched the mock, but playback with 288 active riders blocked interaction and caused screenshot capture to time out.
2. The blur filter was removed and replaced by two wide, low-opacity trail layers with a quadratic age fade. The post-fix capture shows a soft color haze without a bright inner line, while arrowheads remain crisp.
3. Desktop and phone playback then remained responsive during one-second motion checks, and screenshots completed immediately.
4. The final full-view and focused comparisons found no remaining actionable P0/P1/P2 mismatch.

## Functional and responsive checks

- The production build passes with Vite 8.
- Desktop and phone playback run at the default 60× speed without blocking the interface.
- Every rider remains an arrow; only its five-minute history is rendered as a halo.
- The compact phone HUD and expanded date/speed HUD both remain usable at 390 × 844. Expanded HUD geometry is 390 × 310 px; map navigation ends at its upper edge without overlap.
- Theme switching passes in both directions, and trail colors retain their gender mapping.
- Browser console: no warnings or errors.

final result: passed
