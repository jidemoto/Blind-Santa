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
                    nameAttr = $this.attr('name');

                $this.attr('id', increment(idAttr));
                $this.attr('name', increment(nameAttr));
            });
            person.find('label').each(function() {
                var $this = $(this),
                    forAttr = $this.attr('for');
                $this.attr('for', increment(forAttr));
            });

            lastPerson.after(person);
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