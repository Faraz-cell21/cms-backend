const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getStudentDashboard, getMySubmission, getStudentAttendance, getStudentProgress, getStudentAnnouncements } = require('../controllers/studentController');

// 1. Student Dashboard
// GET /api/student/dashboard
router.get("/dashboard", protect, authorize("student"), getStudentDashboard);

// Let students see their grades for assignment they submitted
router.get(
    '/assignments/:assignmentId/my-submission',
    protect,
    authorize('student'),
    getMySubmission
  );

  router.get(
    "/courses/:courseId/attendance",
    protect,
    authorize("student"),
    getStudentAttendance
  );

  router.get(
    "/progress",
    protect,
    authorize("student"),
    getStudentProgress
  );
  
  router.get(
    "/announcements", 
    protect, 
    authorize("student"), 
    getStudentAnnouncements
);

// Export the router
module.exports = router;
