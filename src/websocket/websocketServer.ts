import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { handleCommand, handleDisconnect, setupHeartbeat, getActiveConnections } from './commandHandler';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: bigint;
  uuid?: string;
  isAlive?: boolean;
}

export const setupWebSocketServer = (server: HTTPServer): WebSocketServer => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  console.log('[WS] WebSocket server initialized at /ws');

  // Handle new connections
  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    console.log('[WS] New client connected');

    // Setup heartbeat
    setupHeartbeat(ws);

    // Handle incoming messages
    ws.on('message', async (message: Buffer) => {
      try {
        const messageStr = message.toString();
        console.log('[WS] Received:', messageStr);
        await handleCommand(ws, messageStr);
      } catch (error) {
        console.error('[WS] Message processing error:', error);
        ws.send(JSON.stringify({
          result: 'failed',
          reason: 'Message processing failed'
        }));
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      handleDisconnect(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('[WS] WebSocket error:', error);
      handleDisconnect(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to BDSTHAT WebSocket server',
      timestamp: new Date().toISOString()
    }));
  });

  // Heartbeat interval to detect broken connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const authWs = ws as AuthenticatedWebSocket;
      
      if (authWs.isAlive === false) {
        console.log('[WS] Terminating inactive connection');
        return authWs.terminate();
      }
      
      authWs.isAlive = false;
      authWs.ping();
    });
  }, 30000); // 30 seconds

  // Cleanup on server close
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
    console.log('[WS] WebSocket server closed');
  });

  // Log connection stats periodically
  setInterval(() => {
    const activeConns = getActiveConnections();
    console.log(`[WS] Active users: ${activeConns.size}, Total connections: ${wss.clients.size}`);
  }, 60000); // 1 minute

  return wss;
};
