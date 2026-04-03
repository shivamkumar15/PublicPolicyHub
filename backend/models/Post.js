import mongoose from 'mongoose';

const solutionReplySchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  upvoters: [{ type: String }],
  downvoters: [{ type: String }],
}, { _id: false });
solutionReplySchema.add({
  replies: [solutionReplySchema],
});

const solutionSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  upvoters: [{ type: String }],
  downvoters: [{ type: String }],
  replies: [solutionReplySchema],
}, { _id: false });

const postSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  department: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  time: { type: String },
  support: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  solutions: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  supporters: [{ type: String }],
  commentsList: [{
    author: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  solutionsList: [solutionSchema],
  media: { type: String, default: 'IMAGE' },
  mediaList: [{
    type: { type: String, enum: ['IMAGE', 'VIDEO'] },
    url: { type: String },
    qualities: {
      type: Map,
      of: String,
    },
    sources: [{
      label: { type: String },
      quality: { type: String },
      url: { type: String },
    }],
  }],
  verified: { type: Boolean, default: false },
  nearby: { type: Boolean, default: false },
  tag: { type: String },
  accent: { type: String },
  fixes: [{ type: String }], // Array of strings
});

export default mongoose.model('Post', postSchema);
