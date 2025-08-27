const Jwt = require('jsonwebtoken');
const usermodel=require('../models/user') // सही path रखें

module.exports.Loggined = async function (req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    console.log('Token missing');
    return res.redirect('/') 
  }

  try {
    const decoded = Jwt.verify(token, process.env.JWT_TOKEN);
    const user = await usermodel.findOne({ useremail: decoded.useremail });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
      return res.redirect('/') 
  }
};