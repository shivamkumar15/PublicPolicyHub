import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  role: { type: String, default: 'User' },
  password_hash: { type: String },
});

export default mongoose.model('User', userSchema);
