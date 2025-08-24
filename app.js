require('dotenv').config()
const express = require('express')
const app = express();
const usermodel=require('./models/user')
const dbconecte=require('./config/db')
const postmodel = require('./models/post')
const genarattoken = require('./utils/genarattoken')
const multer = require('multer')
const crypto = require('crypto')
const path = require('path')
const islogined = require('./middelwarse/Chackuser');
const uplodeimage = require('./middelwarse/uplodeimage')
const cookieParser = require('cookie-parser');

app.use(cookieParser())
app. set("view engine",'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/uploads', express.static('uploads'));


app.get('/register',(req,res)=> {
    res.render('index') 
})
app.post('/register',async(req,res)=>{
    const {name,username,userpassword,userage,useremail}=req.body
   if (!name||!userage||!username||!userpassword||!useremail) {
    return res.status(400).send('form submint is not full file now')
   } 
   const userfound = await usermodel.findOne({useremail:useremail});
   if (userfound) {
    return res.send('user olrady register')
   }
  const user = await usermodel.create({
    name:name,
    username:username,
    userpassword:userpassword,
    userage:userage,
    useremail:useremail
  })
const token = genarattoken.genarattoken(user)
res.cookie('token',token)

  res.redirect('login')
    
})
app.get('/login',(req,res)=> {
    res.render('login') 
})

app.post('/login',async(req,res)=>{
    const {userpassword,useremail}=req.body
    const email = await usermodel.findOne({useremail})
   if (!email) {
    return res.status(400).send('user is not register')
   } 
   const password = await usermodel.findOne({userpassword})
   if (!password) {
    return res.status(400).send('user is not register')
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

// GET route to render edit page
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

// POST route to update post content
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

app.get('/text',(req,res)=>{
  res.render('text')
})

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
app.get('/logout',islogined.Loggined,(req,res)=>{
  res.cookie('token',"")
  res.redirect('/register')
})

app.listen(process.env.PORT,()=>{
    console.log('server is runing');
    
})