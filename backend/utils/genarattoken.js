const Jwt = require('jsonwebtoken')

const genarattoken = (user)=>{
    return  Jwt.sign({useremail:user.useremail,userpassword:user.userpassword},process.env.JWT_TOKEN, { expiresIn: '1h' });    
}
module.exports.genarattoken=genarattoken