// Keep these media queries in sync with style.css.
// Bootstrap's md breakpoint starts AT 768px, so "below tablet" is max-width 767.98px:
// a plain 768px would make exactly-768px devices (iPad Mini 5, iPad 9.7") a phone.
export const PHONE_QUERY = "(max-width: 767.98px)";
export const STACKED_QUERY = "(max-width: 767.98px), (min-width: 768px) and (max-width: 1366px) and (orientation: portrait)";
// The wheel picker is for real phones only. Tablets (even narrow ones) use the dropdown.
export const PICKER_QUERY = "(max-width: 600px)";
export const isPhone = () => window.matchMedia(PHONE_QUERY).matches;
export const isPickerLayout = () => window.matchMedia(PICKER_QUERY).matches;
// Phone held sideways: short, landscape, touch. `pointer: coarse` keeps it off
// short desktop windows (e.g. DevTools docked at the bottom)
export const LANDSCAPE_PHONE_QUERY = "(orientation: landscape) and (max-height: 500px) and (pointer: coarse)";
export const isStackedLayout = () => window.matchMedia(STACKED_QUERY).matches;
export function removeThirdColumn() {
  document.querySelector('.right')?.classList.replace('d-block', 'd-none');
}

export function showThirdColumn() {
  document.querySelector('.right')?.classList.replace('d-none', 'd-block');
}