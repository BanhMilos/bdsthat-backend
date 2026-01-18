import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as chatService from '../services/chatService';
import { AuthRequest } from '../middleware/auth';

// Create chat room
export const createChatRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      listingId: z.string().optional(),
      memberIds: z.array(z.string()).min(1),
    });

    const data = schema.parse(req.body);
    const userId = BigInt(req.user!.userId);

    const room = await chatService.createChatRoom(
      {
        listingId: data.listingId ? BigInt(data.listingId) : undefined,
        memberIds: data.memberIds.map(id => BigInt(id)),
      },
      userId
    );

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// Get or create direct chat
export const getOrCreateDirectChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      otherUserId: z.string(),
      listingId: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const userId = BigInt(req.user!.userId);

    const room = await chatService.getOrCreateDirectChat(
      userId,
      BigInt(data.otherUserId),
      data.listingId ? BigInt(data.listingId) : undefined
    );

    res.status(200).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// Send message
export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      roomId: z.string(),
      content: z.string().min(1),
      messageType: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'FILE']).optional(),
      media: z.string().optional(),
      metadata: z.any().optional(),
    });

    const data = schema.parse(req.body);
    const userId = BigInt(req.user!.userId);

    const message = await chatService.sendMessage({
      roomId: BigInt(data.roomId),
      senderId: userId,
      content: data.content,
      messageType: data.messageType,
      media: data.media,
      metadata: data.metadata,
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// Get chat messages
export const getChatMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const roomId = BigInt(req.params.roomId);
    const userId = BigInt(req.user!.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await chatService.getChatMessages(roomId, userId, { page, limit });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Get my chat rooms
export const getMyChatRooms = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = BigInt(req.user!.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await chatService.getMyChatRooms(userId, { page, limit });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const roomId = BigInt(req.params.roomId);
    const userId = BigInt(req.user!.userId);

    const result = await chatService.markMessagesAsRead(roomId, userId);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Leave chat room
export const leaveChatRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Handle both POST (with body) and DELETE (with params)
    let roomId: bigint;
    
    if (req.method === 'POST' && req.body.roomId) {
      roomId = BigInt(req.body.roomId);
    } else if (req.params.roomId) {
      roomId = BigInt(req.params.roomId);
    } else {
      throw new Error('roomId is required');
    }

    const userId = BigInt(req.user!.userId);

    const result = await chatService.leaveChatRoom(roomId, userId);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Add member to chat room
export const addMemberToChatRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      roomId: z.string(),
      userId: z.string(),
      role: z.string().optional(),
    });

    const data = schema.parse(req.body);

    // TODO: Implement addMember service function
    res.status(200).json({ success: true, message: 'Member added' });
  } catch (error) {
    next(error);
  }
};

// Create AI chat room
export const createAIChatRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = BigInt(req.user!.userId);

    // TODO: Implement createAIRoom service function
    res.status(201).json({ success: true, message: 'AI chat room created' });
  } catch (error) {
    next(error);
  }
};

// Delete chat room (same as leaveRoom for now)
export const deleteChatRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      roomId: z.string(),
    });

    const data = schema.parse(req.body);
    const roomId = BigInt(data.roomId);
    const userId = BigInt(req.user!.userId);

    const result = await chatService.leaveChatRoom(roomId, userId);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Get chat room details with messages
export const getChatRoomDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const roomId = BigInt(req.params.roomId);
    const userId = BigInt(req.user!.userId);
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 100;

    const result = await chatService.getChatMessages(roomId, userId, { page: page + 1, limit });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
