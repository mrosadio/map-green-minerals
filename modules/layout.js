export function removeThirdColumn() {
  document.querySelector('.right')?.classList.replace('d-block', 'd-none');
}

export function showThirdColumn() {
  document.querySelector('.right')?.classList.replace('d-none', 'd-block');
}