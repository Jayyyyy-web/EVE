const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const MODELS_DIR = path.join(__dirname, '..', 'uploads', 'models');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MODELS_DIR),
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}.glb`),
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.glb' || ext === '.gltf') {
    cb(null, true);
  } else {
    cb(new Error('Only .glb or .gltf files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60MB
});

module.exports = upload;
