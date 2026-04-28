const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { calcRequired } = require('./debtorController');
const { reconcileTeacherGroupLinks } = require('./teacherGroupSync');

exports.getPayments = async (req, res) => {
  try {
    const { month, group, status, category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (month) filter.month = month;
    if (group) filter.group = group;
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate('student', 'firstName lastName phone')
      .populate('group', 'name subject')
      .populate('teacher', 'firstName lastName')
      .sort({ paidAt: -1 });

    const totalAmount = payments
      .filter((p) => p.status === 'paid' || p.status === 'partial')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({ success: true, data: payments, totalAmount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { category = 'student', amount, paymentType, paidAt, note, description } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Summa majburiy' });
    }

    let paymentData = {
      category,
      amount: Number(amount),
      paymentType: paymentType || 'cash',
      paidAt: paidAt || new Date(),
      note: note || '',
      status: 'paid',
    };

    if (category === 'student') {
      const { student: studentId, group, month } = req.body;
      if (!studentId || !group || !month) {
        return res.status(400).json({ success: false, message: "O'quvchi, guruh va oy majburiy" });
      }

      const studentDoc = await Student.findById(studentId).populate('group', 'price');
      const required = calcRequired(
        studentDoc?.group?.price,
        studentDoc?.discount,
        studentDoc?.startDate,
        month
      );

      const existing = await Payment.aggregate([
        { $match: { student: studentDoc._id, month, category: 'student', status: { $in: ['paid', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const alreadyPaid = existing[0]?.total || 0;
      const newTotal = alreadyPaid + Number(amount);

      paymentData = {
        ...paymentData,
        student: studentId,
        group,
        month,
        required,
        status: required > 0 ? (newTotal >= required ? 'paid' : 'partial') : 'paid',
      };

    } else if (category === 'teacher') {
      const { teacher, month } = req.body;
      if (!teacher) {
        return res.status(400).json({ success: false, message: "O'qituvchi majburiy" });
      }
      paymentData = { ...paymentData, teacher, month: month || '', description: description || '' };

    } else {
      if (!description) {
        return res.status(400).json({ success: false, message: 'Tavsif majburiy' });
      }
      paymentData = { ...paymentData, description };
    }

    const payment = await Payment.create(paymentData);
    const populated = await payment.populate([
      { path: 'student', select: 'firstName lastName phone' },
      { path: 'group', select: 'name subject' },
      { path: 'teacher', select: 'firstName lastName' },
    ]);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('student', 'firstName lastName phone')
      .populate('group', 'name subject')
      .populate('teacher', 'firstName lastName');
    if (!payment) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.getTeacherSalary = async (req, res) => {
  try {
    await reconcileTeacherGroupLinks();

    const includeInactive = ['1', 'true'].includes(String(req.query.includeInactive || '').toLowerCase());
    const teacherFilter = includeInactive ? {} : { status: 'active' };
    const teachers = await Teacher.find(teacherFilter).populate('group', 'name subject');

    const result = await Promise.all(teachers.map(async (t) => {
      let totalShouldReceive = 0;
      let monthlyBreakdown = [];

      if (t.group) {
        const studentPaymentsByMonth = await Payment.aggregate([
          {
            $match: {
              group: t.group._id,
              category: 'student',
              status: { $in: ['paid', 'partial'] },
            },
          },
          {
            $group: {
              _id: '$month',
              total: { $sum: '$amount' },
            },
          },
          { $sort: { _id: -1 } },
        ]);

        monthlyBreakdown = studentPaymentsByMonth.map((monthRow) => {
          const shouldReceive = t.salaryType === 'percent'
            ? Math.round(monthRow.total * t.salary / 100)
            : (monthRow.total > 0 ? t.salary : 0);
          return {
            month: monthRow._id,
            studentPayments: monthRow.total,
            shouldReceive,
          };
        });

        totalShouldReceive = monthlyBreakdown.reduce((sum, monthRow) => sum + monthRow.shouldReceive, 0);
      }

      const teacherPayments = await Payment.find({
        teacher: t._id,
        category: 'teacher',
        status: { $in: ['paid', 'partial'] },
      }).select('amount month paidAt paymentType note').sort({ paidAt: -1 });

      const totalPaid = teacherPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.max(0, totalShouldReceive - totalPaid);

      return {
        _id: t._id,
        firstName: t.firstName,
        lastName: t.lastName,
        salary: t.salary,
        salaryType: t.salaryType,
        group: t.group,
        totalShouldReceive,
        totalPaid,
        balance,
        monthlyBreakdown,
        paymentHistory: teacherPayments,
      };
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, message: "To'lov o'chirildi" });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

