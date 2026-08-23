export function removeThirdColumn() {
  document.querySelector('.right')?.classList.replace('d-flex', 'd-none');

    // let right = document.querySelector('.right');

    // let thirdColumn = document.querySelector('.third-col');
    // let contenido = document.querySelector('.card.partnership');
    // contenido.classList.remove('expanded');

    // right.classList.remove('bilateral');

    // thirdColumn.classList.remove('nuevo');
}

export function showThirdColumn() {
  document.querySelector('.right')?.classList.replace('d-none', 'd-flex');
  document.querySelector('.third-col').classList.add('col-3');

    // let thirdColumn = document.querySelector('.third-col');
    // let right = document.querySelector('.right');
    // let contenido = document.querySelector('.card.partnership');
    // contenido.classList.add('expanded');
    // right.classList.add('bilateral');
    // thirdColumn.classList.add('nuevo');
}