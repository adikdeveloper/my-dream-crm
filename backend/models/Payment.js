const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    group:       { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    amount:      { type: Number, required: true },
    paymentType: { type: String, enum: ['cash', 'card', 'transfer'], default: 'cash' },
    month:       { type: String, required: true },   // "2024-03" formatida
    paidAt:      { type: Date, default: Date.now },
    note:        { type: String, trim: true, default: '' },
    status:      { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'paid' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
