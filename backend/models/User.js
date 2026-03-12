const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Ism kiritish majburiy'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Familiya kiritish majburiy'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Telefon raqam kiritish majburiy'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Parol kiritish majburiy'],
      minlength: [6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'user'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
