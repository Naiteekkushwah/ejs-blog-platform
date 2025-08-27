const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGOO_URL, {
      
    });
    console.log("✅ MongoDB sucssecfully connect");
  } catch (error) {
    console.error("❌ mongodb is not connect", error.message);
    process.exit(1); 
  }
};

module.exports = connectDB;