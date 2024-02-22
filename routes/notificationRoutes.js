const express = require('express');
const { getNotifications, markAsRead, countUnreadNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();


router.get('/countUnread', protect, countUnreadNotifications); 
router.get('/:userId', protect, getNotifications);
router.patch('/:id/read', protect,  markAsRead);
router.get('/countUnread', protect, countUnreadNotifications); 

module.exports = router;

