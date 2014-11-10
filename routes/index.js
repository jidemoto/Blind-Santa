var express = require('express'),
    Recaptcha = require('recaptcha').Recaptcha,
    _ = require('underscore'),
    RECAPTCHA_PUBLIC_KEY = process.env.RECAPTCHA_PUBLIC_KEY,
    RECAPTCHA_PRIVATE_KEY = process.env.RECAPTCHA_PRIVATE_KEY,
    recaptcha_check = function(req, res, next) {
        var data = {
            remoteip:  req.connection.remoteAddress,
            challenge: req.body.recaptcha_challenge_field,
            response:  req.body.recaptcha_response_field
        };

        var recaptcha = new Recaptcha(RECAPTCHA_PUBLIC_KEY, RECAPTCHA_PRIVATE_KEY, data);

        recaptcha.verify(function(success, error_code) {
            if (success) {
                next();
            } else {
                res.status(400).json({
                    failure: 'CAPTCHA failure',
                    code: error_code
                });
            }
        });
    },
    
    jade = require('jade'),
    router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    var recaptcha = new Recaptcha(RECAPTCHA_PUBLIC_KEY, RECAPTCHA_PRIVATE_KEY);

    res.render('index', {
        title: 'Blind Santa',
        recaptcha_form: recaptcha.toHTML()
    });
});

router.post('/santa', recaptcha_check, function(req, res) {
    var number,
        valid = _.pick(req.body, function(value, key) {
            return (key.indexOf('name') === 0 && !isNaN(parseInt(key.substring(4), 10))
                || (key.indexOf('email') === 0) && !isNaN(parseInt(key.substring(5), 10)));
        }),
        people = [],
        santa,
        available = [],
        santas = [];

    for(number = 1; number < 50; number++) {
        if(_.has(valid, 'email' + number) && _.has(valid, 'name' + number)
            && valid['name' + number] && valid['email' + number]
            && valid['name' + number].trim() !== '' && valid['email' + number].trim() !== '') {
            people.push({
                name: valid['name' + number].trim(),
                email: valid['email' + number].trim()
            });
        }
    }

    console.log(people);
    if(people.length < 2) {
        res.status(400).json({
            failure: 'Not enough players'
        })
    } else {
        //Pick each person's santa
        for(number = 0; number < people.length; number++) {
            available.push(number);
        }
        for(number = 0; number < people.length; number++) {
            santa = _.random(available.length - 1);

            while(available[santa] === number) {
                //Retry if we somehow get ourselves in a bind
                if(available.length === 1) {
                    for(number = 0; number < people.length; number++) {
                        available.push(number);
                    }
                    santas = [];
                }
                santa = _.random(available.length - 1);
            }
            santa = available.splice(santa, 1);
            santas.push(santa[0]);
        }

        for(number = 0; number < people.length; number++) {
            console.log('Mapped ' + people[number].name + ' to ' + people[santas[number]].name);
            ses.sendEmail({
                Destination: {
                    ToAddresses: [people[number].email]
                },
                Message: {
                    Body: {
                        Html: {
                            Data: jade.renderFile('views/email.jade', {
                                initiator: people[0],
                                assignee: people[santas[number]],
                                recipient: people[number]
                            })
                        }
                    },
                    Subject: {
                        Data: 'Your Secret Santa assignment!'
                    }
                },
                Source: 'TheBlindSanta@gmail.com'
            }, function(err, data) {
                if(err) console.log(err, err.stack);
                else    console.log(data);
            });
        }



        res.json({
            success: 'success!'
        });
    }
});

module.exports = router;
