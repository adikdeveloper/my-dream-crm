const express = require('express');
const { getReports } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/', getReports);

module.exports = router;
