const dotenv = require("dotenv");

const mongoose = require('mongoose')

dotenv.config();
mongoose.connect(process.env.MONGODB_URI ,
    {
    useNewUrlParser:true,
    useUnifiedTopology : true
    })
    .then(() => {
        console.log("DB Connected");
    })
    .catch((err) => {console.log(err)});
