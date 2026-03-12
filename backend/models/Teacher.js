const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    firstName:  { type: String, required: [true, 'Ism majburiy'], trim: true },
    lastName:   { type: String, required: [true, 'Familiya majburiy'], trim: true },
    phone:      { type: String, required: [true, 'Telefon majburiy'], trim: true },
    subject:    { type: String, required: [true, 'Fan majburiy'], trim: true },
    salary:     { type: Number, required: [true, 'Maosh majburiy'] },
    salaryType: { type: String, enum: ['sum', 'percent'], default: 'sum' },
    group:      { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    status:     { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);
