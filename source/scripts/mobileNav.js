export default function() {
    jQuery('.mobile-nav--see-all-button').on('click', function ($el) {
        var protocol = 'https://';
        var host = 'kammok.com';
        var categoryName = jQuery($el.target).attr('data-category-name').toLowerCase();
        var categoryUrl = protocol.concat(host).concat('/collections/').concat(categoryName);
        document.location = categoryUrl;
    });

    jQuery('.dropdown-target').click(function (e) {
        e.preventDefault();
        var $dropdown = $('.' + $(this).attr('data-dropdown'));
        if (!$dropdown.is(e.target) && $dropdown.has(e.target).length === 0) {
            $(this).toggleClass('expanded');
            $dropdown.toggleClass('hide');
        }

    });

};
