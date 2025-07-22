const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'reythbusiness31@gmail.com',        
        pass: 'xogi pjvc tijg bazn'          
    }
});
module.exports = transporter;