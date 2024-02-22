const asyncHandler = require('express-async-handler');
const Notification = require('../models/notificationModel');

// Récupérer les notifications d'un utilisateur
exports.getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(notifications);
});

// Marquer une notification comme lue
exports.markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndUpdate(
        req.params.id, 
        { $set: { read: req.body.read } },
        { new: true } // Retourne le document mis à jour
    );

    if (!notification) {
        res.status(404).json({ message: 'Notification non trouvée' });
        return;
    }

    res.status(200).json(notification);
});


// Compter les notifications non lues d'un utilisateur
exports.countUnreadNotifications = asyncHandler(async (req, res) => {
    const unreadCount = await Notification.countDocuments({
        userId: req.user._id, // Supposons que l'ID de l'utilisateur est disponible via req.user._id
        read: false
    });
    res.json({ unreadCount });
});
