$(document).ready(() => {
    var $grid = $('.grid').isotope({});
    $('#top-rated').click(() => {
        $grid.isotope({ filter: '.transition' })
    });
    $('#worst-rated').click(() => {
        $grid.isotope({ filter: '.worst-rated' })
    })
    $('#all-bands').click(() => {
        $grid.isotope({ filter: '' })
    })
});