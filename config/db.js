const mongoose = require('mongoose')

const connection=mongoose.connect(process.env.MONGOO_URL).then(()=>{
    console.log("connect to data base")
})

module.exports=connection