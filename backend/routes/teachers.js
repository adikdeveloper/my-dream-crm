const express = require('express');
const { getTeachers, createTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(getTeachers).post(createTeacher);
router.route('/:id').put(updateTeacher).delete(deleteTeacher);

module.exports = router;
