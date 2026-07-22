# Design QA

## Comparison setup

- Source visual truth: `/var/folders/yg/rt8w41_56d30cbn9r6gbggyw0000gn/T/codex-clipboard-3d910502-5b3c-4615-93e4-86a3bc585859.png` and its original generated result `/Users/betancourt/.codex/generated_images/019f879d-6a06-7412-8376-f7989782442b/exec-990b30e1-e0c2-4ffb-b077-eeb7daab7c1d.png` (1536 × 1024 px).
- Desktop implementation: `/tmp/mibici-selected-desktop-final.png` (1440 × 1024 px; 1440 × 1024 CSS viewport; density 1).
- Phone implementation, controls closed: `/tmp/mibici-selected-mobile-closed-final.png` (390 × 844 px; 390 × 844 CSS viewport; density 1).
- Phone implementation, controls open: `/tmp/mibici-selected-mobile-open-final.png` (390 × 844 px; 390 × 844 CSS viewport; density 1).
- Phone landscape implementation, controls open: `/tmp/mibici-selected-mobile-landscape-open-final.png` (844 × 390 px; 844 × 390 CSS viewport; density 1).
- Combined comparison evidence: `/tmp/mibici-selected-design-compare.png` (1152 × 1280 px). The source board was normalized to 1152 × 768; the implementation desktop and phone captures were normalized to 720 × 512 and 234 × 506 before being placed in the same comparison input.
- State: dark theme, 17 June 2026, 18:24:32, arrow-only riders, 60× default speed, both gender series visible as context, and five simulated minutes of trail history.

## Findings

- P0: none.
- P1: none.
- P2: none after iteration.
- P3: the generated mock shows 287 active riders while the real selected replay instant contains 288. Keeping the data-derived value is intentional and avoids adjusting real output to match illustrative mock data.
- P3: the generated mock's rider placement and map crop are compositional. The implementation preserves the real route set, current map center, station locations, and interactive zoom behavior.

## Required fidelity surfaces

- Fonts and typography: the implementation keeps the system sans-serif family, compact yellow title, tabular clock/count numerals, restrained supporting labels, and the mock's weight hierarchy without clipping or wrapping.
- Spacing and layout rhythm: desktop uses the selected bottom-left transport cluster plus an aligned bottom distribution rail; the phone keeps a 191 px closed HUD with Play always visible and expands upward to 310 px without covering Play. Portrait and landscape navigation controls remain clear of the HUD.
- Colors and visual tokens: the near-black map surface, yellow actions, magenta women, teal men, neutral aggregate histogram, low-opacity gender series, quiet dividers, and minimal elevation match the selected direction. Light mode retains the same semantic roles.
- Image and asset quality: the live CARTO basemap and Canvas 2D data remain crisp. Phosphor supplies all UI icons; no raster placeholder, improvised logo, CSS icon, or inline SVG was introduced.
- Copy and content: the visible controls are limited to `MiBici GDL`, replay date, Play/Pause, speed, current time, active riders, and the adjacent gender key. The symbol and gender filters are absent as requested.

## Comparison history

1. The first desktop render clipped the selected date and the gender key appeared as duplicated arrowheads. The date field was widened and the key was rebuilt as one dashed trail plus one arrow. The revised capture shows both labels clearly.
2. The first trail pass was too faint at the normal city zoom. Trail opacity and stroke width were raised while preserving a tapered, semitransparent five-simulated-minute window. The revised comparison keeps paths visible without competing with rider arrows.
3. The first expanded landscape check moved the map navigation above the viewport because the portrait offset had higher specificity. A landscape-specific expanded-state offset keeps the 42 px controls visible to the left of the sheet. The post-fix capture shows no collision.
4. The final combined comparison found no remaining actionable P0/P1/P2 mismatch.

## Functional and responsive checks

- The production build passes with Vite 8.
- Desktop and phone charts each render 96 aggregate bins, two gender comparison series, the current-time marker, and a full-day scrub target.
- Play is reachable with phone settings closed or open. At 60×, the browser-observed clock advanced from `18:24:32` to `18:25:11` during the playback check, and Pause stopped it.
- The phone settings toggle opens and closes the date/speed sheet; the selected date stays `17 JUN 2026`, the selected speed stays `60×`, and the 48 × 48 px Play target remains visible.
- Theme switching updates both application tokens and the CARTO tile source from `dark_all` to `light_all`, then returns to dark.
- Portrait HUD geometry is 390 × 191 px closed and 390 × 310 px open. Landscape uses a 390 px floating HUD; its map controls remain fully visible in both states.
- Browser console: no warnings or errors.
- The in-app browser cannot inject a simultaneous two-touch CDP gesture. The existing pointer-based pinch implementation was not changed by this redesign; a physical-device pinch remains the appropriate final hardware smoke test.

Focused evidence was captured for the closed phone HUD, expanded portrait sheet, and expanded landscape sheet because those states contain the highest collision risk. No further crop was required: their labels, targets, chart, and navigation controls are readable at native capture size.

final result: passed
