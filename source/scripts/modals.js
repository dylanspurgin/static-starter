export default function() {
    var $modalTriggers = $('.modal-target');
    if ($modalTriggers) {
        $.each($modalTriggers, function() {
            $(this).click(function (e) {
                e.preventDefault();
                var target = $(this).attr('data-modal-target');
                var $modal = $('.'+target);
                $modal.css({display: 'flex'});
                addCloseHandlers($modal);
            })
        });
    }

    function addCloseHandlers ($backdrop) {
        var $modal = $backdrop.find('.modal__panel');
        var $closeButton = $('.modal__close-button');
        $backdrop.on('click', function (e) {
            if ($closeButton.is(e.target) || (!$modal.is(e.target) && $modal.has(e.target).length === 0)) {
                $('.modal').hide();
            }
        });
    }


}
