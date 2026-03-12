const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
    },
  });
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, phone, password } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu raqam allaqachon ro\'yxatdan o\'tgan',
      });
    }

    const user = await User.create({ firstName, lastName, phone, password });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, password } = req.body;

    const user = await User.findOne({ phone }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqam yoki parol noto\'g\'ri',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Hisobingiz bloklangan' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.updatePhone = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Barcha maydonlarni to\'ldiring' });
    }

    const existing = await User.findOne({ phone });
    if (existing && existing._id.toString() !== req.user.id) {
      return res.status(400).json({ success: false, message: 'Bu raqam allaqachon band' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Parol noto\'g\'ri' });
    }

    user.phone = phone;
    await user.save();

    res.status(200).json({ success: true, message: 'Telefon raqam yangilandi', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Ism va familiya majburiy' });
    }

    if (phone) {
      const existing = await User.findOne({ phone });
      if (existing && existing._id.toString() !== req.user.id) {
        return res.status(400).json({ success: false, message: 'Bu raqam allaqachon band' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName: firstName.trim(), lastName: lastName.trim(), ...(phone && { phone }) },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Profil yangilandi', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Barcha maydonlarni to\'ldiring' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Eski parol noto\'g\'ri' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Parol muvaffaqiyatli o\'zgartirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
