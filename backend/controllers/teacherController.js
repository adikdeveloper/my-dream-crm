const Teacher = require('../models/Teacher');

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('group', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const { firstName, lastName, phone, subject, salary, salaryType, group, status } = req.body;
    if (!firstName || !lastName || !phone || !subject || salary === undefined) {
      return res.status(400).json({ success: false, message: "Barcha maydonlarni to'ldiring" });
    }
    const teacher = await Teacher.create({
      firstName, lastName, phone, subject,
      salary, salaryType: salaryType || 'sum',
      group: group || null, status,
    });
    const populated = await teacher.populate('group', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    if (req.body.group === '') req.body.group = null;
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('group', 'name');
    if (!teacher) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, data: teacher });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, message: "O'qituvchi o'chirildi" });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
