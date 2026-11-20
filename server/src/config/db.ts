import mongoose from 'mongoose';

export const connectDB = async () => {
  const connStr = process.env.MONGODB_URI;
  if (!connStr) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(connStr, { serverSelectionTimeoutMS: 10000 });
  console.log(`[MongoDB] Database connected successfully to ${mongoose.connection.host}`);
};
