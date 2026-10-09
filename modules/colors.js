// Single bridge between the CSS design tokens (style.css :root) and D3.
// CSS owns the values. JS reads them at call time, so a palette change
// happens in one place. Read lazily (inside functions), never at import,
// so the stylesheet is guaranteed to be applied.

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const readRamp = (prefix, n) => Array.from({ length: n }, (_, i) => cssVar(`${prefix}${i}`));

// Bilateral choropleth: 7 steps (0 = no partners ... 6 = 6+)
export const amberRamp = () => readRamp("--seq-amber-", 7);

// Multilateral choropleth: 4 steps (0 = none ... 3 = 3+)
export const tealRamp = () => readRamp("--seq-teal-", 4);

// Hover shade of each amber step, derived rather than hand-maintained
export const amberHoverRamp = () => amberRamp().map((c) => d3.color(c).brighter(0.4).formatHex());

// Fixed map roles, resolved once per draw call
export function getMapColors() {
  const amber = amberRamp();
  const teal = tealRamp();
  return {
    amber,
    teal,
    tealInk: cssVar("--seq-teal-ink"), // hovered country in the multilateral overview
    partnerSelected: amber[4], // selected partner / EU members
    partnerHighlight: amber[2], // African partners of the selection
    partnerHover: amber[3], // overview hover on partner countries
    blocNonAfrican: teal[3],
    blocAfrican: teal[2],
    mapDefault: cssVar("--color-map-default"),
    mapStroke: cssVar("--color-map-stroke"),
  };
}
