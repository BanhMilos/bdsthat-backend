import express from 'express';
import { authenticate } from '../middleware/auth';
import * as chatController from '../controllers/chatController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create chat room
router.post('/createRoom', chatController.createChatRoom);

// Send message
router.post('/sendMessage', chatController.sendMessage);

// Get my chat rooms
router.get('/myRooms', chatController.getMyChatRooms);

// Delete chat room
router.post('/deleteRoom', chatController.deleteChatRoom);

// Get chat room details with messages
router.get('/loadMessages', chatController.getChatRoomDetails);

// Get specific chat room details
router.get('/room/:roomId', chatController.getChatRoomDetails);

// Leave chat room
router.post('/leaveRoom', chatController.leaveChatRoom);

// Add member to room
router.post('/addMember', chatController.addMemberToChatRoom);

// Create AI chat room
router.post('/createAIRoom', chatController.createAIChatRoom);

// Legacy routes (keeping for compatibility)
router.post('/direct', chatController.getOrCreateDirectChat);
router.post('/rooms', chatController.createChatRoom);
router.post('/messages', chatController.sendMessage);
router.get('/rooms', chatController.getMyChatRooms);
router.get('/rooms/:roomId/messages', chatController.getChatMessages);
router.put('/rooms/:roomId/read', chatController.markMessagesAsRead);
router.delete('/rooms/:roomId', chatController.leaveChatRoom);

export default router;
