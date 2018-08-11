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

    $('.santa-form').on('click', '.exclude-button', function() {
        var $this = $(this),
            inputGroup = $this.closest('.input-group'),
            $modal = $('.modal'),
            modalList = $modal.find('.list-group'),
            number = Number(inputGroup.find('input[name^="name"]').attr('name').substring(4)),
            excludes = inputGroup.find('input[name^="exclude"]').val().split(','),
            people = $('input[name^="name"]').map(function() {
                var $name = $(this);
                return [[Number($name.attr('name').substring(4)), $name.val()]];
            }).get(),
            i;

        //Convert the excludes array from Strings to Numbers
        for(i = 0; i < excludes.length; i++) {
            excludes[i] = Number(excludes[i]);
        }

        modalList.empty();
        for(i = 0; i < people.length; i++) {
            var person = people[i],
                current = person[0] === number,
                excluded = excludes.indexOf(person[0]) != -1,
                itemClass;

            if(current || people.length == 2) {
                itemClass = 'disabled';
            } else if(excluded) {
                itemClass = 'excluded';
            } else {
                itemClass = 'list-group-item-success';
            }

            modalList.append('<a href="#" class="list-group-item ' + itemClass + '" data-person="' + person[0] + '">' + person[1] + '</a>');
        }

        modalList.find('a:not(.disabled)').on('click', function() {
            $(this).toggleClass('list-group-item-success').toggleClass('excluded');
            if(modalList.find('a:not(.excluded)').size() == 1) {
                $modal.find('.btn-primary').addClass('disabled');
            } else {
                $modal.find('.btn-primary').removeClass('disabled');
            }
        });

        $modal.find('.btn-primary').off('click').on('click', function() {
            var number = Number(modalList.find('a.disabled').attr('data-person')),
                excluded = modalList.find('a.excluded').map(function() { return Number($(this).attr('data-person')); }).get().join();
            $('input[name="exclude' + number + '"]').val(excluded);

            $modal.modal('hide');
        });

        $modal.modal({});

    });
})();

window.ParsleyValidator.addValidator('conditionally',
    function(value, requirement) {
        return $(requirement).val() !== '' ? value !== '' : true;
    }, 32)
    .addMessage('en', 'conditionally', 'This field should be filled if its partner is');