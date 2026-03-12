const express = require('express');
const { getStudents, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.route('/').get(getStudents).post(createStudent);
router.route('/:id').put(updateStudent).delete(deleteStudent);

module.exports = router;
