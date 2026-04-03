import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientUsername: { type: String, default: '', index: true, trim: true },
  actorUsername: { type: String, default: '', trim: true },
  type: { type: String, default: 'generic', trim: true },
  message: { type: String, required: true },
  postId: { type: String, default: '', trim: true },
  postTitle: { type: String, default: '', trim: true },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model('Notification', notificationSchema);
