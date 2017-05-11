# Blind Santa

A simple little webapp that assists with Secret Santa selections
by taking names and emails, selecting a random giftee, and then sending
email notifications.  Additionally, you can restrict who a person can be 
assigned (i.e. remove a significant other from the available pool).

Requires [Mailgun](https://www.mailgun.com/) and 
[reCAPTCHA](https://www.google.com/recaptcha/intro/) accounts 
(v2 configuration) to run -- see the setup info below.

Under the hood, it's mostly a Hamiltonian path finder on a graph defined by 
the user (gifts assignments are given in a circle).  Additional selection 
modes are coming up before the holiday season this year.

## Setup
There are 4 environment variables that need to be set in order for the 
application to run:
- **MAILGUN_API_KEY**: The API key for your mailgun account
- **MAILGUN_DOMAIN**: The configured domain for your mailgun account
- **RECAPTCHA_PUBLIC_KEY**: The reCAPTCHA public key -- sent to clients as part of the RECAPTCHA protection
- **RECAPTCHA_PRIVATE_KEY**: The reCAPTCHA private key used to verify your account internally

## Running

Simply run `npm start` and the application will be available at [localhost:3000](http://localhost:3000)