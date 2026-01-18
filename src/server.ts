import dotenv from 'dotenv';
import app from './app';
import prisma from './utils/prisma';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

async function main() {
  try {
    await prisma.$connect();
    const server = app.listen(port, () => {
      console.log(`[${new Date().toISOString()}] Server running on port ${port}`);
    });
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(async () => {
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
