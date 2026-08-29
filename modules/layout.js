export function removeThirdColumn() {
  document.querySelector('.right')?.classList.replace('d-block', 'd-none');
  document.dispatchEvent(new CustomEvent("panel:toggled"));
}

export function showThirdColumn() {
  document.querySelector('.right')?.classList.replace('d-none', 'd-block');
  document.dispatchEvent(new CustomEvent("panel:toggled"));
}