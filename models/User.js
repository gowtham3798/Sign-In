const mongoose = require('mongoose');
const schema = mongoose.Schema

const UserSchema = new schema({
    name : String,
    email : String,
    password : String,
    dateOfBirth : String,
    verified : Boolean,
})

const User = mongoose.model('User',UserSchema)

module.exports = User;