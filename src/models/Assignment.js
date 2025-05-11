const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileUrl: { type: String },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: String },
  feedback: { type: String },
});

const AssignmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  submissions: [SubmissionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
