import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexavision';
    await mongoose.connect(connStr);
    console.log(`[MongoDB] Database connected successfully to ${mongoose.connection.host}`);
  } catch (error) {
    console.warn('[MongoDB] Direct connection error. Running in memory fallback mode if applicable.');
  }
};
