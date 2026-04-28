const Group = require('../models/Group');
const Teacher = require('../models/Teacher');

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeId(value) {
  return value ? value.toString() : null;
}

function normalizeSubject(value) {
  return String(value || '').trim().toLowerCase();
}

function sameId(left, right) {
  return Boolean(left && right) && normalizeId(left) === normalizeId(right);
}

async function reconcileTeacherGroupLinks() {
  const [teachers, groups] = await Promise.all([
    Teacher.find().select('_id group'),
    Group.find().select('_id teacher'),
  ]);

  const teacherIds = new Set(teachers.map((teacher) => normalizeId(teacher._id)));
  const groupIds = new Set(groups.map((group) => normalizeId(group._id)));
  const groupByTeacherId = new Map();
  const teacherByGroupId = new Map();

  groups.forEach((group) => {
    const teacherId = normalizeId(group.teacher);
    if (teacherId && !groupByTeacherId.has(teacherId)) {
      groupByTeacherId.set(teacherId, group);
    }
  });

  teachers.forEach((teacher) => {
    const groupId = normalizeId(teacher.group);
    if (groupId && !teacherByGroupId.has(groupId)) {
      teacherByGroupId.set(groupId, teacher);
    }
  });

  const ops = [];

  teachers.forEach((teacher) => {
    const groupId = normalizeId(teacher.group);
    if (groupId && !groupIds.has(groupId)) {
      ops.push(Teacher.findByIdAndUpdate(teacher._id, { $set: { group: null } }));
      return;
    }

    if (!groupId) {
      const linkedGroup = groupByTeacherId.get(normalizeId(teacher._id));
      if (linkedGroup) {
        ops.push(Teacher.findByIdAndUpdate(teacher._id, { $set: { group: linkedGroup._id } }));
      }
    }
  });

  groups.forEach((group) => {
    const teacherId = normalizeId(group.teacher);
    if (teacherId && !teacherIds.has(teacherId)) {
      ops.push(Group.findByIdAndUpdate(group._id, { $set: { teacher: null } }));
      return;
    }

    if (!teacherId) {
      const linkedTeacher = teacherByGroupId.get(normalizeId(group._id));
      if (linkedTeacher) {
        ops.push(Group.findByIdAndUpdate(group._id, { $set: { teacher: linkedTeacher._id } }));
      }
    }
  });

  if (ops.length > 0) {
    await Promise.all(ops);
  }
}

async function validateTeacherGroupSubject(subject, groupId) {
  const group = await Group.findById(groupId).select('_id subject');
  if (!group) {
    throw createHttpError(404, 'Guruh topilmadi');
  }
  if (normalizeSubject(subject) !== normalizeSubject(group.subject)) {
    throw createHttpError(400, "Tanlangan guruh o'qituvchi faniga mos emas");
  }
  return group;
}

async function validateGroupTeacherSubject(subject, teacherId) {
  const teacher = await Teacher.findById(teacherId).select('_id subject');
  if (!teacher) {
    throw createHttpError(404, "O'qituvchi topilmadi");
  }
  if (normalizeSubject(subject) !== normalizeSubject(teacher.subject)) {
    throw createHttpError(400, "Tanlangan o'qituvchi guruh faniga mos emas");
  }
  return teacher;
}

async function linkTeacherAndGroup(teacherId, groupId) {
  const [teacher, group] = await Promise.all([
    Teacher.findById(teacherId).select('_id subject group'),
    Group.findById(groupId).select('_id subject teacher'),
  ]);

  if (!teacher) {
    throw createHttpError(404, "O'qituvchi topilmadi");
  }
  if (!group) {
    throw createHttpError(404, 'Guruh topilmadi');
  }
  if (normalizeSubject(teacher.subject) !== normalizeSubject(group.subject)) {
    throw createHttpError(400, "O'qituvchi va guruh fanlari mos emas");
  }

  const previousTeacherGroupId = teacher.group;
  const previousGroupTeacherId = group.teacher;

  await Promise.all([
    Group.updateMany({ teacher: teacher._id, _id: { $ne: group._id } }, { $set: { teacher: null } }),
    Teacher.updateMany({ group: group._id, _id: { $ne: teacher._id } }, { $set: { group: null } }),
  ]);

  const ops = [
    Teacher.findByIdAndUpdate(teacher._id, { $set: { group: group._id } }, { runValidators: true }),
    Group.findByIdAndUpdate(group._id, { $set: { teacher: teacher._id } }, { runValidators: true }),
  ];

  if (previousTeacherGroupId && !sameId(previousTeacherGroupId, group._id)) {
    ops.push(Group.findByIdAndUpdate(previousTeacherGroupId, { $set: { teacher: null } }));
  }
  if (previousGroupTeacherId && !sameId(previousGroupTeacherId, teacher._id)) {
    ops.push(Teacher.findByIdAndUpdate(previousGroupTeacherId, { $set: { group: null } }));
  }

  await Promise.all(ops);
}

async function clearTeacherGroupLink(teacherId) {
  if (!teacherId) return;

  await Promise.all([
    Teacher.findByIdAndUpdate(teacherId, { $set: { group: null } }, { runValidators: true }),
    Group.updateMany({ teacher: teacherId }, { $set: { teacher: null } }),
  ]);
}

async function clearGroupTeacherLink(groupId) {
  if (!groupId) return;

  await Promise.all([
    Group.findByIdAndUpdate(groupId, { $set: { teacher: null } }, { runValidators: true }),
    Teacher.updateMany({ group: groupId }, { $set: { group: null } }),
  ]);
}

module.exports = {
  clearGroupTeacherLink,
  clearTeacherGroupLink,
  createHttpError,
  linkTeacherAndGroup,
  normalizeId,
  reconcileTeacherGroupLinks,
  validateGroupTeacherSubject,
  validateTeacherGroupSubject,
};

