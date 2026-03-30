import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firebase_uid: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  role: { type: String, default: 'User' },
  password_hash: { type: String },
  profilePhotoUrl: { type: String, default: '' },
  bookmarkedPostIds: [{ type: String }],
  reportedPostIds: [{ type: String }],
  following: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);
