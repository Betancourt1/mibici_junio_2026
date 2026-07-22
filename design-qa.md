# Design QA

## Comparison setup

- Source: `codex-clipboard-d532e3bc-0aab-48d4-9a70-e485fb0c24db.png` at 3420 × 2214.
- Implementation: `/tmp/mibici-zoom-desktop.png` at a 1280 × 720 desktop viewport.
- Responsive check: `/tmp/mibici-zoom-mobile.png` at a 390 × 844 phone viewport.
- Focused side-by-side comparison: `/tmp/mibici-controls-comparison.png`.
- State: dark map, sidebar open on desktop, sidebar collapsed on phone, zoom level 13.

The supplied screenshot is a component reference from a different map product, so the focused comparison isolates the recenter and zoom controls instead of treating unrelated map imagery and browser chrome as implementation targets.

## Visual comparison

- Structure: the recenter control is detached above a joined vertical zoom stack.
- Shape: white rounded surfaces, a subtle border, and a soft elevation shadow match the reference treatment.
- Icons: bold black Phosphor crosshair, plus, and minus icons preserve the source hierarchy without recreating screenshot pixels.
- Divider: a thin neutral rule separates zoom-in from zoom-out.
- Placement: controls sit 18 px from the desktop right edge and 22 px from the bottom; on phones they remain 12 px from the right and clear the collapsed or expanded control panel by at least 12 px.
- Size: the requested 20% reduction produces 46 × 46 px desktop buttons and 42 × 42 px phone buttons, with icons reduced proportionally.
- Typography and copy: the reference controls contain no visible labels, so the implementation uses icon-only buttons with accessible Spanish labels.

## Functional and responsive checks

- Exactly two rider-symbol choices are rendered: Flecha and Punto.
- Exactly two gender choices are rendered: Mujer and Hombre.
- No birth-year inputs are present.
- Zoom-in changes the accessible level from 13 to 14; recenter returns it to 13.
- Rider hover details include user ID, approximate age, origin, and destination.
- All three map buttons render at 42 × 42 px on a 390 px-wide phone viewport and maintain a 14 px gap above the collapsed panel.
- Browser console: no warnings or errors.

## Issue review

- P0: none.
- P1: none.
- P2: none.
- P3: none.

Final result: passed
