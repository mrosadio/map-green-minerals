// Keep these media queries in sync with style.css
export const isPhone = () => window.matchMedia("(max-width: 768px)").matches;
// Phone held sideways: short, landscape, touch. `pointer: coarse` keeps it off
// short desktop windows (e.g. DevTools docked at the bottom)
export const LANDSCAPE_PHONE_QUERY = "(orientation: landscape) and (max-height: 500px) and (pointer: coarse)";
export const isStackedLayout = () =>
  window.matchMedia("(max-width: 768px), (min-width: 769px) and (max-width: 1366px) and (orientation: portrait)").matches;
export function removeThirdColumn() {
  document.querySelector('.right')?.classList.replace('d-block', 'd-none');
  document.dispatchEvent(new CustomEvent("panel:toggled"));
}

export function showThirdColumn() {
  document.querySelector('.right')?.classList.replace('d-none', 'd-block');
  document.dispatchEvent(new CustomEvent("panel:toggled"));
}