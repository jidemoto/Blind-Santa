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
    router = express.Router(),
    emailPeoples = function(people, santas) {
        var number;
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
    };

router.getValidParams = function(params) {
    return _.pick(params, function(value, key) {
        return (key.indexOf('name') === 0 && !isNaN(parseInt(key.substring(4), 10))
            || (key.indexOf('email') === 0) && !isNaN(parseInt(key.substring(5), 10)))
            || (key.indexOf('exclude') === 0 && !isNaN(parseInt(key.substring(7), 10)));
    });
};

router.makePeopleList = function(params) {
    var number,
        people = [];
    for(number = 1; number < 50; number++) {
        if(_.has(params, 'email' + number) && _.has(params, 'name' + number)
            && params['name' + number] && params['email' + number]
            && params['name' + number].trim() !== '' && params['email' + number].trim() !== '') {
            people.push({
                id: number,
                name: params['name' + number].trim(),
                email: params['email' + number].trim(),
                exclusions : _.has(params, 'exclude' + number) && typeof params['exclude' + number] !== 'undefined' ? params['exclude' + number].split(',') : []
            });
        }
    }

    return people;
};

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
        valid = this.getValidParams(req.body),
        people = this.makePeopleList(valid),
        twoPersonCyclesAllowed = _.has(req.body, 'twoPersonCyclesAllowed') && people.length > 2
            ? req.body['twoPersonCyclesAllowed'].toLowerCase() == 'true'
            : true,
        person,
        assignee,
        available = [],
        edges = [],
        locallyAvailable,
        localSanta;

    people.sort(function(a, b) {return a.exclusions.length - b.exclusions.length});

    console.log(people);
    if(people.length < 2) {
        res.status(400).json({
            failure: 'Not enough players'
        })
    } else {
        //Pick each person's santa
        for(number = 1; number <= people.length; number++) {
            available.push(number);
        }
        for(number = 0; number < people.length; number++) {
            person = people[number];
            locallyAvailable = available.slice(0, available.length);

            //Remove the user's self from the available listing
            if(locallyAvailable.indexOf(person.id) != -1) {
                locallyAvailable.splice(locallyAvailable.indexOf(person.id), 1);
            }

            //Remove items from the available array that match exclusions
            for(var i = 0; i < person.exclusions.length; i++) {
                if(locallyAvailable.indexOf(person.exclusions[i]) != -1) {
                    locallyAvailable.splice(locallyAvailable.indexOf(person.exclusions[i]), 1);
                }
            }

            if(locallyAvailable.length == 0) {
                //TODO: Handle the error case where graph generation isn't possible
            }

            localSanta = _.random(locallyAvailable.length - 1);
            assignee = available.splice(available.indexOf(locallyAvailable[localSanta]), 1);

            edges.push({
                from: person.id,
                to: assignee[0]
            });
        }

        people.sort(function(a, b) { return a.id - b.id;});
        edges.sort(function(a, b) { return a.from - b.from;});

        emailPeoples(people, _.map(edges, function(edge) { return edge.to; }));

        res.json({
            success: 'success!'
        });
    }
});

module.exports = router;
