const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getEngines } = require('../controllers/partsController');

router.get('/engines', protect, getEngines);

module.exports = router;
