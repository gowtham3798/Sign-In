require("dotenv").config()
const nodemailer = require('nodemailer');
const {v4 : uuidv4} = require('uuid')

let transporter = nodemailer.createTransport({
    service :'gmail',
    auth : {
        user : "gowtham3798@gmail.com",
        pass : "Shine30498!"
    }
})

transporter.verify((error,success) => {
    if(error) {
        console.log(error)
    }
    else{
        console.log('Ready for message')
        console.log(success)
    }
})

   
    const mailOptions = {
        from : process.env.AUTH_GMAIL,
        to : "gowthamp3498@gmail.com",
        subject : 'Verify Your Email',
        html : `<p>Verify your email to complete the signup and login to your account.</p>
                <p>This link<b> expires in 6 hours.</b></p>
                <p>Press <a href="http://localhost:3000/signin">here</a> to proceed.</p>` 
    }

    transporter.sendMail(mailOptions, function(err, info) {
        if(err) {
            console.log(err)
            return;
        }
        else {
            console.log('Sent ' + info.response)
        }
    })