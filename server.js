const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
require('dotenv').config({ path: '.env' });

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Game rooms storage
const gameRooms = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  console.log('Socket.IO server initialized');

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Create a new game room
    socket.on('create-game', ({ hostName }) => {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const gameState = {
        roomCode,
        host: socket.id,
        hostName,
        playerCount: 6, // Max 6 players
        players: [],
        bank: { id: 'bank', name: 'Bank', balance: 1000000, isBank: true },
        transactions: [],
        started: false,
      };

      gameRooms.set(roomCode, gameState);
      socket.join(roomCode);
      socket.emit('game-created', { roomCode, gameState });
      
      console.log(`Game created: ${roomCode} by ${hostName}`);
    });

    // Join a game room
    socket.on('join-game', ({ roomCode, playerName }) => {
      console.log(`join-game received: roomCode=${roomCode}, playerName="${playerName}"`);
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (gameState.started) {
        socket.emit('error', { message: 'Game already started' });
        return;
      }

      if (gameState.players.length >= gameState.playerCount) {
        socket.emit('error', { message: 'Game is full' });
        return;
      }

      const player = {
        id: socket.id,
        name: playerName,
        balance: 15000,
        isBank: false,
        color: null,
      };
        balance: 15000,
        isBank: false,
        color: null,
      };

      gameState.players.push(player);
      socket.join(roomCode);
      
      io.to(roomCode).emit('player-joined', { player, gameState });
      socket.emit('joined-game', { gameState, playerId: socket.id });
      
      console.log(`${playerName} joined game ${roomCode}`);
    });

    // Update player color
    socket.on('update-player-color', ({ roomCode, playerId, color }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState || gameState.host !== socket.id) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      const player = gameState.players.find(p => p.id === playerId);
      if (player) {
        // Remove color from any other player who has it
        gameState.players.forEach(p => {
          if (p.color === color && p.id !== playerId) {
            p.color = null;
          }
        });
        
        player.color = color;
        io.to(roomCode).emit('game-updated', { gameState });
        console.log(`Player ${player.name} color updated to ${color}`);
      }
    });

    // Host reconnects to room
    socket.on('rejoin-as-host', ({ roomCode }) => {
      console.log(`rejoin-as-host event received for room: ${roomCode}, socket: ${socket.id}`);
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState) {
        console.log(`Game not found for room code: ${roomCode}`);
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      console.log(`Found game state for room ${roomCode}:`, gameState);
      // Update host socket ID
      gameState.host = socket.id;
      socket.join(roomCode);
      socket.emit('game-created', { roomCode, gameState });
      
      console.log(`Host rejoined game ${roomCode}`);
    });

    // Player reconnects to room
    socket.on('rejoin-as-player', ({ roomCode, playerName }) => {
      console.log(`rejoin-as-player: roomCode=${roomCode}, playerName="${playerName}", socketId=${socket.id}`);
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState) {
        console.log(`Game not found for room code: ${roomCode}`);
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      console.log(`Current players in room:`, gameState.players.map(p => ({ name: p.name, id: p.id })));

      // Find player by name
      const player = gameState.players.find(p => p.name === playerName);
      
      if (player) {
        console.log(`Found player ${player.name}, updating socket ID from ${player.id} to ${socket.id}`);
        player.id = socket.id;
        socket.join(roomCode);
        socket.emit('joined-game', { gameState, playerId: socket.id });
        console.log(`Player ${player.name} rejoined game ${roomCode}`);
      } else {
        console.log(`Player not found: "${playerName}" in room ${roomCode}`);
        console.log(`Available players:`, gameState.players.map(p => `"${p.name}"`));
        socket.emit('error', { message: 'Player not found in game' });
      }
    });

    // Start the game
    socket.on('start-game', ({ roomCode }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState || gameState.host !== socket.id) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      gameState.started = true;
      io.to(roomCode).emit('game-started', { gameState });
      
      console.log(`Game started: ${roomCode}`);
    });

    // Send money transaction
    socket.on('transaction', ({ roomCode, fromId, toId, amount }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Find sender and receiver
      let sender = gameState.players.find(p => p.id === fromId);
      if (!sender && fromId === 'bank') {
        sender = gameState.bank;
      }

      let receiver = gameState.players.find(p => p.id === toId);
      if (!receiver && toId === 'bank') {
        receiver = gameState.bank;
      }

      if (!sender || !receiver) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }

      // Check balance
      if (!sender.isBank && sender.balance < amount) {
        socket.emit('error', { message: 'Insufficient balance' });
        return;
      }

      // Process transaction
      sender.balance -= amount;
      receiver.balance += amount;

      const transaction = {
        from: fromId,
        to: toId,
        fromName: sender.name,
        toName: receiver.name,
        amount,
        timestamp: Date.now(),
      };

      gameState.transactions.push(transaction);

      // Broadcast updated game state
      io.to(roomCode).emit('game-updated', { gameState });
      io.to(roomCode).emit('transaction-complete', { transaction });
      
      console.log(`Transaction in ${roomCode}: ${sender.name} → ${receiver.name} $${amount}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Find and update games where this player was present
      gameRooms.forEach((gameState, roomCode) => {
        const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex !== -1) {
          const player = gameState.players[playerIndex];
          gameState.players.splice(playerIndex, 1);
          
          io.to(roomCode).emit('player-left', { 
            playerId: socket.id, 
            playerName: player.name,
            gameState 
          });
          
          console.log(`${player.name} left game ${roomCode}`);
        }
        
        // If host disconnects, close the game
        if (gameState.host === socket.id) {
          io.to(roomCode).emit('game-closed', { message: 'Host disconnected' });
          gameRooms.delete(roomCode);
          console.log(`Game ${roomCode} closed - host disconnected`);
        }
      });
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
