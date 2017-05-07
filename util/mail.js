var nodemailer = require('nodemailer');

var mail = {}
mail.transporter = nodemailer.createTransport({
    host: 'smtp.163.com',
    port: 25,
    secureConnection: true,
    auth: {
        user: 'nee_11235@163.com',
        pass: 'Nee960610'
    }
});

mail.sendMail = function(from, to, subject, text) {
    var mailOptions = {
        from: from,
        to: to, 
        subject: subject,
        text: text,
    };

    this.transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
}



//

module.exports = mail;
