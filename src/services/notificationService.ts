import prisma from '../utils/prisma';

export interface CreateNotificationInput {
  userId: bigint;
  title: string;
  content: string;
  type?: 'NEWS' | 'SYSTEM' | 'PROMOTION' | 'TRANSACTION' | 'APPOINTMENT' | 'LISTING' | 'PROJECT' | 'PROPERTY';
  public?: number;
}

// Create notification
export const createNotification = async (input: CreateNotificationInput) => {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      content: input.content,
      type: input.type || 'SYSTEM',
      public: input.public ?? 1,
      isRead: false,
    },
  });
};

// Create notification for multiple users
export const createBulkNotifications = async (userIds: bigint[], data: Omit<CreateNotificationInput, 'userId'>) => {
  await prisma.notification.createMany({
    data: userIds.map(userId => ({
      userId,
      title: data.title,
      content: data.content,
      type: data.type || 'SYSTEM',
      public: data.public ?? 1,
      isRead: false,
    })),
  });

  return { success: true, count: userIds.length };
};

// Get my notifications
export const getMyNotifications = async (userId: bigint, filters: {
  isRead?: boolean;
  type?: string;
  page?: number;
  limit?: number;
} = {}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    userId: userId,
  };

  if (filters.isRead !== undefined) {
    where.isRead = filters.isRead;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get notification by ID
export const getNotificationById = async (notificationId: bigint, userId: bigint) => {
  const notification = await prisma.notification.findUnique({
    where: { notificationId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new Error('Not authorized to view this notification');
  }

  return notification;
};

// Mark notification as read
export const markAsRead = async (notificationId: bigint, userId: bigint) => {
  const notification = await prisma.notification.findUnique({
    where: { notificationId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new Error('Not authorized to update this notification');
  }

  return prisma.notification.update({
    where: { notificationId },
    data: { isRead: true },
  });
};

// Mark all as read
export const markAllAsRead = async (userId: bigint) => {
  await prisma.notification.updateMany({
    where: {
      userId: userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return { success: true };
};

// Delete notification
export const deleteNotification = async (notificationId: bigint, userId: bigint) => {
  const notification = await prisma.notification.findUnique({
    where: { notificationId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new Error('Not authorized to delete this notification');
  }

  await prisma.notification.delete({
    where: { notificationId },
  });

  return { success: true };
};

// Delete all notifications
export const deleteAllNotifications = async (userId: bigint) => {
  await prisma.notification.deleteMany({
    where: { userId },
  });

  return { success: true };
};

// Get unread count
export const getUnreadCount = async (userId: bigint) => {
  const count = await prisma.notification.count({
    where: {
      userId: userId,
      isRead: false,
    },
  });

  return { count };
};
