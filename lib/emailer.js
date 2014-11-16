var mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN}),
    MailComposer = require('mailcomposer').MailComposer,
    jade = require('jade'),
    sendingEmail = process.env.SENDING_EMAIL;

exports.email = function(santa, assignee, initiator) {
    var data = {
        from: sendingEmail,
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
    })
};