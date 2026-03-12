const Student = require('../models/Student');

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('group', 'name subject')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { firstName, lastName, phone, parentPhone, group, birthDate, status } = req.body;
    if (!firstName || !lastName || !phone) {
      return res.status(400).json({ success: false, message: "Ism, familiya va telefon majburiy" });
    }
    const student = await Student.create({
      firstName, lastName, phone,
      parentPhone: parentPhone || '',
      group: group || null,
      birthDate: birthDate || null,
      status: status || 'active',
    });
    const populated = await student.populate('group', 'name subject');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    if (req.body.group === '') req.body.group = null;
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('group', 'name subject');
    if (!student) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, message: "O'quvchi o'chirildi" });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
