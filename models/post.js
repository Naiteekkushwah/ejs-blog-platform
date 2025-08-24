const mongoose = require('mongoose')

const porstScema = mongoose.Schema({
    
    user:[
      {
  type:mongoose.Schema.Types.ObjectId,
  ref:'user'
    }
  ],
  date:{
    type:Date,
default:Date.now()
  },
  content:String,
likes:[{type:mongoose.Schema.Types.ObjectId,
  ref:'user'}]
})

const postmodel = mongoose.model('post',porstScema)

module.exports=postmodel