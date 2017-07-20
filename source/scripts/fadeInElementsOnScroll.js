export default function() {
    const elementsToFadeIn = document.getElementsByClassName('js-fadeInOnScroll');
    for (let i = 0; i < elementsToFadeIn.length; i++) {
        // hide the elements that will be faded in on scroll.
        // we're not doing with CSS just in case this script
        // doesn't load.
        $(elementsToFadeIn[i]).css('visibility', 'hidden');
        // show the elements at the given waypoint
        let waypoint = new Waypoint({
            element: elementsToFadeIn[i],
            handler: function() {
                $(this.element)
                    .css('visibility', 'visible') // make the element visible
                    .addClass('fadeIn'); // use animate.css for consistent animations
            },
            offset: function() {
                // show the element when it's 50% visible
                return (this.context.innerHeight() - this.adapter.outerHeight() + (this.element.offsetHeight * .5));
            }
        });
    }
}
