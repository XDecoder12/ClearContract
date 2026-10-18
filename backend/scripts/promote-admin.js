import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error(
    'Usage: node scripts/promote-admin.js <existing-user-email>'
  );

  process.exitCode = 1;
} else {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not configured.');
    }

    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`No existing user found for: ${email}`);
      process.exitCode = 1;
    } else if (user.role === 'admin') {
      console.log(`${email} is already an administrator.`);
    } else {
      user.role = 'admin';
      await user.save();

      console.log(`Administrator role assigned to ${email}.`);
    }
  } catch (error) {
    console.error('Admin promotion failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}