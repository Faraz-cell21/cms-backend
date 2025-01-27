const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const bcrypt = require('bcryptjs');

exports.createUserAsAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Only 'staff' and 'student' are allowed roles here
    const allowedRoles = ['staff', 'student'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only staff or student allowed.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, instructor } = req.body;

    // Optionally validate that `instructor` is a faculty user if provided
    const course = await Course.create({
      title,
      description,
      instructor: instructor || null,
    });

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update course (title, description, instructor)
exports.updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, instructor } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (title) course.title = title;
    if (description) course.description = description;
    if (instructor) course.instructor = instructor;

    await course.save();

    res.status(200).json({
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// (Optional) Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'name email');
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// (Optional) Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findByIdAndDelete(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.enrollStudent = async (req, res) => {
    try {
      const { courseId, studentId } = req.params;
      const course = await Course.findById(courseId);
  
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      // Check if student is already enrolled
      const alreadyEnrolled = course.studentsEnrolled.some(
        (enrollment) => enrollment.student.toString() === studentId
      );
      if (alreadyEnrolled) {
        return res.status(400).json({ message: 'Student already enrolled' });
      }
  
      // Enroll the student
      course.studentsEnrolled.push({ student: studentId });
      await course.save();
  
      res.status(200).json({
        message: 'Student enrolled successfully',
        course,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
// Dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments();

    // Count by role
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalStaff = await User.countDocuments({ role: 'staff' });
    const totalAdmins = await User.countDocuments({ role: 'admin' }); 
    // (Might just be 1, but we’ll count anyway)

    // 3. Count courses
    const totalCourses = await Course.countDocuments();

    // 4. Count assignments
    const totalAssignments = await Assignment.countDocuments();

    // You can add more advanced queries if you want more data

    return res.status(200).json({
      totalUsers,
      totalStudents,
      totalStaff,
      totalAdmins,
      totalCourses,
      totalAssignments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};
