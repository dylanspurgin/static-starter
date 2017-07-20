export default function() {

    const $forms = $('.js-form');

    const rules = {
        'enter-form': [
            {
                name: 'email',
                display: 'email address',
                rules: 'required|valid_email'
            },
            {
                name: 'zip',
                display: 'zip code',
                rules: 'required|minlength[5]|maxlength[5]'
            },
            {
                name: 'terms',
                display: 'terms and conditions',
                rules: 'required'
            }
        ]
    };

    if ($forms) {

        $.each($forms, function(i, form) {
            const $form = $(form);
            const formName = $form.attr('name');
            const $success = $form.next();
            const $error = $success.next();
            const $submitButton = $form.find('button[type="submit"]');

            var validator = new FormValidator(formName, rules[formName], function(errors, event) {

                if (errors.length > 0) {
                    event.preventDefault();
                    let errorHtml = '';
                    errors.forEach(function (error) {
                        errorHtml += '<li class="ojai-form-error">'+error.message+'</li>';
                    });
                    $error.html(errorHtml);
                    $error.show();
                }
                // else {
                //     $error.html('').hide();
                //     $submitButton.prop('disabled', true);
                //     $.post($form.attr('action'), $form.serialize())
                //         .then(function() {
                //             $form.hide();
                //             $success.show();
                //         })
                //         .catch(function () {
                //             var errorHtml = '<li class="ojai-form-error">There was an error submitting your entry. Please try again.</li>';
                //             $error.html(errorHtml);
                //             $error.show();
                //             $submitButton.prop('disabled', false);
                //         });
                // }
            });

        });
    }
}
