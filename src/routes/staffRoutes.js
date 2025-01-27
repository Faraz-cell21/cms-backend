const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { markAttendance, getAttendance, getInstructorDashboard } = require('../controllers/staffController');
const { gradeAssignment } = require('../controllers/assignmentController');

// Staff can mark attendance
router.put('/courses/:courseId/attendance/:studentId', protect, authorize('staff', 'admin'), markAttendance);

router.get('/courses/:courseId/attendances/:studentId?', protect, authorize('admin', 'staff'), getAttendance);

router.put(
    '/assignments/:assignmentId/grade/:submissionId',
    protect,
    authorize('staff'), // or admin if you want admin to grade too
    gradeAssignment
);

router.get(
    '/dashboard',
    protect,
    authorize('staff'),  // Only instructors allowed
    getInstructorDashboard
  );

module.exports = router;
