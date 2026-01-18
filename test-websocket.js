/**
 * WebSocket Test Script
 * Tests user_login and user_message commands
 */

const WebSocket = require('ws');
const readline = require('readline');

const WS_URL = 'ws://localhost:3000/ws';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

let ws = null;
let isAuthenticated = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function connectWebSocket() {
  log('🔌 Connecting to WebSocket server...', colors.cyan);
  
  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    log('✅ Connected to WebSocket server!', colors.green);
    log('\n📝 Available commands:', colors.yellow);
    log('  1. login <userId> <token> <uuid>  - Login to WebSocket');
    log('  2. send <roomId> <message>        - Send text message');
    log('  3. exit                           - Close connection');
    log('\nExample: login 4 your-jwt-token device-123\n', colors.blue);
    promptCommand();
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      log('\n📨 Received:', colors.cyan);
      console.log(JSON.stringify(message, null, 2));
      
      // Check if login was successful
      if (message.command === 'user_login' && message.result === 'success') {
        isAuthenticated = true;
        log('\n✅ Authentication successful!', colors.green);
      }
      
      promptCommand();
    } catch (error) {
      log(`❌ Error parsing message: ${error.message}`, colors.red);
      promptCommand();
    }
  });

  ws.on('error', (error) => {
    log(`❌ WebSocket error: ${error.message}`, colors.red);
  });

  ws.on('close', () => {
    log('🔌 Connection closed', colors.yellow);
    process.exit(0);
  });
}

function promptCommand() {
  rl.question('> ', (input) => {
    handleCommand(input.trim());
  });
}

function handleCommand(input) {
  if (!input) {
    promptCommand();
    return;
  }

  const parts = input.split(' ');
  const command = parts[0].toLowerCase();

  try {
    switch (command) {
      case 'login': {
        if (parts.length < 4) {
          log('❌ Usage: login <userId> <token> <uuid>', colors.red);
          promptCommand();
          return;
        }
        
        const userId = parseInt(parts[1]);
        const token = parts[2];
        const uuid = parts[3];
        
        const loginCommand = {
          command: 'user_login',
          userId,
          token,
          uuid
        };
        
        log('📤 Sending login command...', colors.blue);
        ws.send(JSON.stringify(loginCommand));
        break;
      }

      case 'send': {
        if (!isAuthenticated) {
          log('❌ Please login first!', colors.red);
          promptCommand();
          return;
        }
        
        if (parts.length < 3) {
          log('❌ Usage: send <roomId> <message>', colors.red);
          promptCommand();
          return;
        }
        
        const roomId = parseInt(parts[1]);
        const content = parts.slice(2).join(' ');
        
        const messageCommand = {
          command: 'user_message',
          roomId,
          content,
          messageType: 'TEXT'
        };
        
        log('📤 Sending message...', colors.blue);
        ws.send(JSON.stringify(messageCommand));
        break;
      }

      case 'exit': {
        log('👋 Closing connection...', colors.yellow);
        ws.close();
        break;
      }

      default: {
        log('❌ Unknown command. Available: login, send, exit', colors.red);
        promptCommand();
        break;
      }
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    promptCommand();
  }
}

// Start the test
log('🚀 WebSocket Test Client', colors.green);
log('========================\n', colors.green);
connectWebSocket();

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('\n👋 Closing connection...', colors.yellow);
  if (ws) {
    ws.close();
  }
  process.exit(0);
});
