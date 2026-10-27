const Notification = require('../models/Notification');

/**
 * Creates in-app notification record
 */
const createNotification = async ({ userId, title, message, type = 'system', metadata = {} }) => {
  try {
    return await Notification.create({
      user: userId,
      title,
      message,
      type,
      metadata
    });
  } catch (error) {
    console.error(`[NotificationService] Failed to create notification: ${error.message}`);
    return null;
  }
};

module.exports = {
  createNotification
};
