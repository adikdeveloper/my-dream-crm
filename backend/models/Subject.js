const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name:        { type: String, required: [true, 'Fan nomi majburiy'], trim: true, unique: true },
    description: { type: String, trim: true, default: '' },
    color:       { type: String, default: '#1e3a6e' },
    status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
