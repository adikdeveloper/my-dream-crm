const express = require('express');
const { getPayments, createPayment, updatePayment, deletePayment, getTeacherSalary } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/teacher-salary', getTeacherSalary);
router.route('/').get(getPayments).post(createPayment);
router.route('/:id').put(updatePayment).delete(deletePayment);

module.exports = router;
