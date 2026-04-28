const Payment = require('../models/Payment');
const Teacher = require('../models/Teacher');
const Group = require('../models/Group');
const {
  clearTeacherGroupLink,
  linkTeacherAndGroup,
  normalizeId,
  reconcileTeacherGroupLinks,
  validateTeacherGroupSubject,
} = require('./teacherGroupSync');

function sendError(res, err) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((item) => item.message).join(', ');
    return res.status(400).json({ success: false, message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: "Noto'g'ri ma'lumot formati" });
  }
  return res.status(500).json({ success: false, message: 'Server xatosi' });
}

exports.getTeachers = async (req, res) => {
  try {
    await reconcileTeacherGroupLinks();
    const teachers = await Teacher.find()
      .populate('group', 'name subject')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: teachers });
  } catch (err) {
    sendError(res, err);
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const { firstName, lastName, phone, subject, salary, salaryType, group, status } = req.body;
    const groupId = group || null;

    if (!firstName || !lastName || !phone || !subject || salary === undefined) {
      return res.status(400).json({ success: false, message: "Barcha maydonlarni to'ldiring" });
    }

    if (groupId) {
      await validateTeacherGroupSubject(subject, groupId);
    }

    const teacher = await Teacher.create({
      firstName,
      lastName,
      phone,
      subject,
      salary,
      salaryType: salaryType || 'sum',
      group: null,
      status,
    });

    if (groupId) {
      await linkTeacherAndGroup(teacher._id, groupId);
    }

    const populated = await Teacher.findById(teacher._id).populate('group', 'name subject');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const currentTeacher = await Teacher.findById(req.params.id).select('_id subject group');
    if (!currentTeacher) {
      return res.status(404).json({ success: false, message: 'Topilmadi' });
    }

    const nextGroupId = req.body.group === ''
      ? null
      : (req.body.group ?? normalizeId(currentTeacher.group));
    const nextSubject = req.body.subject || currentTeacher.subject;

    if (nextGroupId) {
      await validateTeacherGroupSubject(nextSubject, nextGroupId);
    }

    const updates = { ...req.body };
    delete updates.group;

    await Teacher.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (nextGroupId) {
      await linkTeacherAndGroup(req.params.id, nextGroupId);
    } else {
      await clearTeacherGroupLink(req.params.id);
    }

    const teacher = await Teacher.findById(req.params.id).populate('group', 'name subject');
    res.json({ success: true, data: teacher });
  } catch (err) {
    sendError(res, err);
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    await reconcileTeacherGroupLinks();

    const teacher = await Teacher.findById(req.params.id).select('_id group');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Topilmadi' });
    }

    const groupFilter = [{ teacher: teacher._id }];
    if (teacher.group) {
      groupFilter.push({ _id: teacher.group });
    }

    const assignedGroup = await Group.findOne({ $or: groupFilter }).select('name');
    if (assignedGroup) {
      return res.status(400).json({
        success: false,
        message: "O'qituvchi guruhga biriktirilgan. Avval guruhdan ajrating.",
      });
    }

    const hasPayments = await Payment.exists({ teacher: teacher._id });
    if (hasPayments) {
      return res.status(400).json({
        success: false,
        message: "O'qituvchini o'chirib bo'lmaydi. Unda to'lov tarixi mavjud.",
      });
    }

    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "O'qituvchi o'chirildi" });
  } catch (err) {
    sendError(res, err);
  }
};

