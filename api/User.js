const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('./../models/User')

console.log(new Date())

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
                    dateOfBirth
                })
                console.log(newUser)
                newUser.save().then((result) => {
                    res.json({
                        status : 'SUCCESS',
                        message : 'Signup Successful!',
                        data : result
                    })
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
    if(data)
    {
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
