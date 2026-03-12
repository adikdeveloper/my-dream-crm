const express = require('express');
const { getDebtors } = require('../controllers/debtorController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/', getDebtors);

module.exports = router;
