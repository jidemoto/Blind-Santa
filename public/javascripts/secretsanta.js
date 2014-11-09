(function() {
    var propRegEx = /(\w+)(\d+)/,
        increment = function(prop) {
            var arr = propRegEx.exec(prop);
            arr[2] = Number(arr[2]) + 1;
            return arr.slice(1).join('');
        },addPerson = function() {
            var lastPerson = $('.form-group:last'),
                person = lastPerson.clone();

            person.find('input').val('').each(function() {
                var $this = $(this),
                    idAttr = $(this).attr('id'),
                    nameAttr = $this.attr('name'),
                    incrementedId = increment(idAttr),
                    incrementedName = increment(nameAttr);

                $this.attr('id', incrementedId);
                $this.attr('name', incrementedName);
                if(idAttr.indexOf('name') === -1) {
                    $this.attr('data-parsley-conditionally', '#' + incrementedId.replace("email", "name", "gi"));
                } else {
                    $this.attr('data-parsley-conditionally', '#' + incrementedId.replace("name", "email", "gi"));
                }
                $this.removeAttr('required');
                $this.attr('data-parsley-validate-if-empty','data-parsley-validate-if-empty');
            });
            person.find('label').each(function() {
                var $this = $(this),
                    forAttr = $this.attr('for');
                $this.attr('for', increment(forAttr));
            });

            lastPerson.after(person);

            //Send the user to the name field of the newly added input (helps with keyboard-only flow)
            $('.form-group:last input[name^="name"]').focus();
        };
    $('.add-button').on('click', addPerson);

    $('form').on('submit', function(e) {
        var $this = $(this),
            button = $this.find('button[type="submit"]').addClass('disabled').html("Working..."),
            formData = {};

        e.preventDefault();

        $($this.serializeArray()).each(function(index, e) {
            formData[e.name] = e.value;
        });

        $.ajax({
            url: $this.attr('action'),
            data: formData,
            type: 'POST'
        }).done(function() {
            $('.form-group').remove();
            $('.add-button').remove();
            $('.captcha').remove();
            button.html('Success!  Emails should be arriving shortly');
        }).fail(function(jqXHR) {
            var response = JSON.parse(jqXHR.responseText);
            if(response.failure && response.failure === 'CAPTCHA failure') {
                Recaptcha.reload();
                button.removeClass('disabled').html('Failed bot-check. Try again?');
            } else {
                button.removeClass('disabled').html('Unknown Error. Try again?');
            }

        });

        return false;
    });
})();

window.ParsleyValidator.addValidator('conditionally',
    function(value, requirement) {
        return $(requirement).val() !== '' ? value !== '' : true;
    }, 32)
    .addMessage('en', 'conditionally', 'This field should be filled if its partner is');