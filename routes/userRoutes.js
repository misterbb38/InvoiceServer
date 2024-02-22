const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const {
signup,
login,
getProfile,
updateProfile,
deleteUser,
getSimpleUsers,
assignAccessKey } = require('../controllers/userController');
const { protect} = require('../middleware/authMiddleware'); // Supposons que vous avez un middleware pour vérifier si l'utilisateur est admin



const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.get('/profile', protect, getProfile);
router.put('/profile', protect,  upload.single('logo'), updateProfile);
router.delete('/delete', protect, deleteUser);
router.get('/simpleusers', protect, getSimpleUsers);
router.route('/assign-access-key').post(protect,  assignAccessKey);

module.exports = router;
