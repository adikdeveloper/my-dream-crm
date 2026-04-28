const Student = require('../models/Student');
const Payment = require('../models/Payment');

// Berilgan oy uchun o'quvchi to'lashi kerak bo'lgan summani hisoblash
function calcRequired(groupPrice, discount, startDate, monthStr) {
  const effectivePrice = Math.max(0, (groupPrice || 0) - (discount || 0));
  if (!effectivePrice) return 0;

  const [year, mon] = monthStr.split('-').map(Number);

  if (!startDate) return effectivePrice;

  const start = new Date(startDate);
  const startYear = start.getFullYear();
  const startMon = start.getMonth() + 1;
  const startDay = start.getDate();

  // Boshlashdan oldingi oy — qarz yo'q
  if (year < startYear || (year === startYear && mon < startMon)) return 0;

  // Boshlagan oyida — pro-rata
  if (year === startYear && mon === startMon) {
    const daysInMonth = new Date(year, mon, 0).getDate();
    const remainingDays = daysInMonth - startDay + 1;
    return Math.round(effectivePrice * remainingDays / daysInMonth);
  }

  return effectivePrice;
}

exports.calcRequired = calcRequired;

// Oylar ro'yxatini generatsiya qilish (oxirgi N oy, joriy oy bilan)
function generateMonths(n) {
  const now = new Date();
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

exports.getDebtors = async (req, res) => {
  try {
    const { period = '1', group } = req.query;

    // Period bo'yicha oylar ro'yxati
    let months;
    if (period === 'all') {
      months = generateMonths(24); // oxirgi 2 yil
    } else {
      months = generateMonths(parseInt(period) || 1);
    }

    const mongoose = require('mongoose');
    const query = { status: 'active', group: { $ne: null } };
    if (group) {
      if (mongoose.Types.ObjectId.isValid(group)) {
        query.group = group;
      } else {
        return res.json({ success: true, data: [], totalDebt: 0 }); // invalid group returns empty
      }
    }

    const students = await Student.find(query)
      .populate('group', 'name subject price')
      .select('firstName lastName phone parentPhone group discount startDate');

    // Bu oylar uchun barcha to'lovlar
    const payments = await Payment.find({
      category: 'student',
      month: { $in: months },
      status: { $in: ['paid', 'partial'] },
    }).select('student month amount');

    const paidMap = {};
    payments.forEach((p) => {
      if (!p.student) return;
      const key = `${p.student.toString()}__${p.month}`;
      paidMap[key] = (paidMap[key] || 0) + p.amount;
    });

    const result = [];

    for (const s of students) {
      const monthRows = [];

      for (const m of months) {
        const required = calcRequired(s.group?.price, s.discount, s.startDate, m);
        if (required === 0) continue;

        const paid = paidMap[`${s._id}__${m}`] || 0;
        const debt = Math.max(0, required - paid);
        if (debt === 0) continue;

        let isProRata = false;
        if (s.startDate) {
          const start = new Date(s.startDate);
          const [y, mo] = m.split('-').map(Number);
          isProRata = start.getFullYear() === y && (start.getMonth() + 1) === mo;
        }

        monthRows.push({ month: m, required, paid, debt, isProRata });
      }

      if (monthRows.length === 0) continue;

      result.push({
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        parentPhone: s.parentPhone,
        group: s.group,
        discount: s.discount || 0,
        startDate: s.startDate,
        months: monthRows,
        totalRequired: monthRows.reduce((sum, r) => sum + r.required, 0),
        totalPaid: monthRows.reduce((sum, r) => sum + r.paid, 0),
        totalDebt: monthRows.reduce((sum, r) => sum + r.debt, 0),
      });
    }

    const totalDebt = result.reduce((sum, d) => sum + d.totalDebt, 0);
    res.json({ success: true, data: result, totalDebt });
  } catch (err) {
    console.error('getDebtors Error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi', error: err.message });
  }
};
