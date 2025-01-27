const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  // Which faculty member is assigned
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Array of enrolled students
  studentsEnrolled: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      enrolledAt: { type: Date, default: Date.now },
      // Add attendance array
      attendance: [
        {
          date: { type: Date, required: true },
          status: { type: String, enum: ['present', 'absent'], required: true },
        },
      ],
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);
