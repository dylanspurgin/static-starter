export default function() {
    const $stickyNav = $('.js-stickyNav');

    if ($stickyNav) {
        const height = $stickyNav.outerHeight();
        $stickyNav.parent().height(height);

        let waypoint = new Waypoint({
            element: $('.js-showNav'),
            handler: function() {
                $stickyNav.toggleClass('is-sticky');
            },
            offset: 0
        });
    }
}
