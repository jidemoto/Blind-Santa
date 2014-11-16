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
    Solver = require('../lib/graphSolver').Solver,
    emailer = require('../lib/emailer'),
    emailPeoples = function(edges, initiator) {
        var number,
            failed = [];
        console.log('Secret Santa initiated by ' + initiator.name);
        for(number = 0; number < edges.length; number++) {
            console.log('Mapped ' + edges[number].from.name + ' to ' + edges[number].to.name);
            try {
                emailer.email(edges[number].from, edges[number].to, initiator);
            } catch (e) {
                failed.push(edges[number]);
            }
        }

        return failed;
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
                exclusions : _.has(params, 'exclude' + number)
                                && typeof params['exclude' + number] !== 'undefined'
                                && params['exclude' + number].trim().length > 0
                            ? _.map(params['exclude' + number].split(','), function(s) { return Number(s); })
                            : []
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
    var valid = router.getValidParams(req.body),
        people = router.makePeopleList(valid),
        edges = [],
        failed;

    console.log(people);
    if(people.length < 2) {
        res.status(400).json({
            failure: 'Not enough players'
        })
    } else {
        //Pick each person's santa
        edges = new Solver(people).getRandomGraph();
        failed = emailPeoples(edges, _.find(people, function(person) { return person.id === 1; }));
        if(failed.length === 0) {
            res.json({
                success: 'success!'
            });
        } else {
            res.status(500);
            res.json({
                failure: {
                    failedSending: failed
                }
            });
        }

    }
});

module.exports = router;
