import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderUsername: { type: String, required: true, trim: true, index: true },
  recipientUsername: { type: String, required: true, trim: true, index: true },
  participants: [{ type: String, required: true, trim: true, index: true }],
  text: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ participants: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
