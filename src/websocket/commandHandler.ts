import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: bigint;
  uuid?: string;
  isAlive?: boolean;
}

interface UserLoginCommand {
  command: 'user_login';
  userId: number;
  token: string;
  uuid: string;
}

interface UserMessageCommand {
  command: 'user_message';
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
  roomId: number;
  media?: string;
}

type WebSocketCommand = UserLoginCommand | UserMessageCommand;

// Store active connections: userId -> WebSocket[]
const activeConnections = new Map<string, AuthenticatedWebSocket[]>();

// Verify JWT token
const verifyToken = async (token: string): Promise<{ userId: bigint } | null> => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string };
    return { userId: BigInt(decoded.userId) };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

// Handle user login
export const handleUserLogin = async (
  ws: AuthenticatedWebSocket,
  data: UserLoginCommand
): Promise<void> => {
  try {
    // Verify token
    const tokenData = await verifyToken(data.token);
    if (!tokenData) {
      ws.send(JSON.stringify({
        command: 'user_login',
        result: 'failed',
        reason: 'Invalid token'
      }));
      return;
    }

    // Check if userId matches token
    if (BigInt(data.userId) !== tokenData.userId) {
      ws.send(JSON.stringify({
        command: 'user_login',
        result: 'failed',
        reason: 'User ID mismatch'
      }));
      return;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { userId: tokenData.userId },
      select: {
        userId: true,
        fullname: true,
        email: true,
        phone: true,
        avatar: true,
        primaryRole: true,
        status: true,
      }
    });

    if (!user) {
      ws.send(JSON.stringify({
        command: 'user_login',
        result: 'failed',
        reason: 'User not found'
      }));
      return;
    }

    // Attach user info to WebSocket
    ws.userId = tokenData.userId;
    ws.uuid = data.uuid;
    ws.isAlive = true;

    // Store connection
    const userIdStr = tokenData.userId.toString();
    if (!activeConnections.has(userIdStr)) {
      activeConnections.set(userIdStr, []);
    }
    activeConnections.get(userIdStr)!.push(ws);

    console.log(`[WS] User ${user.fullname} (${user.userId}) logged in with uuid ${data.uuid}`);

    // Send success response
    ws.send(JSON.stringify({
      command: 'user_login',
      result: 'success',
      user: {
        userId: user.userId.toString(),
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        primaryRole: user.primaryRole,
        status: user.status,
      }
    }));
  } catch (error) {
    console.error('[WS] Login error:', error);
    ws.send(JSON.stringify({
      command: 'user_login',
      result: 'failed',
      reason: 'Internal server error'
    }));
  }
};

// Handle user message
export const handleUserMessage = async (
  ws: AuthenticatedWebSocket,
  data: UserMessageCommand
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!ws.userId) {
      ws.send(JSON.stringify({
        command: 'user_message',
        result: 'failed',
        reason: 'Not authenticated'
      }));
      return;
    }

    // Validate required fields
    if (!data.content || !data.roomId || !data.messageType) {
      ws.send(JSON.stringify({
        command: 'user_message',
        result: 'failed',
        reason: 'Missing required fields'
      }));
      return;
    }

    const roomId = BigInt(data.roomId);

    // Check if room exists and user is a member
    const room = await prisma.chatRoom.findUnique({
      where: { roomId },
      include: {
        Member: {
          where: { userId: ws.userId }
        },
        Listing: {
          select: {
            listingId: true,
            title: true,
          }
        }
      }
    });

    if (!room) {
      ws.send(JSON.stringify({
        command: 'user_message',
        result: 'failed',
        reason: 'Chat room not found'
      }));
      return;
    }

    if (room.Member.length === 0) {
      ws.send(JSON.stringify({
        command: 'user_message',
        result: 'failed',
        reason: 'You are not a member of this room'
      }));
      return;
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        roomId,
        senderId: ws.userId,
        content: data.content,
        messageType: data.messageType,
        media: data.media || null,
        isRead: false,
      }
    });

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { userId: ws.userId },
      select: {
        userId: true,
        fullname: true,
        avatar: true,
        primaryRole: true,
      }
    });

    // Update chat room last message
    await prisma.chatRoom.update({
      where: { roomId },
      data: {
        lastMessageId: message.messageId,
        lastMessageAt: message.createdAt,
      }
    });

    // Get all room members
    const members = await prisma.member.findMany({
      where: { roomId },
      select: { userId: true }
    });

    // Prepare broadcast message
    const broadcastMessage = {
      command: 'user_message',
      message: {
        messageId: message.messageId.toString(),
        content: message.content,
        roomId: message.roomId.toString(),
        messageType: message.messageType,
        media: message.media,
        createdAt: message.createdAt?.toISOString(),
        sender: {
          userId: sender!.userId.toString(),
          fullname: sender!.fullname,
          avatar: sender!.avatar,
          primaryRole: sender!.primaryRole,
        }
      },
      room: {
        roomId: room.roomId.toString(),
        listingId: room.Listing?.listingId.toString(),
        title: room.Listing?.title,
      }
    };

    // Broadcast to all room members
    for (const member of members) {
      const memberIdStr = member.userId.toString();
      const memberConnections = activeConnections.get(memberIdStr);
      
      if (memberConnections) {
        for (const memberWs of memberConnections) {
          if (memberWs.readyState === WebSocket.OPEN) {
            memberWs.send(JSON.stringify(broadcastMessage));
          }
        }
      }
    }

    console.log(`[WS] Message sent in room ${roomId} by user ${ws.userId}`);
  } catch (error) {
    console.error('[WS] Message error:', error);
    ws.send(JSON.stringify({
      command: 'user_message',
      result: 'failed',
      reason: 'Internal server error'
    }));
  }
};

// Handle incoming WebSocket commands
export const handleCommand = async (
  ws: AuthenticatedWebSocket,
  message: string
): Promise<void> => {
  try {
    const data: WebSocketCommand = JSON.parse(message);

    switch (data.command) {
      case 'user_login':
        await handleUserLogin(ws, data);
        break;
      case 'user_message':
        await handleUserMessage(ws, data);
        break;
      default:
        ws.send(JSON.stringify({
          result: 'failed',
          reason: 'Unknown command'
        }));
    }
  } catch (error) {
    console.error('[WS] Command handling error:', error);
    ws.send(JSON.stringify({
      result: 'failed',
      reason: 'Invalid message format'
    }));
  }
};

// Remove connection on disconnect
export const handleDisconnect = (ws: AuthenticatedWebSocket): void => {
  if (ws.userId) {
    const userIdStr = ws.userId.toString();
    const connections = activeConnections.get(userIdStr);
    
    if (connections) {
      const index = connections.indexOf(ws);
      if (index > -1) {
        connections.splice(index, 1);
      }
      
      if (connections.length === 0) {
        activeConnections.delete(userIdStr);
      }
    }
    
    console.log(`[WS] User ${ws.userId} disconnected (uuid: ${ws.uuid})`);
  }
};

// Send ping to keep connection alive
export const setupHeartbeat = (ws: AuthenticatedWebSocket): void => {
  ws.isAlive = true;
  
  ws.on('pong', () => {
    ws.isAlive = true;
  });
};

// Get active connections (for monitoring)
export const getActiveConnections = (): Map<string, AuthenticatedWebSocket[]> => {
  return activeConnections;
};
