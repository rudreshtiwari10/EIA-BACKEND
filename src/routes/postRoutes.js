const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createPost,
  getAllPosts,
  getPostsByUser,
  getPostsByIsland,
  deletePost,
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

const router = express.Router();

router.get('/', getAllPosts);
router.post('/', protect, upload.single('image'), createPost);
router.get('/user/:userId', getPostsByUser);
router.get('/island/:islandId', getPostsByIsland);
router.delete('/:id', protect, deletePost);

module.exports = router;
