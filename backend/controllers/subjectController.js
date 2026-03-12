const Subject = require('../models/Subject');

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.json({ success: true, data: subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const { name, description, color, status } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Fan nomi majburiy' });

    const existing = await Subject.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Bu fan allaqachon mavjud' });

    const subject = await Subject.create({ name, description, color, status });
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    if (req.body.name) {
      const existing = await Subject.findOne({ name: req.body.name.trim(), _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ success: false, message: 'Bu fan nomi allaqachon mavjud' });
    }
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, data: subject });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, message: "Fan o'chirildi" });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
