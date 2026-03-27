import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model('Notification', notificationSchema);
