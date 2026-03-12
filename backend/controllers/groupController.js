const Group = require('../models/Group');

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate('teacher', 'firstName lastName').sort({ createdAt: -1 });
    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, subject, teacher, days, startTime, endTime, price, status } = req.body;
    if (!name || !subject) {
      return res.status(400).json({ success: false, message: "Guruh nomi va fan majburiy" });
    }
    const group = await Group.create({ name, subject, teacher: teacher || null, days, startTime, endTime, price, status });
    const populated = await group.populate('teacher', 'firstName lastName');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('teacher', 'firstName lastName');
    if (!group) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, message: "Guruh o'chirildi" });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
