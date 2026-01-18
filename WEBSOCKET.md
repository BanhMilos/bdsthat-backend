# WebSocket Implementation for BDSTHAT Backend

## Overview
WebSocket server for real-time messaging implemented at `/ws` endpoint.

## Installation
The WebSocket server is automatically started with the main HTTP server on port 3000.

## Connection
```
ws://localhost:3000/ws
```

For production:
```
wss://dev.bdsthat.com.vn/ws
wss://bdsthat.com.vn/ws
```

## Testing with wscat

Install wscat globally:
```bash
npm install -g wscat
```

Connect to WebSocket server:
```bash
wscat -c ws://localhost:3000/ws
```

## Implemented Commands

### 1. User Login (`user_login`)

Authenticate user via WebSocket connection.

**Request:**
```json
{
  "command": "user_login",
  "userId": 4,
  "token": "your-jwt-token-here",
  "uuid": "device-uuid-here"
}
```

**Success Response:**
```json
{
  "command": "user_login",
  "result": "success",
  "user": {
    "userId": "4",
    "fullname": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone": "+84123456789",
    "avatar": "https://example.com/avatar.jpg",
    "primaryRole": "AGENT",
    "status": "ACTIVE"
  }
}
```

**Error Response:**
```json
{
  "command": "user_login",
  "result": "failed",
  "reason": "Invalid token"
}
```

### 2. Send Message (`user_message`)

Send a message in a chat room.

**Request:**
```json
{
  "command": "user_message",
  "content": "Xin chào",
  "messageType": "TEXT",
  "roomId": 1
}
```

For image messages:
```json
{
  "command": "user_message",
  "content": "Có gì trong bức hình này",
  "roomId": 1,
  "messageType": "IMAGE",
  "media": "https://example.com/image.jpg"
}
```

**Broadcast to Room Members:**
All members in the chat room will receive:
```json
{
  "command": "user_message",
  "message": {
    "messageId": "123",
    "content": "Xin chào",
    "roomId": "1",
    "messageType": "TEXT",
    "media": null,
    "createdAt": "2024-12-18T10:20:30.123Z",
    "sender": {
      "userId": "4",
      "fullname": "Nguyễn Văn A",
      "avatar": "https://example.com/avatar.jpg",
      "primaryRole": "AGENT"
    }
  },
  "room": {
    "roomId": "1",
    "listingId": "123",
    "title": "Bán nhà mặt phố Hà Nội"
  }
}
```

**Error Response:**
```json
{
  "command": "user_message",
  "result": "failed",
  "reason": "Not authenticated"
}
```

## Message Types
Supported message types (from database enum):
- `TEXT` - Text message
- `IMAGE` - Image message (requires `media` field)
- `VIDEO` - Video message (requires `media` field)
- `FILE` - File attachment (requires `media` field)

## Features

### Authentication
- JWT token verification
- User session management per device UUID
- Multiple devices per user supported

### Real-time Messaging
- Broadcast messages to all room members
- Message persistence in database
- Automatic room last message update

### Connection Management
- Heartbeat/ping-pong to detect disconnections
- Automatic cleanup of dead connections
- Connection statistics logging every 60 seconds

### Security
- Only authenticated users can send messages
- Room membership verification
- Token-based authentication

## Architecture

### Files
- `src/websocket/websocketServer.ts` - WebSocket server setup and connection handling
- `src/websocket/commandHandler.ts` - Command processing and business logic
- `src/server.ts` - Integration with HTTP server

### Database Models Used
- `User` - User authentication and profile
- `ChatRoom` - Chat room information
- `Member` - Room membership
- `Message` - Message storage
- `Listing` - Associated listing information

## Testing Example

1. **Connect to WebSocket:**
```bash
wscat -c ws://localhost:3000/ws
```

2. **Login (User 1):**
```json
{"command": "user_login", "userId": 4, "token": "your-token-here", "uuid": "device-1"}
```

3. **Open another terminal and connect (User 2):**
```bash
wscat -c ws://localhost:3000/ws
```

4. **Login (User 2):**
```json
{"command": "user_login", "userId": 14, "token": "another-token-here", "uuid": "device-2"}
```

5. **Send message from User 1:**
```json
{"command": "user_message", "content": "Hello from User 1", "messageType": "TEXT", "roomId": 1}
```

6. **Both users will receive the broadcast message**

## Error Handling

Common error scenarios:
- Invalid token → "Invalid token"
- User not authenticated → "Not authenticated"
- Room not found → "Chat room not found"
- Not a room member → "You are not a member of this room"
- Invalid message format → "Invalid message format"
- Missing required fields → "Missing required fields"

## Monitoring

The WebSocket server logs:
- New connections
- User login/logout events
- Message sending events
- Connection statistics (every 60 seconds)
- Error events

## Next Steps

To complete WebSocket functionality:
1. Implement push notification integration
2. Add message read receipts
3. Add typing indicators
4. Add file upload handling
5. Add message editing/deletion
6. Add room creation/management via WebSocket
