import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  displayName: { type: String, default: '', trim: true },
  firebase_uid: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  gender: { type: String, default: '', trim: true },
  phoneNumber: { type: String, unique: true, sparse: true, default: undefined, trim: true },
  role: { type: String, default: 'User' },
  password_hash: { type: String },
  profilePhotoUrl: { type: String, default: '' },
  personalDescription: { type: String, default: '', trim: true, maxlength: 180 },
  bookmarkedPostIds: [{ type: String }],
  reportedPostIds: [{ type: String }],
  following: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);
