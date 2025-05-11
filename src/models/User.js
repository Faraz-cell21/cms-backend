const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'faculty', 'student'],
    default: 'student',
  },
  course: { type: String, enum: ["BSSE", "BSCS"], default: "BSCS" },
  session: { type: String, enum: ["20-24", "21-25", "22-26", "23-27", "24-28"], default: "24-28" },
  semester: { type: String, enum: ["8th", "6th", "4th", "2nd"], default: "2nd" },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', UserSchema);
