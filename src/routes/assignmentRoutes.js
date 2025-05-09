const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/Cloudinary');
const {
  createAssignment,
  submitAssignment,
  getSubmissions,
  getMySubmission,
  getStudentAssignments
} = require('../controllers/assignmentController');

// 1. Staff creates assignment
router.post(
  '/create',
  protect,
  authorize('staff'),  // Only Staff or admin
  createAssignment
);

// 2. Student submits assignment (file)
router.post(
  '/submit/:assignmentId',
  protect,
  authorize('student'),  // Only students
  upload.single('assignmentFile'), // Multer middleware for single file
  submitAssignment
);

// 3. Staff (or admin) views submissions
router.get(
  '/submissions/:assignmentId',
  protect,
  authorize('staff', 'admin'), 
  getSubmissions
);

router.get(
  '/student',
  protect,
  authorize('student'),
  getStudentAssignments
);

module.exports = router;
