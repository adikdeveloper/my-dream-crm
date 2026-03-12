const Student = require('../models/Student');
const Payment = require('../models/Payment');

// Berilgan oyda to'lov qilmagan faol o'quvchilar
exports.getDebtors = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    // Faol, guruhi bor o'quvchilar
    const students = await Student.find({ status: 'active', group: { $ne: null } })
      .populate('group', 'name subject price');

    // Shu oyda to'langan to'lovlar
    const paidPayments = await Payment.find({ month: targetMonth, status: 'paid' })
      .select('student');

    const paidStudentIds = new Set(paidPayments.map((p) => p.student.toString()));

    // To'lovni qilmagan o'quvchilar
    const debtors = students
      .filter((s) => !paidStudentIds.has(s._id.toString()))
      .map((s) => ({
        _id:         s._id,
        firstName:   s.firstName,
        lastName:    s.lastName,
        phone:       s.phone,
        parentPhone: s.parentPhone,
        group:       s.group,
        debt:        s.group?.price || 0,
        month:       targetMonth,
      }));

    const totalDebt = debtors.reduce((sum, d) => sum + d.debt, 0);

    res.json({ success: true, data: debtors, totalDebt, month: targetMonth });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
