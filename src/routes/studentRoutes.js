const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getStudentDashboard, getMySubmission } = require('../controllers/studentController');

// 1. Student Dashboard
// GET /api/student/dashboard
// This returns courses the student is enrolled in, attendance, assignment statuses, etc.
router.get(
  '/dashboard',
  protect,
  authorize('student'),
  getStudentDashboard
);

// Let students see their grades for assignment they submitted
router.get(
    '/assignments/:assignmentId/my-submission',
    protect,
    authorize('student'),
    getMySubmission
  );

// Export the router
module.exports = router;
