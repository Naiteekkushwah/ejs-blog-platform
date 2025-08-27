const mongoose = require('mongoose')

const userScema = mongoose.Schema({
    name:String,
    username:String,
    userpassword:String,
    useremail:String,
    userage:Number,
     image: {
    data: Buffer,
    contentType: String
  },
    posts:[
      {
  type:mongoose.Schema.Types.ObjectId,
  ref:'post'
    }
  ]
})

const usermodel = mongoose.model('usermodel',userScema)

module.exports=usermodel