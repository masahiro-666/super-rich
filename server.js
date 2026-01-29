import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
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
    socket.on('create-game', ({ hostName, settings }) => {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const gameState = {
        roomCode,
        host: socket.id,
        hostName,
        playerCount: 6, // Max 6 players
        players: [],
        bank: { id: 'bank', name: 'Bank', balance: 1000000, isBank: true },
        transactions: [],
        deedTransactions: [],
        started: false,
        settings: {
          startingMoney: settings?.startingMoney || 15000,
          deedCardsPerPlayer: settings?.deedCardsPerPlayer || 2,
        },
        availableDeeds: [],
        deedRequests: [],
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
        balance: gameState.settings.startingMoney,
        isBank: false,
        color: null,
        deedCards: [],
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

      // Assign random colors to players who don't have one
      const availableColors = ["#EC4899", "#FFFFFF", "#000000", "#EF4444", "#10B981", "#3B82F6"];
      const usedColors = gameState.players
        .filter(p => p.color)
        .map(p => p.color);
      
      console.log('Players before color assignment:', gameState.players.map(p => ({ name: p.name, color: p.color })));
      console.log('Used colors:', usedColors);
      
      const unassignedPlayers = gameState.players.filter(p => !p.color);
      console.log('Unassigned players:', unassignedPlayers.map(p => p.name));
      
      const remainingColors = availableColors.filter(c => !usedColors.includes(c));
      console.log('Remaining colors:', remainingColors);
      
      unassignedPlayers.forEach((player, index) => {
        if (remainingColors.length > 0) {
          // Pick a random color from remaining colors
          const randomIndex = Math.floor(Math.random() * remainingColors.length);
          player.color = remainingColors[randomIndex];
          console.log(`Assigned ${remainingColors[randomIndex]} to ${player.name}`);
          // Remove the assigned color from remaining colors
          remainingColors.splice(randomIndex, 1);
        }
      });
      
      console.log('Players after color assignment:', gameState.players.map(p => ({ name: p.name, color: p.color })));

      // Distribute random deed cards to players
      const deedCards = [
        { id: 1, name: "กรุงเทพ", price: 600 },
        { id: 2, name: "นครปฐม", price: 600 },
        { id: 3, name: "โรงแรมเซ็นทรัล", price: 2000 },
        { id: 4, name: "โรงแรมการ์เด็น", price: 2000 },
        { id: 5, name: "ตลาดโบ้เบ้", price: 1000 },
        { id: 6, name: "เยาวราช", price: 1000 },
        { id: 7, name: "จันทบุรี", price: 1200 },
        { id: 8, name: "กาญจนบุรี", price: 1400 },
        { id: 9, name: "การไฟฟ้า", price: 1500 },
        { id: 10, name: "ระยอง", price: 1400 },
        { id: 11, name: "สุโขทัย", price: 1600 },
        { id: 12, name: "โรงแรมเอมเมอรัล", price: 2000 },
        { id: 13, name: "ภูเก็ต", price: 1800 },
        { id: 14, name: "สุราษฎร์ธานี", price: 1800 },
        { id: 15, name: "สงขลา", price: 2000 },
        { id: 16, name: "เพชรบุรี", price: 2200 },
        { id: 17, name: "เชียงใหม่", price: 2200 },
        { id: 18, name: "เชียงราย", price: 2400 },
        { id: 19, name: "แกรนด์จอมเทียน", price: 2000 },
        { id: 20, name: "แม่ฮ่องสอน", price: 2600 },
        { id: 21, name: "ลำปาง", price: 2600 },
        { id: 22, name: "การประปา", price: 1500 },
        { id: 23, name: "โคราช", price: 2800 },
        { id: 24, name: "ดรีมเวิลด์", price: 3000 },
        { id: 25, name: "สุรินทร์", price: 3000 },
        { id: 26, name: "อุบลราชธานี", price: 3200 },
        { id: 27, name: "โรงแรมโนโวเทล", price: 2000 },
        { id: 28, name: "ดอนเมือง", price: 3500 },
        { id: 29, name: "เสาชิงช้า", price: 4000 },
      ];
      
      // Shuffle deed cards
      const shuffledDeedCards = [...deedCards].sort(() => Math.random() - 0.5);
      
      // Distribute cards to players based on settings
      const cardsPerPlayer = gameState.settings.deedCardsPerPlayer || 0;
      let cardIndex = 0;
      
      console.log(`Distributing ${cardsPerPlayer} cards to each of ${gameState.players.length} players from ${shuffledDeedCards.length} total deeds`);
      
      gameState.players.forEach((player) => {
        player.deedCards = [];
        for (let i = 0; i < cardsPerPlayer && cardIndex < shuffledDeedCards.length; i++) {
          player.deedCards.push(shuffledDeedCards[cardIndex]);
          cardIndex++;
        }
        console.log(`${player.name} received ${player.deedCards.length} deed cards:`, player.deedCards.map(d => d.name));
      });

      // Store remaining deeds as available
      gameState.availableDeeds = shuffledDeedCards.slice(cardIndex);
      console.log(`${gameState.availableDeeds.length} deed cards remain available`);

      gameState.started = true;
      io.to(roomCode).emit('game-started', { gameState });
      
      console.log(`Game started: ${roomCode}`);
    });

    // Update game settings
    socket.on('update-settings', ({ roomCode, settings }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState || gameState.host !== socket.id) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      if (gameState.started) {
        socket.emit('error', { message: 'Cannot change settings after game started' });
        return;
      }

      gameState.settings = settings;
      
      // Update all existing players' balance to match new starting money
      gameState.players.forEach(player => {
        player.balance = settings.startingMoney;
      });

      io.to(roomCode).emit('settings-updated', { gameState });
      console.log(`Settings updated for room ${roomCode}:`, settings);
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

    // Player requests to buy/sell deed
    socket.on('deed-request', ({ roomCode, type, deedCard }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const player = gameState.players.find(p => p.id === socket.id);
      if (!player) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }

      const request = {
        id: `${socket.id}-${Date.now()}`,
        type,
        playerId: socket.id,
        playerName: player.name,
        deedCard,
        timestamp: Date.now(),
      };

      gameState.deedRequests.push(request);
      io.to(roomCode).emit('deed-request-created', { gameState });
      
      console.log(`${player.name} wants to ${type} deed: ${deedCard.name}`);
    });

    // Bank confirms deed request (buy/sell)
    socket.on('confirm-deed-request', ({ roomCode, requestId, approved }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState || gameState.host !== socket.id) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      const requestIndex = gameState.deedRequests.findIndex(r => r.id === requestId);
      if (requestIndex === -1) {
        socket.emit('error', { message: 'Request not found' });
        return;
      }

      const request = gameState.deedRequests[requestIndex];
      const player = gameState.players.find(p => p.id === request.playerId);

      if (!player) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }

      if (approved) {
        if (request.type === 'buy') {
          // Player buys deed from bank
          if (player.balance >= request.deedCard.price) {
            player.balance -= request.deedCard.price;
            gameState.bank.balance += request.deedCard.price;
            
            if (!player.deedCards) player.deedCards = [];
            player.deedCards.push(request.deedCard);
            
            // Remove from available deeds
            gameState.availableDeeds = gameState.availableDeeds.filter(
              d => d.id !== request.deedCard.id
            );
            
            // Record deed transaction
            gameState.deedTransactions.push({
              type: 'buy',
              playerId: player.id,
              playerName: player.name,
              deedCard: request.deedCard,
              price: request.deedCard.price,
              timestamp: Date.now(),
            });
            
            console.log(`${player.name} bought ${request.deedCard.name} for $${request.deedCard.price}`);
          } else {
            socket.emit('error', { message: 'Player has insufficient funds' });
            gameState.deedRequests.splice(requestIndex, 1);
            io.to(roomCode).emit('game-updated', { gameState });
            return;
          }
        } else if (request.type === 'sell') {
          // Player sells deed to bank
          const deedIndex = player.deedCards?.findIndex(d => d.id === request.deedCard.id);
          if (deedIndex !== -1 && player.deedCards) {
            player.balance += request.deedCard.price;
            gameState.bank.balance -= request.deedCard.price;
            
            player.deedCards.splice(deedIndex, 1);
            
            // Add back to available deeds
            gameState.availableDeeds.push(request.deedCard);
            
            // Record deed transaction
            gameState.deedTransactions.push({
              type: 'sell',
              playerId: player.id,
              playerName: player.name,
              deedCard: request.deedCard,
              price: request.deedCard.price,
              timestamp: Date.now(),
            });
            
            console.log(`${player.name} sold ${request.deedCard.name} for $${request.deedCard.price}`);
          } else {
            socket.emit('error', { message: 'Player does not own this deed' });
            gameState.deedRequests.splice(requestIndex, 1);
            io.to(roomCode).emit('game-updated', { gameState });
            return;
          }
        }
      }

      // Remove request
      gameState.deedRequests.splice(requestIndex, 1);
      io.to(roomCode).emit('game-updated', { gameState });
    });

    // Bank gives deed to player
    socket.on('bank-give-deed', ({ roomCode, playerId, deedCard }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState || gameState.host !== socket.id) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      const player = gameState.players.find(p => p.id === playerId);
      if (!player) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }

      // Check if deed is available
      const deedIndex = gameState.availableDeeds.findIndex(d => d.id === deedCard.id);
      if (deedIndex === -1) {
        socket.emit('error', { message: 'Deed not available' });
        return;
      }

      // Transfer deed
      if (!player.deedCards) player.deedCards = [];
      player.deedCards.push(deedCard);
      gameState.availableDeeds.splice(deedIndex, 1);
      
      // Record deed transaction
      gameState.deedTransactions.push({
        type: 'give',
        playerId: player.id,
        playerName: player.name,
        deedCard: deedCard,
        price: 0,
        timestamp: Date.now(),
      });

      io.to(roomCode).emit('game-updated', { gameState });
      console.log(`Bank gave ${deedCard.name} to ${player.name}`);
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
