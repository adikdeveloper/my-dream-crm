const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Group   = require('../models/Group');
const Payment = require('../models/Payment');

exports.getReports = async (req, res) => {
  try {
    const now   = new Date();
    const year  = req.query.year || now.getFullYear();

    // ── Umumiy statistika ──────────────────────────────────────────
    const [totalStudents, totalTeachers, totalGroups, activeStudents] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Group.countDocuments(),
      Student.countDocuments({ status: 'active' }),
    ]);

    // ── Oylik to'lovlar (tanlangan yil) ───────────────────────────
    const monthlyPayments = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          month: { $regex: `^${year}-` },
        },
      },
      {
        $group: {
          _id:   '$month',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── To'lov usullari bo'yicha ───────────────────────────────────
    const paymentTypes = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: '$paymentType', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    // ── To'lov holatlari ──────────────────────────────────────────
    const paymentStatuses = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // ── Guruhlar bo'yicha o'quvchilar soni ────────────────────────
    const studentsByGroup = await Student.aggregate([
      { $match: { group: { $ne: null } } },
      { $group: { _id: '$group', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'groups', localField: '_id', foreignField: '_id', as: 'group',
        },
      },
      { $unwind: '$group' },
      { $project: { name: '$group.name', subject: '$group.subject', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // ── Joriy oy to'lovlari ───────────────────────────────────────
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [currentMonthIncome, debtorsCount] = await Promise.all([
      Payment.aggregate([
        { $match: { month: currentMonth, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      (async () => {
        const activeWithGroup = await Student.countDocuments({ status: 'active', group: { $ne: null } });
        const paid = await Payment.distinct('student', { month: currentMonth, status: 'paid' });
        return activeWithGroup - paid.length;
      })(),
    ]);

    // ── Yillik jami daromad ───────────────────────────────────────
    const yearTotal = await Payment.aggregate([
      { $match: { status: 'paid', month: { $regex: `^${year}-` } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalStudents, activeStudents,
          totalTeachers, totalGroups,
          debtorsCount: Math.max(0, debtorsCount),
          currentMonthIncome: currentMonthIncome[0]?.total || 0,
          yearTotal: yearTotal[0]?.total || 0,
          currentMonth,
        },
        monthlyPayments: monthlyPayments.map((m) => ({
          month: m._id,
          total: m.total,
          count: m.count,
        })),
        paymentTypes:    paymentTypes.map((p) => ({ type: p._id, total: p.total, count: p.count })),
        paymentStatuses: paymentStatuses.map((p) => ({ status: p._id, count: p.count })),
        studentsByGroup,
        year: Number(year),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
