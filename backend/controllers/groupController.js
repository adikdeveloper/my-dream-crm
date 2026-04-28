const Group = require('../models/Group');
const Student = require('../models/Student');
const {
  clearGroupTeacherLink,
  linkTeacherAndGroup,
  normalizeId,
  reconcileTeacherGroupLinks,
  validateGroupTeacherSubject,
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

exports.getGroups = async (req, res) => {
  try {
    await reconcileTeacherGroupLinks();

    const [groups, studentCounts] = await Promise.all([
      Group.find().populate('teacher', 'firstName lastName').sort({ createdAt: -1 }),
      Student.aggregate([
        { $match: { group: { $ne: null } } },
        { $group: { _id: '$group', count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = {};
    studentCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const data = groups.map((group) => ({
      ...group.toObject(),
      studentCount: countMap[group._id.toString()] || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    sendError(res, err);
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, subject, teacher, days, startTime, endTime, price, status } = req.body;
    const teacherId = teacher || null;

    if (!name || !subject) {
      return res.status(400).json({ success: false, message: 'Guruh nomi va fan majburiy' });
    }

    const existing = await Group.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bu nomli guruh allaqachon mavjud' });
    }

    if (teacherId) {
      await validateGroupTeacherSubject(subject, teacherId);
    }

    const group = await Group.create({
      name,
      subject,
      teacher: null,
      days,
      startTime,
      endTime,
      price,
      status,
    });

    if (teacherId) {
      await linkTeacherAndGroup(teacherId, group._id);
    }

    const populated = await Group.findById(group._id).populate('teacher', 'firstName lastName');
    res.status(201).json({ success: true, data: { ...populated.toObject(), studentCount: 0 } });
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const currentGroup = await Group.findById(req.params.id).select('_id subject teacher');
    if (!currentGroup) {
      return res.status(404).json({ success: false, message: 'Topilmadi' });
    }

    const body = { ...req.body };
    const nextTeacherId = body.teacher === ''
      ? null
      : (body.teacher ?? normalizeId(currentGroup.teacher));
    const nextSubject = body.subject || currentGroup.subject;

    if (nextTeacherId) {
      await validateGroupTeacherSubject(nextSubject, nextTeacherId);
    }

    delete body.teacher;

    await Group.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    if (nextTeacherId) {
      await linkTeacherAndGroup(nextTeacherId, req.params.id);
    } else {
      await clearGroupTeacherLink(req.params.id);
    }

    const group = await Group.findById(req.params.id).populate('teacher', 'firstName lastName');
    const studentCount = await Student.countDocuments({ group: req.params.id });
    res.json({ success: true, data: { ...group.toObject(), studentCount } });
  } catch (err) {
    sendError(res, err);
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).select('_id');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Topilmadi' });
    }

    const inUse = await Student.exists({ group: req.params.id });
    if (inUse) {
      return res.status(400).json({
        success: false,
        message: "Bu guruhda o'quvchilar mavjud. Avval o'quvchilarni boshqa guruhga o'tkazing.",
      });
    }

    await clearGroupTeacherLink(group._id);
    await Group.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Guruh o'chirildi" });
  } catch (err) {
    sendError(res, err);
  }
};

