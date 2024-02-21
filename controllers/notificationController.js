const asyncHandler = require('express-async-handler');
const Notification = require('../models/notificationModel');

// Récupérer les notifications d'un utilisateur
exports.getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(notifications);
});

// Marquer une notification comme lue
exports.markAsRead = asyncHandler(async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.status(204).end();
});
