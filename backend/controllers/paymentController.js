const Payment = require('../models/Payment');

exports.getPayments = async (req, res) => {
  try {
    const { month, group, status } = req.query;
    const filter = {};
    if (month)  filter.month  = month;
    if (group)  filter.group  = group;
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate('student', 'firstName lastName phone')
      .populate('group', 'name subject')
      .sort({ paidAt: -1 });

    const totalAmount = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({ success: true, data: payments, totalAmount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { student, group, amount, paymentType, month, paidAt, note, status } = req.body;
    if (!student || !group || !amount || !month) {
      return res.status(400).json({ success: false, message: "O'quvchi, guruh, summa va oy majburiy" });
    }
    const payment = await Payment.create({ student, group, amount, paymentType, month, paidAt, note, status });
    const populated = await payment.populate([
      { path: 'student', select: 'firstName lastName phone' },
      { path: 'group',   select: 'name subject' },
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
      .populate('group', 'name subject');
    if (!payment) return res.status(404).json({ success: false, message: 'Topilmadi' });
    res.json({ success: true, data: payment });
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
