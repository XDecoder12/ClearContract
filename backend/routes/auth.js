import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Validate the email format only
const validateEmail = (email) => {
  if (typeof email !== 'string' || email.trim() === '') {
    return 'Email and password are required.';
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return 'Invalid email format.';
  }

  return null;
};

// Registration requires a strong enough password
const validateRegistrationCredentials = (email, password) => {
  const emailError = validateEmail(email);

  if (emailError) {
    return emailError;
  }

  if (typeof password !== 'string' || password === '') {
    return 'Email and password are required.';
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return null;
};

// Login only requires a password to be present.
// It does NOT enforce the new minimum length because
// existing accounts may have older passwords.
const validateLoginCredentials = (email, password) => {
  const emailError = validateEmail(email);

  if (emailError) {
    return emailError;
  }

  if (typeof password !== 'string' || password === '') {
    return 'Email and password are required.';
  }

  return null;
};

// 1. REGISTER A NEW USER
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    const validationError = validateRegistrationCredentials(
      email,
      password
    );

    if (validationError) {
      return res.status(400).json({
        error: validationError
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists with this email.'
      });
    }

    // Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save the new user
    const newUser = new User({
      email: normalizedEmail,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully!'
    });

  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        error: 'User already exists with this email.'
      });
    }

    console.error('Registration Error:', error);

    res.status(500).json({
      error: 'Server error during registration.'
    });
  }
});

// 2. LOGIN EXISTING USER
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    const validationError = validateLoginCredentials(
      email,
      password
    );

    if (validationError) {
      return res.status(400).json({
        error: validationError
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user in MongoDB
    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid email or password.'
      });
    }

    // Check if the password matches the stored hash
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid email or password.'
      });
    }

    // Create the JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      userId: user._id
    });

  } catch (error) {
    console.error('Login Error:', error);

    res.status(500).json({
      error: 'Server error during login.'
    });
  }
});

export default router;