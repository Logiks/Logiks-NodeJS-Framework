//Messaging Helper Functions

const nodemailer = require('nodemailer');
const apiHTTPS = require('https');
const apiHTTP = require('http');

module.exports = function(server, restify) {
    initialize = function() {
        
    }

    server.sendSMS = function(smsTO, msgBody, msgType, params) {

    },

    server.sendEmail = function(toEmail, subject, msgBody) {
        var transporter = nodemailer.createTransport(server.config.mail);
        var mailOptions = {
            from: '"Test NoReply" <noreply@test.com>', // sender address
            to: toEmail, // list of receivers
            subject: subject, // Subject line
            text: msgBody.replace('<br>','\n').replace("<hr>","\n\n").replace(/<(?:.|\n)*?>/gm, ''), // plain text body
            html: msgBody // html body
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        });
    }

    return this;
}