const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadModelFile, importModelFromUrl } = require('../controllers/uploadController');

// Multer errors (bad file type, too large) need to be caught explicitly
// since they throw before reaching the controller.
const handleUpload = (req, res, next) => {
  upload.single('model')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.post('/model', protect, handleUpload, uploadModelFile);
router.post('/model-from-url', protect, importModelFromUrl);

module.exports = router;
