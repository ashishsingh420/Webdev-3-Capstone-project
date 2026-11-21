const User = require('../models/User');
const { SystemError } = require('../middleware/errorMiddleware');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/jwtUtils');

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw new SystemError('Please provide name, email, and password', 400);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new SystemError('Email address is already registered', 400);
    }

    const assignedRole = ['seller', 'bidder', 'admin'].includes(role) ? role : 'bidder';

    const newUser = await User.create({
      name,
      email,
      password,
      role: assignedRole
    });

    const tokenPayload = { id: newUser._id, role: newUser.role, email: newUser.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new SystemError('Email and password are required', 400);
    }

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      throw new SystemError('Invalid email or password credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new SystemError('Invalid email or password credentials', 401);
    }

    const tokenPayload = { id: user._id, role: user.role, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

const refreshAuthToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new SystemError('Refresh token must be provided', 400);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new SystemError('Refresh token is invalid or expired', 401);
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw new SystemError('Session has ended or token has been revoked', 401);
    }

    const newAccessToken = generateAccessToken({
      id: user._id,
      role: user.role,
      email: user.email
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (err) {
    next(err);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
};

const getCurrentUserProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAuthToken,
  logoutUser,
  getCurrentUserProfile
};
