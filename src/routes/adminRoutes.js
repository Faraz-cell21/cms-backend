const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createCourse, updateCourse, getAllCourses, deleteCourse, enrollStudent, getAdminDashboard } = require('../controllers/adminController');

// POST /api/admin/create-user
//router.post('/create-user', protect, authorize('admin'), createUserAsAdmin);

// Admin can create course
router.post('/courses', protect, authorize('admin'), createCourse);

// Admin can update course
router.put('/courses/:courseId', protect, authorize('admin'), updateCourse);

// Admin can get all courses (optional)
router.get('/courses', protect, authorize('admin'), getAllCourses);

// Admin can delete a course
router.delete('/courses/:courseId', protect, authorize('admin'), deleteCourse);

// Admin or Staff can enroll a student
router.put('/courses/:courseId/enroll/:studentId', protect, authorize('admin', 'staff'), enrollStudent);

// Dashboard
router.get('/dashboard', protect, authorize('admin'), getAdminDashboard);

module.exports = router;
