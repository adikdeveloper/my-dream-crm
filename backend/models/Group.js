const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name:      { type: String, required: [true, 'Guruh nomi majburiy'], trim: true },
    subject:   { type: String, required: [true, 'Fan majburiy'], trim: true },
    teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    days:      { type: String, trim: true },        // "Du-Cho-Ju" kabi
    startTime: { type: String, trim: true },        // "09:00"
    endTime:   { type: String, trim: true },        // "11:00"
    price:     { type: Number, default: 0 },        // oylik to'lov
    status:    { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
