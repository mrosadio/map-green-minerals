// Keep these media queries in sync with style.css
export const isPhone = () => window.matchMedia("(max-width: 768px)").matches;
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