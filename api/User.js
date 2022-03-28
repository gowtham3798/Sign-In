require("dotenv").config()
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('./../models/User')
const UserVerification = require('./../models/userVerification')
const nodemailer = require('nodemailer');
const {v4 : uuidv4} = require('uuid')




let transporter = nodemailer.createTransport({
    service :'gmail',
    auth : {
        user : process.env.AUTH_EMAIL,
        pass : process.env.AUTH_PASS
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


router.post('/signup',(req,res) => {
    let {name,email,password,dateOfBirth} = req.body;
    name = name.trim(),
    email = email.trim(),
    password = password.trim(),
    dateOfBirth = dateOfBirth.trim()

    if(name =='' || email =='' || password =='' || dateOfBirth ==''){
        res.json({
            status : 'FAILED',
            message : 'Empty Input Field'
        })
    }
    else if(!/^[a-zA-Z ]*$/.test(name)){
        res.json({
            status : 'FAILED',
            message : 'Invalid name entered'
        })      
    }
    else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)){
        res.json({
            status : 'FAILED',
            message : 'Invalid email entered'
        })      
    }
    else if(dateOfBirth == new Date()){
        res.json({
            status : 'FAILURE',
            message : 'Invalid date of birth entered'
        })
    }
    else if(password.length<8){
        res.json({
            status : 'FAILED',
            message : 'Password too short'
        })
    }
    else{
        //checking if user already exists
        User.find({ email}).then((result) => {
            //user already exists
           if(result.length){ res.json({ 
                status : 'FAILED',
                message : 'User with provided email already exists'
              })
            }
            else{
            //trying to create a new user
            const saltRounds = 10;
            bcrypt.hash(password, saltRounds).then((hashedPassword) => {
                const newUser = new User({
                    name,
                    email,
                    password : hashedPassword,
                    dateOfBirth,
                    verified: true
                })
                console.log(newUser)

                newUser.save().then((result) => {
                    sendVerificationEmail(result,res)
                })
                .catch((error) => {
                    console.error(error)
                    res.json({
                        status : 'FAILED',
                        message : 'An error occured while saving user account'
                    })
                })
            })
            .catch(err => {
                res.json({ 
                    status : 'FAILED',
                    message : 'An error Occured while hashing password'
                  })
            })
            }

        }).catch((error) => {
            console.error(error)
            res.json({ 
              status : 'FAILED',
              message : 'An error occurred while checking for existing Users'
            })
        })
    }
})



//emailverification
const sendVerificationEmail = ({_id,email},res) =>{
 const currentUrl = 'http://localhost:3200/'
 
 const uniqueString = uuidv4() + _id;

 const mailOptions = {
     from : process.env.AUTH_EMAIL,
     to : email,
     subject : 'Verify Your Email',
     html : `<p>Verify your email to complete the signup and login to your account.</p>
             <p>This link<b>expires in 6 hours.</b></p>
             <p>Press <a href="https://golden-toffee-5b0cdd.netlify.app/signin" >here</a> to proceed.</p>` 
 }
 
 //Hashing uniqueString
 const saltRounds = 10;
  bcrypt
  .hash(uniqueString,saltRounds)
  .then((hashedUniqueString) => {
      const newVerification = new UserVerification({
          userId : _id,
          uniqueString : hashedUniqueString,
          createdAt : Date.now(),
          expiresAt : Date.now() + 2600000
      })

      newVerification
      .save()
      .then(() => {
        transporter
        .sendMail(mailOptions)
        .then(() => {
                res.json({
                    status : 'PENDING',
                    message : "Verification mail sent"
                })
            })
            .catch(err => {
                res.json({
                    status : 'FAILED',
                    message : "Couldn't send verification email address"
                })
            })
            })
      .catch((error) => {
        res.json({
            status : 'FAILED',
            message : "Couldn't save verification email address"
        })
      })
  })
  .catch(error => {
    res.json({
        status : 'FAILED',
        message : 'Error occured while hashing uniqueString'
    })
  })

}



router.get('/verify/:userId/:uniqueString',(req,res)=>{
    let {userId,uniqueString} = req.params;

    UserVerification
    .find({userId})
    .then((result) => {
        if(result.length>0){
             const {expiresAt} = result[0];
             const hashedUniqueString = result[0].uniqueString;
             
             if (expiresAt < Date.now()) {
                 UserVerification
                 .deleteOne({userId})
                 .then((result) => {
                    User
                    .deleteOne({_id:userId})
                    .then(() => {
                        res.json({
                            status : 'FAILED',
                            message : 'An error has occurred ehile checking existing user record'
                        })
                    })
                    .catch(error => {
                        console.log(error)
                        res.json({
                            status : 'FAILED',
                            message : 'Clearing User with expired uniquestring failed'
                        })
                    })
                 })
                 .catch(error => {
                     res.json({
                         status : 'FAILED',
                         message : "Link had been expired"
                     })
                 })
             }
             else{
                 bcrypt.compare(uniqueString,hashedUniqueString)
                 .then((result) => {
                    if(result){
                        User
                        .updateOne({_id:userId},{verified:true})
                        .then(() => {
                            UserVerification
                            .deleteOne({userId})
                            .then((result) => {
                                console.log(result)
                            })
                            .catch(error => {
                                console.log(error)
                            })
                        })
                        .catch(error => {
                            console.log(error)
                        })
                    } 

                 })
                 .catch(error => {
                     console.log(error)
                 })
             }
     

        }else{
            console.log("Account already Exists")
        }
    })
    .catch((err) => {
        console.log(err)
        res.json({
            status : 'FAILED',
            message : 'An error occurred while checking for existing user record'
        })
    })
})





//Signin
router.post('/signin',(req,res) => {
    // let {email,password} = req.body;
    let email = req.body.email;
    let password = req.body.password;
    email = email.trim(),
    password = password.trim()
    if(email =='' || password == '') {
        res.json({
            status : 'FAILED',
            message : 'Empty credentials'
        })
    }
    else(User.find({email}))
    .then(data => {
    if(data.length)
    {
         
        if(data[0].verified){
            const hashedPassword = data[0].password;
            bcrypt.compare(password,hashedPassword).then((result) => {
                if(result){
                    res.json({
                        status : "SUCCESS",
                        message : "Signin successful!",
                        data : data
                    })
                }
                else {
                    res.json({
                        status : 'FAILED',
                        message : 'Incorrect password'
                    })
                }
            }).catch((error) => {
                res.json({
                    status : 'FAILED',
                    message : 'Error occured while comparing password'
                })
            })
        }
        else{
            res.json({
                status : 'FAILED',
                message : "Email hasn't been verified yet.check your inbox."
            })
        }    
        }
    else{
        res.json({
            status : 'FAILED',
            message : 'Invalid credentials'
        })
    }
}).catch((error) => {
    res.json({
        status : 'FAILED',
        message : 'Error occured while checking existing user'
    })
})
     
})

module.exports = router;
