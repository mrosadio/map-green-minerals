export function removeThirdColumn() {
    //let secondColumn = document.getElementById('map');
    // thirdColumn.classList.add('hidden');
    // secondColumn.classList.add('expanded');
    let right = document.querySelector('.right');

    let thirdColumn = document.querySelector('.third-col');
    let contenido = document.querySelector('.card.partnership');
    contenido.classList.remove('expanded');

    right.classList.remove('bilateral');

    thirdColumn.classList.remove('nuevo');
}

export function showThirdColumn() {

    let thirdColumn = document.querySelector('.third-col');
    let right = document.querySelector('.right');
    let contenido = document.querySelector('.card.partnership');
    contenido.classList.add('expanded');
    right.classList.add('bilateral');
    thirdColumn.classList.add('nuevo');
}