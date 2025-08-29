require('dotenv').config()
const express = require('express')
const app = express();
const usermodel=require('../backend/models/user')
const dbconecte=require('./config/db')
dbconecte()
const postmodel = require('../backend/models/post')
const genarattoken = require('../backend/utils/genarattoken')
const multer = require('multer')
const crypto = require('crypto')
const path = require('path')
const islogined = require('../backend/middelwarse/Chackuser');
const uplodeimage = require('../backend/middelwarse/uplodeimage')
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt')

app.use(
  expressSession({
  secret:process.env.EXPRESS_SECTION_KEY,
  resave:true,
  saveUninitialized: true
})
);

app.use(flash())
app.use(cookieParser())
app.set("view engine",'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/uploads', express.static('uploads'));
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.get('/',(req,res)=> {
  let error=req.flash("error")
  let accountd=req.flash("accountd")
    res.render('index',{ error,accountd }) 
})
app.post('/register',async(req,res)=>{
    const {name,username,userpassword,userage,useremail}=req.body
   if (!name||!userage||!username||!userpassword||!useremail) {
    return res.status(400).send('form submint is not full file now')
   } 
   const userfound = await usermodel.findOne({useremail:useremail});
   if (userfound) {
    req.flash('olrady','user olrady registered')
    return res.redirect('/login')
   }
   const haspassword = await bcrypt.hash(userpassword,10)
  const user = await usermodel.create({
    name:name,
    username:username,
    userpassword:haspassword,
    userage:userage,
    useremail:useremail
  })
const token = genarattoken.genarattoken(user)
res.cookie('token',token)
 req.flash('register','user success fully registered')
    return res.redirect('/login')
    
})
app.get('/login',(req,res)=> {
  let error=req.flash("olrady")
   let register=req.flash("register")
    res.render('login',{ error,register }) 
})
app.post('/login',async(req,res)=>{
    const {userpassword,useremail}=req.body
   const users = await usermodel.findOne({useremail}).select('+password')
   if (!users) {
     req.flash('error','user is not registad');
    return res.redirect('/')
   } 
   const password = await bcrypt.compare(userpassword,users.userpassword)
   if (!password) {
     req.flash('error','user is not registad');
    return res.redirect('/')
   } 
  const user =({
    userpassword:userpassword,
    useremail:useremail
  })

const token = genarattoken.genarattoken(user)
res.cookie('token',token)
  res.redirect('profil')
    
})
app.get('/profil',islogined.Loggined,async(req,res)=>{
 const user = await usermodel.findOne({_id:req.user._id}).populate('posts');
    res.render('profil',{user})
})
app.post('/post',islogined.Loggined,async(req,res)=>{
 const user = await usermodel.findOne({_id:req.user._id})
 const {content}=req.body
const post = await postmodel.create({
  user:user._id,
  content:content,
})
user.posts.push(post._id)
await user.save();
res.redirect('/profil')
})
app.get('/like/:id', islogined.Loggined, async (req, res) => {
  try {
    const post = await postmodel.findById(req.params.id);
    const userId = req.user._id;

    if (!post) {
      return res.status(404).send("Post not found");
    }

    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId); // Like the post
    } else {
      post.likes.splice(index, 1); // Unlike the post
    }

    await post.save();
    res.redirect('/profil');
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});
app.get('/edit/:id', islogined.Loggined, async (req, res) => {
  try {
    const post = await postmodel.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    res.render('edit', { post });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
app.post('/update/:id', islogined.Loggined, async (req, res) => {
  try {
    const post = await postmodel.findById(req.params.id);

    // Optional: Check if the logged-in user is the owner of the post
    if (post.email !== req.user.email) {
      return res.status(403).send("Unauthorized");
    }

    post.content = req.body.content;
    await post.save();

    res.redirect('/profil');
  } catch (err) {
    console.error(err);
    res.status(500).send("Update failed");
  }
});
app.get('/delete/:id', islogined.Loggined, async (req, res) => {
  try {
    const post = await postmodel.findById(req.params.id);

    // Optional: Check if the logged-in user is the owner
    if (post.email !== req.user.email) {
      return res.status(403).send("Unauthorized to delete this post");
    }

    await postmodel.findByIdAndDelete(req.params.id);
    res.redirect('/profil');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting post");
  }
});
app.post('/uplode',islogined.Loggined, uplodeimage.single('image'), async (req, res) => {
  try {
    const user = await usermodel.findOne({ _id:req.user._id });
    if (!user) return res.status(404).send('User not found');

    user.image = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };

    await user.save();

    res.redirect('profil')
  } catch (err) {
    console.error(err);
    res.status(500).send('chose fil');
  }
});
app.get('/logout', islogined.Loggined, async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect('/');
    }
    await usermodel.findByIdAndDelete(req.user._id);
    res.clearCookie('token');
    req.flash('accountd','delete account success fully')
    res.redirect('/');
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).send('कुछ गड़बड़ हो गई');
  }
});
app.listen(process.env.PORT,()=>{
    console.log('server is runing');
    
})