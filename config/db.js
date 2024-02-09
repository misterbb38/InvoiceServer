const mongoose = require('mongoose');


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            
            dbName : "invoice"  // 
            
        });

        console.log('MongoDB connected'.cyan.underline.bold);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
    }
};

module.exports = connectDB;
