import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as notificationService from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';

// Create notification (admin only - will need admin middleware)
export const createNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      title: z.string().min(1),
      content: z.string().min(1),
      type: z.enum(['NEWS', 'SYSTEM', 'PROMOTION', 'TRANSACTION', 'APPOINTMENT', 'LISTING', 'PROJECT', 'PROPERTY']).optional(),
      public: z.number().optional(),
    });

    const data = schema.parse(req.body);

    const notification = await notificationService.createNotification({
      userId: BigInt(data.userId),
      title: data.title,
      content: data.content,
      type: data.type,
      public: data.public,
    });

    return res.status(201).json({ result: 'success', notification });
  } catch (error) {
    next(error);
  }
};

// Get my notifications
export const getMyNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = BigInt(req.user!.userId);
    const isRead = req.query.isRead ? req.query.isRead === 'true' : undefined;
    const type = req.query.type as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationService.getMyNotifications(userId, { isRead, type, page, limit });

    return res.status(200).json({ 
      result: 'success', 
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages
    });
  } catch (error) {
    next(error);
  }
};

// Get notification by ID
export const getNotificationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notificationId = BigInt(req.params.id);
    const userId = BigInt(req.user!.userId);

    const notification = await notificationService.getNotificationById(notificationId, userId);

    if (!notification) {
      return res.status(404).json({ result: 'failed', reason: 'Notification not found' });
    }

    return res.status(200).json({ result: 'success', notification });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notificationId = BigInt(req.params.id);
    const userId = BigInt(req.user!.userId);

    const notification = await notificationService.markAsRead(notificationId, userId);

    return res.status(200).json({ result: 'success', notification });
  } catch (error) {
    next(error);
  }
};

// Mark all as read
export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = BigInt(req.user!.userId);

    const count = await notificationService.markAllAsRead(userId);

    return res.status(200).json({ result: 'success', count });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notificationId = BigInt(req.params.id);
    const userId = BigInt(req.user!.userId);

    await notificationService.deleteNotification(notificationId, userId);

    return res.status(200).json({ result: 'success' });
  } catch (error) {
    next(error);
  }
};

// Delete all notifications
export const deleteAllNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = BigInt(req.user!.userId);

    const count = await notificationService.deleteAllNotifications(userId);

    return res.status(200).json({ result: 'success', count });
  } catch (error) {
    next(error);
  }
};

// Get unread count
export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = BigInt(req.user!.userId);

    const count = await notificationService.getUnreadCount(userId);

    return res.status(200).json({ result: 'success', unreadCount: count });
  } catch (error) {
    next(error);
  }
};
