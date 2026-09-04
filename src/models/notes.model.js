const mongoose = require('mongoose');

const RESOURCE_TYPES = [
  'notes',
  'previous_year_paper',
  'assignment',
  'lab_material',
  'question_bank',
  'study_material',
  'external_link',
  // Kept temporarily so existing documents remain readable during migration.
  'file',
  'link',
];

const notesSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
  courseId: { type: String, required: true, uppercase: true, trim: true, index: true },
  semester: { type: Number, required: true, min: 1, max: 12, index: true },
  academicYear: { type: String, trim: true, default: '', index: true },
  resourceType: { type: String, enum: RESOURCE_TYPES, default: 'notes', index: true },
  deliveryType: { type: String, enum: ['file', 'link'], default: 'file' },
  examType: {
    type: String,
    enum: ['midsem', 'endsem', 'quiz', 'practical', 'other', 'none'],
    default: 'none',
    index: true,
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  moderationNote: { type: String, trim: true, maxlength: 500, default: '' },
  fileUrl: { type: String, select: false },
  storagePath: { type: String, select: false },
  originalFileName: { type: String, trim: true },
  mimeType: { type: String, trim: true },
  fileSize: { type: Number, min: 0 },
  externalLink: { type: String, trim: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
}, { timestamps: true });

notesSchema.index({ title: 'text', description: 'text', courseId: 'text' });
notesSchema.index({ status: 1, semester: 1, resourceType: 1, createdAt: -1 });

notesSchema.set('toJSON', {
  transform: (_document, returned) => {
    delete returned.__v;
    delete returned.storagePath;
    delete returned.fileUrl;
    return returned;
  },
});

notesSchema.statics.resourceTypes = RESOURCE_TYPES;

module.exports = mongoose.model('Notes', notesSchema);
