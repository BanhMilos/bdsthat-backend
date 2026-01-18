import prisma from '../utils/prisma';

export interface CreateChatRoomInput {
  listingId?: bigint;
  memberIds: bigint[];
}

export interface SendMessageInput {
  roomId: bigint;
  senderId: bigint;
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
  media?: string;
  metadata?: any;
}

// Create a chat room
export const createChatRoom = async (input: CreateChatRoomInput, createdBy: bigint) => {
  const room = await prisma.chatRoom.create({
    data: {
      listingId: input.listingId,
      createdBy: createdBy,
      isActive: true,
      membersCount: input.memberIds.length,
    },
  });

  // Add members to the room
  await prisma.member.createMany({
    data: input.memberIds.map(userId => ({
      userId: userId,
      roomId: room.roomId,
      status: 'JOINED',
      notification: 1,
    })),
  });

  return prisma.chatRoom.findUnique({
    where: { roomId: room.roomId },
    include: {
      Member: {
        include: {
          User: {
            select: {
              userId: true,
              fullname: true,
              avatar: true,
            },
          },
        },
      },
      Listing: {
        select: {
          listingId: true,
          title: true,
        },
      },
    },
  });
};

// Get or create a direct chat between two users for a listing
export const getOrCreateDirectChat = async (userId1: bigint, userId2: bigint, listingId?: bigint) => {
  // Check if chat already exists
  const existingRoom = await prisma.chatRoom.findFirst({
    where: {
      listingId: listingId,
      Member: {
        every: {
          userId: {
            in: [userId1, userId2],
          },
        },
      },
      membersCount: 2,
    },
    include: {
      Member: {
        include: {
          User: {
            select: {
              userId: true,
              fullname: true,
              avatar: true,
            },
          },
        },
      },
      Listing: {
        select: {
          listingId: true,
          title: true,
        },
      },
    },
  });

  if (existingRoom) {
    return existingRoom;
  }

  // Create new room
  return createChatRoom({ listingId, memberIds: [userId1, userId2] }, userId1);
};

// Send a message
export const sendMessage = async (input: SendMessageInput) => {
  // Verify sender is a member of the room
  const member = await prisma.member.findFirst({
    where: {
      roomId: input.roomId,
      userId: input.senderId,
      status: 'JOINED',
    },
  });

  if (!member) {
    throw new Error('Not a member of this chat room');
  }

  const message = await prisma.message.create({
    data: {
      roomId: input.roomId,
      senderId: input.senderId,
      content: input.content,
      messageType: input.messageType as any || 'TEXT',
      media: input.media,
      metadata: input.metadata,
      isRead: false,
    },
    include: {
      User: {
        select: {
          userId: true,
          fullname: true,
          avatar: true,
        },
      },
    },
  });

  // Update room's last message
  await prisma.chatRoom.update({
    where: { roomId: input.roomId },
    data: {
      lastMessageId: message.messageId,
      lastMessageAt: new Date(),
    },
  });

  return message;
};

// Get messages in a chat room
export const getChatMessages = async (roomId: bigint, userId: bigint, filters: {
  page?: number;
  limit?: number;
} = {}) => {
  // Verify user is a member
  const member = await prisma.member.findFirst({
    where: {
      roomId: roomId,
      userId: userId,
    },
  });

  if (!member) {
    throw new Error('Not a member of this chat room');
  }

  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { roomId: roomId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            userId: true,
            fullname: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.message.count({ where: { roomId: roomId } }),
  ]);

  return {
    messages: messages.reverse(), // Reverse to show oldest first
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get user's chat rooms
export const getMyChatRooms = async (userId: bigint, filters: {
  page?: number;
  limit?: number;
} = {}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [rooms, total] = await Promise.all([
    prisma.chatRoom.findMany({
      where: {
        Member: {
          some: {
            userId: userId,
          },
        },
        isActive: true,
      },
      skip,
      take: limit,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        Member: {
          include: {
            User: {
              select: {
                userId: true,
                fullname: true,
                avatar: true,
              },
            },
          },
        },
        Listing: {
          select: {
            listingId: true,
            title: true,
            price: true,
          },
        },
        Message_ChatRoom_lastMessageIdToMessage: {
          select: {
            messageId: true,
            content: true,
            messageType: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.chatRoom.count({
      where: {
        Member: {
          some: {
            userId: userId,
          },
        },
        isActive: true,
      },
    }),
  ]);

  return {
    rooms,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Mark messages as read
export const markMessagesAsRead = async (roomId: bigint, userId: bigint) => {
  // Verify user is a member
  const member = await prisma.member.findFirst({
    where: {
      roomId: roomId,
      userId: userId,
    },
  });

  if (!member) {
    throw new Error('Not a member of this chat room');
  }

  // Mark all messages not sent by user as read
  await prisma.message.updateMany({
    where: {
      roomId: roomId,
      senderId: { not: userId },
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return { success: true };
};

// Leave chat room
export const leaveChatRoom = async (roomId: bigint, userId: bigint) => {
  await prisma.member.updateMany({
    where: {
      roomId: roomId,
      userId: userId,
    },
    data: {
      status: 'BLOCKED',
    },
  });

  return { success: true };
};
