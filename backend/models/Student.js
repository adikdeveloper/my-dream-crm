const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstName:   { type: String, required: [true, 'Ism majburiy'], trim: true },
    lastName:    { type: String, required: [true, 'Familiya majburiy'], trim: true },
    phone:       { type: String, required: [true, 'Telefon majburiy'], trim: true },
    parentPhone: { type: String, trim: true, default: '' },
    group:       { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    birthDate:   { type: Date, default: null },
    status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
