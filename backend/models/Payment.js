const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    category:    { type: String, enum: ['student', 'teacher', 'other'], default: 'student' },

    // O'quvchi to'lovi
    student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    group:       { type: mongoose.Schema.Types.ObjectId, ref: 'Group',   default: null },
    month:       { type: String, default: '' },             // "2024-03" formatida
    required:    { type: Number, default: 0 },

    // O'qituvchi to'lovi
    teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },

    // Umumiy maydonlar
    amount:      { type: Number, required: true },
    paymentType: { type: String, enum: ['cash', 'card', 'transfer'], default: 'cash' },
    paidAt:      { type: Date, default: Date.now },
    note:        { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' }, // Boshqa to'lovlar uchun tavsif
    status:      { type: String, enum: ['paid', 'partial', 'pending', 'cancelled'], default: 'paid' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
