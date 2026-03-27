import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
  city: { type: String, required: true, unique: true },
  issues: { type: Number, default: 0 },
  topic: { type: String },
});

export default mongoose.model('City', citySchema);
