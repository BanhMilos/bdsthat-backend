import express from 'express';
import { authenticate } from '../middleware/auth';
import * as notificationController from '../controllers/notificationController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get my notifications - must come before /:id route
router.get('/my-notifications', notificationController.getMyNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Get notification by ID
router.get('/:id', notificationController.getNotificationById);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);

// Create notification (admin only - add admin middleware later)
router.post('/', notificationController.createNotification);

export default router;
