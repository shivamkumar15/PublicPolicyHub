import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  department: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, ref: 'User' },
  time: { type: String },
  support: { type: String, default: '0' },
  comments: { type: String, default: '0' },
  solutions: { type: String, default: '0' },
  media: { type: String, default: 'IMAGE' },
  verified: { type: Boolean, default: false },
  nearby: { type: Boolean, default: false },
  tag: { type: String },
  accent: { type: String },
  fixes: [{ type: String }], // Array of strings
});

export default mongoose.model('Post', postSchema);
