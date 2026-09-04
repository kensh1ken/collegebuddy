const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  semester: { type: Number, required: true, min: 1, max: 12, index: true },
  department: { type: String, required: true, trim: true, index: true },
  credits: { type: Number, min: 0, max: 30 },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

courseSchema.index({ name: 'text', code: 'text' });

module.exports = mongoose.model('Course', courseSchema);
