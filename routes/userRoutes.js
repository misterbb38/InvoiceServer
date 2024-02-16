const express = require('express');
const {
signup,
login,
getProfile,
updateProfile,
deleteUser} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.delete('/delete', protect, deleteUser);

module.exports = router;
