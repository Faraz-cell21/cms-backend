const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '3d',
  });
};

// Login Controller
exports.login = async (req, res) => {
  try {
    // 1. Extract email & password from body (JSON)
    const { email, password } = req.body;
    console.log('Email from request:', email);
    console.log('Password from request:', password);

    // 2. Check if user exists in DB
    const user = await User.findOne({ email });
    console.log('User found in DB:', user);

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Compare hashed password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id);
    console.log('Generated token:', token);

    // 5. Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // set to true if using HTTPS in production
      sameSite: 'lax',
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    // 6. Send success response
    return res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Logout Controller
exports.logout = async (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};
