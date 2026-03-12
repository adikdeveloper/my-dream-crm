const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, changePassword, updatePhone } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('Ism kiritish majburiy'),
    body('lastName').notEmpty().withMessage('Familiya kiritish majburiy'),
    body('phone').notEmpty().withMessage('Telefon raqam kiritish majburiy'),
    body('password').isLength({ min: 6 }).withMessage('Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  ],
  register
);

router.post(
  '/login',
  [
    body('phone').notEmpty().withMessage('Telefon raqam kiritish majburiy'),
    body('password').notEmpty().withMessage('Parol kiritish majburiy'),
  ],
  login
);

router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/update-phone', protect, updatePhone);

module.exports = router;
