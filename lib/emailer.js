var mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN}),
    jade = require('jade');

exports.email = function(santa, assignee, initiator) {
    var data = {
        from: 'no-reply@' + process.env.MAILGUN_DOMAIN,
        'h:Reply-To': initiator.email,
        to: santa.email,
        subject: "You're a Santa!",
        text: jade.renderFile('views/text_email.jade', { initiator: initiator, assignee: assignee, recipient: santa }),
        html: jade.renderFile('views/email.jade', { initiator: initiator, assignee: assignee, recipient: santa })
    };

    mailgun.messages().send(data, function(err, body) {
        console.log(err || body);
        if(err) {
            throw err;
        }
    });
};