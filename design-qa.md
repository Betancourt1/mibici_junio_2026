# Design QA

## Comparison setup

- Source visual truth: `/Users/betancourt/.codex/generated_images/019f879d-6a06-7412-8376-f7989782442b/exec-b9930e4c-8d49-4c88-a21b-853dd877b8d7.png` (1717 × 916 px).
- Desktop implementation: `/tmp/mibici-desktop-final.png` (1440 × 1024 px; 1440 × 1024 CSS viewport; density 1).
- Phone implementation, expanded: `/tmp/mibici-mobile-expanded-final.png` (390 × 844 px; 390 × 844 CSS viewport; density 1).
- Phone implementation, collapsed: `/tmp/mibici-mobile-collapsed.png` (390 × 844 px; 390 × 844 CSS viewport; density 1).
- Combined comparison evidence: `/tmp/mibici-design-compare.png` (1500 × 1100 px). The desktop source and implementation were normalized to 720 × 512; the phone pair to 234 × 506.
- State: dark theme, 17 June 2026, 18:24:32, arrow symbols, both gender filters active, controls open for desktop and expanded-phone comparison.

## Findings

- P0: none.
- P1: none.
- P2: none after iteration.
- P3: the implemented histogram uses one neutral teal series with a yellow current-time marker instead of dividing bars into decorative gender-colored stretches. This is intentional: the chart represents the currently filtered active-trip total and avoids implying that a time block belongs to only one gender.
- P3: the implementation preserves the product's existing zoom level and real trip density; the mock's map crop and rider placement are compositional rather than data requirements.

## Required fidelity surfaces

- Fonts and typography: system sans-serif, compact labels, bold yellow time/count, and tabular numerals preserve the mock hierarchy without wrapping the desktop brand.
- Spacing and layout: desktop uses a controls-only 300 px dock and persistent bottom rail; phone uses a persistent rail plus a collapsed brand bar or complete bottom sheet. The rail and map controls do not overlap.
- Colors and tokens: dark map, near-black translucent surfaces, muted borders, yellow playback emphasis, teal/magenta riders, and white map controls match the selected direction. Light-theme tokens remain supported.
- Image and asset quality: the live CARTO map, canvas-rendered data, and Phosphor controls remain crisp at both tested sizes; no raster placeholders or improvised icons were introduced.
- Copy and content: controls contain date, playback speed, Flecha/Punto, and Mujer/Hombre only. Time, 96-bin day distribution, and active count live in the independent rail.

## Comparison history

1. Initial desktop capture found a P2 brand wrap caused by fitting two header actions beside the title. The title size was tightened and `white-space: nowrap` added. The revised 1440 × 1024 capture shows a single-line brand.
2. Initial expanded-phone capture found a P2 overflow: the gender buttons were below the visible sheet. Playback was converted to one compact play-and-speed row and phone control spacing was reduced. The revised 390 × 844 capture shows every filter without scrolling (`scrollHeight` equals visible panel height; gender controls end at y=832).
3. Post-fix combined comparison found no remaining actionable P0/P1/P2 mismatch.

## Functional and responsive checks

- Desktop and phone rails each render 96 activity bars, the current time, the live count, and the full-day slider.
- The collapsed phone state keeps the rail visible above the brand bar; the expanded state keeps it visible above the controls sheet.
- The expanded phone sheet contains all controls without scrolling.
- Continuous pinch test: a two-pointer spread showed `scale(1.6)` during the gesture while React stayed at zoom 13; release committed fractional zoom 13.7 and cleared the temporary transform.
- Fractional tile rendering remained active after release (observed tile width 204.8 px at zoom 13.7).
- Map navigation and playback rail do not overlap at 1440 × 1024 or 390 × 844.
- Browser console: no warnings or errors.
- Native physical-device multitouch remains advisable as a final hardware smoke test because automated verification used two synthetic touch pointers.

Focused region evidence was included for the playback rail and phone sheet in the combined comparison; no further crop was needed because their labels and controls remain readable at the normalized sizes.

final result: passed
