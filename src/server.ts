import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app';
import prisma from './utils/prisma';
import { setupWebSocketServer } from './websocket/websocketServer';

dotenv.config();

// Fix BigInt serialization for JSON responses
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

async function main() {
  try {
    await prisma.$connect();
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Setup WebSocket server
    setupWebSocketServer(httpServer);
    
    // Start listening
    httpServer.listen(port, () => {
      console.log(`[${new Date().toISOString()}] Server running on port ${port}`);
      console.log(`[${new Date().toISOString()}] WebSocket available at ws://localhost:${port}/ws`);
    });
    
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      httpServer.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
}

void main();
