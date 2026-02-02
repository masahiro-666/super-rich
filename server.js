import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Thai Monopoly Board Configuration
const THAI_BOARD = [
  { id: 0, name: "เริ่มต้น (Start)", type: "start" },
  { id: 1, name: "กรุงเทพฯ", type: "city", color: "#8B4513", property: { id: 1, name: "กรุงเทพฯ", price: 600, rent: 20, rentWithHouse1: 100, rentWithHouse2: 300, rentWithHouse3: 900, rentWithHouse4: 1600, rentWithHotel: 2500, housePrice: 500, hotelPrice: 500, color: "#8B4513" } },
  { id: 2, name: "โอกาส (Chance)", type: "chance" },
  { id: 3, name: "ตลาดโบ๊เบ๊", type: "city", color: "#8B4513", property: { id: 3, name: "ตลาดโบ๊เบ๊", price: 600, rent: 40, rentWithHouse1: 200, rentWithHouse2: 600, rentWithHouse3: 1800, rentWithHouse4: 3200, rentWithHotel: 4500, housePrice: 500, hotelPrice: 500, color: "#8B4513" } },
  { id: 4, name: "ภาษีเงินได้ 200", type: "tax", price: 200 },
  { id: 5, name: "สถานีรถไฟหัวลำโพง", type: "station", price: 2000, rent: 250 },
  { id: 6, name: "เยาวราช", type: "city", color: "#87CEEB", property: { id: 6, name: "เยาวราช", price: 1000, rent: 60, rentWithHouse1: 300, rentWithHouse2: 900, rentWithHouse3: 2700, rentWithHouse4: 4000, rentWithHotel: 5500, housePrice: 500, hotelPrice: 500, color: "#87CEEB" } },
  { id: 7, name: "โอกาส (Chance)", type: "chance" },
  { id: 8, name: "ทุ่งครุ", type: "city", color: "#87CEEB", property: { id: 8, name: "ทุ่งครุ", price: 1000, rent: 60, rentWithHouse1: 300, rentWithHouse2: 900, rentWithHouse3: 2700, rentWithHouse4: 4000, rentWithHotel: 5500, housePrice: 500, hotelPrice: 500, color: "#87CEEB" } },
  { id: 9, name: "สามย่าน", type: "city", color: "#87CEEB", property: { id: 9, name: "สามย่าน", price: 1200, rent: 80, rentWithHouse1: 400, rentWithHouse2: 1000, rentWithHouse3: 3000, rentWithHouse4: 4500, rentWithHotel: 6000, housePrice: 500, hotelPrice: 500, color: "#87CEEB" } },
  { id: 10, name: "เยี่ยมเยียนคุก", type: "jail" },
  { id: 11, name: "ราชดำเนิน", type: "city", color: "#FF69B4", property: { id: 11, name: "ราชดำเนิน", price: 1400, rent: 100, rentWithHouse1: 500, rentWithHouse2: 1500, rentWithHouse3: 4500, rentWithHouse4: 6250, rentWithHotel: 7500, housePrice: 1000, hotelPrice: 1000, color: "#FF69B4" } },
  { id: 12, name: "การไฟฟ้า", type: "utility", price: 1500 },
  { id: 13, name: "บางลำพู", type: "city", color: "#FF69B4", property: { id: 13, name: "บางลำพู", price: 1400, rent: 100, rentWithHouse1: 500, rentWithHouse2: 1500, rentWithHouse3: 4500, rentWithHouse4: 6250, rentWithHotel: 7500, housePrice: 1000, hotelPrice: 1000, color: "#FF69B4" } },
  { id: 14, name: "หัวลำโพง", type: "city", color: "#FF69B4", property: { id: 14, name: "หัวลำโพง", price: 1600, rent: 120, rentWithHouse1: 600, rentWithHouse2: 1800, rentWithHouse3: 5000, rentWithHouse4: 7000, rentWithHotel: 9000, housePrice: 1000, hotelPrice: 1000, color: "#FF69B4" } },
  { id: 15, name: "สถานีรถไฟดอนเมือง", type: "station", price: 2000, rent: 250 },
  { id: 16, name: "สุขุมวิท", type: "city", color: "#FFA500", property: { id: 16, name: "สุขุมวิท", price: 1800, rent: 140, rentWithHouse1: 700, rentWithHouse2: 2000, rentWithHouse3: 5500, rentWithHouse4: 7500, rentWithHotel: 9500, housePrice: 1000, hotelPrice: 1000, color: "#FFA500" } },
  { id: 17, name: "โอกาส (Chance)", type: "chance" },
  { id: 18, name: "วิภาวดี", type: "city", color: "#FFA500", property: { id: 18, name: "วิภาวดี", price: 1800, rent: 140, rentWithHouse1: 700, rentWithHouse2: 2000, rentWithHouse3: 5500, rentWithHouse4: 7500, rentWithHotel: 9500, housePrice: 1000, hotelPrice: 1000, color: "#FFA500" } },
  { id: 19, name: "ลาดพร้าว", type: "city", color: "#FFA500", property: { id: 19, name: "ลาดพร้าว", price: 2000, rent: 160, rentWithHouse1: 800, rentWithHouse2: 2200, rentWithHouse3: 6000, rentWithHouse4: 8000, rentWithHotel: 10000, housePrice: 1000, hotelPrice: 1000, color: "#FFA500" } },
  { id: 20, name: "จอดฟรี", type: "free" },
  { id: 21, name: "พระราม 4", type: "city", color: "#FF0000", property: { id: 21, name: "พระราม 4", price: 2200, rent: 180, rentWithHouse1: 900, rentWithHouse2: 2500, rentWithHouse3: 7000, rentWithHouse4: 8750, rentWithHotel: 10500, housePrice: 1500, hotelPrice: 1500, color: "#FF0000" } },
  { id: 22, name: "โอกาส (Chance)", type: "chance" },
  { id: 23, name: "ศรีนครินทร์", type: "city", color: "#FF0000", property: { id: 23, name: "ศรีนครินทร์", price: 2200, rent: 180, rentWithHouse1: 900, rentWithHouse2: 2500, rentWithHouse3: 7000, rentWithHouse4: 8750, rentWithHotel: 10500, housePrice: 1500, hotelPrice: 1500, color: "#FF0000" } },
  { id: 24, name: "การประปา", type: "utility", price: 1500 },
  { id: 25, name: "ถนนพระราม 3", type: "city", color: "#FF0000", property: { id: 25, name: "ถนนพระราม 3", price: 2400, rent: 200, rentWithHouse1: 1000, rentWithHouse2: 3000, rentWithHouse3: 7500, rentWithHouse4: 9250, rentWithHotel: 11000, housePrice: 1500, hotelPrice: 1500, color: "#FF0000" } },
  { id: 26, name: "สถานีรถไฟหาดใหญ่", type: "station", price: 2000, rent: 250 },
  { id: 27, name: "แม่ฮ่องสอน", type: "city", color: "#FFFF00", property: { id: 27, name: "แม่ฮ่องสอน", price: 2600, rent: 220, rentWithHouse1: 1100, rentWithHouse2: 3300, rentWithHouse3: 8000, rentWithHouse4: 9750, rentWithHotel: 11500, housePrice: 1500, hotelPrice: 1500, color: "#FFFF00" } },
  { id: 28, name: "อุบลราชธานี", type: "city", color: "#FFFF00", property: { id: 28, name: "อุบลราชธานี", price: 2600, rent: 220, rentWithHouse1: 1100, rentWithHouse2: 3300, rentWithHouse3: 8000, rentWithHouse4: 9750, rentWithHotel: 11500, housePrice: 1500, hotelPrice: 1500, color: "#FFFF00" } },
  { id: 29, name: "การไฟฟ้า", type: "utility", price: 1500 },
  { id: 30, name: "ไปคุก", type: "gotoJail" },
  { id: 31, name: "ขอนแก่น", type: "city", color: "#00FF00", property: { id: 31, name: "ขอนแก่น", price: 2800, rent: 240, rentWithHouse1: 1200, rentWithHouse2: 3600, rentWithHouse3: 8500, rentWithHouse4: 10250, rentWithHotel: 12000, housePrice: 2000, hotelPrice: 2000, color: "#00FF00" } },
  { id: 32, name: "อุดรธานี", type: "city", color: "#00FF00", property: { id: 32, name: "อุดรธานี", price: 2800, rent: 240, rentWithHouse1: 1200, rentWithHouse2: 3600, rentWithHouse3: 8500, rentWithHouse4: 10250, rentWithHotel: 12000, housePrice: 2000, hotelPrice: 2000, color: "#00FF00" } },
  { id: 33, name: "โอกาส (Chance)", type: "chance" },
  { id: 34, name: "สุราษฎร์ธานี", type: "city", color: "#00FF00", property: { id: 34, name: "สุราษฎร์ธานี", price: 3000, rent: 260, rentWithHouse1: 1300, rentWithHouse2: 3900, rentWithHouse3: 9000, rentWithHouse4: 11000, rentWithHotel: 13000, housePrice: 2000, hotelPrice: 2000, color: "#00FF00" } },
  { id: 35, name: "สถานีรถไฟเชียงใหม่", type: "station", price: 2000, rent: 250 },
  { id: 36, name: "โอกาส (Chance)", type: "chance" },
  { id: 37, name: "เชียงใหม่", type: "city", color: "#0000FF", property: { id: 37, name: "เชียงใหม่", price: 3500, rent: 350, rentWithHouse1: 1750, rentWithHouse2: 5000, rentWithHouse3: 11000, rentWithHouse4: 13000, rentWithHotel: 15000, housePrice: 2000, hotelPrice: 2000, color: "#0000FF" } },
  { id: 38, name: "ภาษีหรู 100", type: "tax", price: 100 },
  { id: 39, name: "ภูเก็ต", type: "city", color: "#0000FF", property: { id: 39, name: "ภูเก็ต", price: 4000, rent: 500, rentWithHouse1: 2000, rentWithHouse2: 6000, rentWithHouse3: 14000, rentWithHouse4: 17000, rentWithHotel: 20000, housePrice: 2000, hotelPrice: 2000, color: "#0000FF" } },
];

const CHANCE_CARDS = [
  { id: 1, text: "ถูกหวย! ได้เงิน 2000 บาท", type: "money", amount: 2000 },
  { id: 2, text: "จ่ายค่าปรับความเร็ว 500 บาท", type: "money", amount: -500 },
  { id: 3, text: "เดินไปช่อง START และรับเงิน 2000 บาท", type: "move", position: 0 },
  { id: 4, text: "ไปคุกโดยตรง!", type: "jail" },
  { id: 5, text: "ออกจากคุกฟรี 1 ครั้ง", type: "jail", isGetOutOfJail: true },
  { id: 6, text: "ย้อนกลับ 3 ช่อง", type: "move", amount: -3 },
  { id: 7, text: "ได้เงินจากธนาคาร 1500 บาท", type: "money", amount: 1500 },
  { id: 8, text: "จ่ายค่าซ่อมบ้าน: บ้านละ 250 บาท, โรงแรมละ 1000 บาท", type: "repair" },
  { id: 9, text: "วันเกิด! ทุกคนให้เงินคุณคนละ 100 บาท", type: "money", amount: 0 },
  { id: 10, text: "ไปเชียงใหม่", type: "move", position: 18 },
  { id: 11, text: "ไปภูเก็ต", type: "move", position: 13 },
  { id: 12, text: "รับเงินปันผล 500 บาท", type: "money", amount: 500 },
  { id: 13, text: "เดินหน้า 5 ช่อง", type: "move", amount: 5 },
  { id: 14, text: "จ่ายภาษีที่ดิน 1000 บาท", type: "money", amount: -1000 },
  { id: 15, text: "ไปสถานีรถไฟที่ใกล้ที่สุด", type: "move", position: -1 },
];


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
      
      // Initialize all properties from board
      const properties = THAI_BOARD
        .filter(space => space.property)
        .map(space => ({
          ...space.property,
          owner: null,
          houses: 0,
          hasHotel: false,
        }));
      
      const gameState = {
        roomCode,
        host: socket.id,
        hostName,
        playerCount: 6,
        players: [],
        bank: { id: 'bank', name: 'Bank', balance: 1000000, isBank: true },
        transactions: [],
        deedTransactions: [],
        started: false,
        settings: {
          startingMoney: settings?.startingMoney || 15000,
          deedCardsPerPlayer: settings?.deedCardsPerPlayer || 0,
        },
        availableDeeds: [],
        deedRequests: [],
        currentPlayerIndex: 0,
        board: THAI_BOARD.map(space => ({ ...space })),
        diceRoll: [0, 0],
        chanceCards: [...CHANCE_CARDS],
        properties: properties,
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
        chanceCards: [],
        position: 0,
        inJail: false,
        jailTurns: 0,
        hasGetOutOfJailCard: false,
        turnOrderRoll: 0,
        turnOrder: 0,
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

      console.log(`Current players in room:`, gameState.players.map(p => ({ name: p.name, id: p.id, disconnected: p.disconnected })));

      // Find player by name
      const player = gameState.players.find(p => p.name === playerName);
      
      if (player) {
        console.log(`Found player ${player.name}, updating socket ID from ${player.id} to ${socket.id}`);
        player.id = socket.id;
        player.disconnected = false;
        delete player.disconnectedAt;
        socket.join(roomCode);
        socket.emit('joined-game', { gameState, playerId: socket.id });
        io.to(roomCode).emit('player-reconnected', { playerId: socket.id, playerName: player.name, gameState });
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

      // Give each player 1 random property at game start
      const availableProperties = [...gameState.properties].filter(p => !p.owner);
      gameState.players.forEach((player) => {
        if (availableProperties.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableProperties.length);
          const property = availableProperties.splice(randomIndex, 1)[0];
          property.owner = player.id;
          console.log(`${player.name} received starting property: ${property.name}`);
        }
      });

      gameState.started = true;
      gameState.waitingForTurnOrder = true;
      gameState.playersRolledForOrder = [];
      
      io.to(roomCode).emit('game-started', { gameState });
      io.to(roomCode).emit('start-turn-order-roll', { gameState });
      
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

    // ============= MONOPOLY GAME LOGIC =============
    
    // Roll for turn order (initial roll to determine who goes first)
    socket.on('roll-for-turn-order', ({ roomCode }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState || !gameState.waitingForTurnOrder) {
        socket.emit('error', { message: 'Not waiting for turn order' });
        return;
      }

      const player = gameState.players.find(p => p.id === socket.id);
      if (!player) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }

      // Check if player already rolled
      if (gameState.playersRolledForOrder.includes(player.id)) {
        socket.emit('error', { message: 'You already rolled' });
        return;
      }

      // Roll two dice
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const total = die1 + die2;

      player.turnOrderRoll = total;
      gameState.playersRolledForOrder.push(player.id);

      console.log(`${player.name} rolled ${die1}+${die2}=${total} for turn order`);

      // Broadcast the roll
      io.to(roomCode).emit('turn-order-rolled', {
        gameState,
        playerId: player.id,
        playerName: player.name,
        dice: [die1, die2],
        total,
      });

      // Check if all players have rolled
      if (gameState.playersRolledForOrder.length === gameState.players.length) {
        // Sort players by their roll (highest first)
        gameState.players.sort((a, b) => (b.turnOrderRoll || 0) - (a.turnOrderRoll || 0));
        
        // Assign turn order (starting from position to the right of highest roller)
        gameState.players.forEach((p, index) => {
          p.turnOrder = index + 1;
        });

        // Set current player index to 0 (highest roller goes first)
        gameState.currentPlayerIndex = 0;
        gameState.waitingForTurnOrder = false;

        console.log('Turn order determined:', gameState.players.map(p => `${p.name}: ${p.turnOrderRoll} (Order: ${p.turnOrder})`));

        io.to(roomCode).emit('turn-order-complete', { gameState });
      }
    });
    
    // Roll dice and move player
    socket.on('roll-dice', ({ roomCode }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState || !gameState.started) {
        socket.emit('error', { message: 'Game not started' });
        return;
      }

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.id !== socket.id) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      // Check if in jail
      if (currentPlayer.inJail) {
        socket.emit('error', { message: 'You are in jail. Pay 500 or use get out of jail card' });
        return;
      }

      // Roll dice
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const total = die1 + die2;
      const isDoubles = die1 === die2;

      gameState.diceRoll = [die1, die2];

      // Move player
      const oldPosition = currentPlayer.position;
      let newPosition = (oldPosition + total) % 40;
      currentPlayer.position = newPosition;

      // Check if passed START
      if (newPosition < oldPosition) {
        currentPlayer.balance += 2000;
        gameState.transactions.push({
          from: 'bank',
          to: currentPlayer.id,
          fromName: 'Bank',
          toName: currentPlayer.name,
          amount: 2000,
          timestamp: Date.now(),
        });
      }

      const landedSpace = gameState.board[newPosition];
      
      console.log(`${currentPlayer.name} rolled ${die1}+${die2}=${total}, moved from ${oldPosition} to ${newPosition} (${landedSpace.name})`);

      // Handle space effects
      let spaceEffect = null;
      
      if (landedSpace.type === 'gotoJail') {
        currentPlayer.inJail = true;
        currentPlayer.jailTurns = 3;
        currentPlayer.position = 10; // Jail position
        spaceEffect = { type: 'jail', message: 'ไปคุก! ติดคุก 3 เทิร์น' };
      } else if (landedSpace.type === 'chance') {
        // Draw chance card
        const card = gameState.chanceCards[Math.floor(Math.random() * gameState.chanceCards.length)];
        spaceEffect = { type: 'chance', card };
        
        // Apply chance card effect (will be handled by client confirmation)
      } else if (landedSpace.type === 'tax') {
        const taxAmount = landedSpace.price || 1000;
        currentPlayer.balance -= taxAmount;
        gameState.bank.balance += taxAmount;
        gameState.transactions.push({
          from: currentPlayer.id,
          to: 'bank',
          fromName: currentPlayer.name,
          toName: 'Bank',
          amount: taxAmount,
          timestamp: Date.now(),
        });
        spaceEffect = { type: 'tax', amount: taxAmount };
      } else if (landedSpace.type === 'city') {
        // Property space
        const property = gameState.properties.find(p => p.id === landedSpace.property.id);
        if (property) {
          if (!property.owner) {
            // Available to purchase
            spaceEffect = { type: 'property', property, canBuy: true };
          } else if (property.owner !== currentPlayer.id) {
            // Pay rent
            const owner = gameState.players.find(p => p.id === property.owner);
            if (owner) {
              let rent = property.rent;
              if (property.hasHotel) {
                rent = property.rentWithHotel;
              } else if (property.houses > 0) {
                rent = property[`rentWithHouse${property.houses}`] || rent;
              }
              
              currentPlayer.balance -= rent;
              owner.balance += rent;
              
              gameState.transactions.push({
                from: currentPlayer.id,
                to: owner.id,
                fromName: currentPlayer.name,
                toName: owner.name,
                amount: rent,
                timestamp: Date.now(),
              });
              
              spaceEffect = { type: 'rent', property, rent, ownerName: owner.name };
            }
          }
        }
      } else if (landedSpace.type === 'station') {
        // Station space - simplified rent
        spaceEffect = { type: 'station', station: landedSpace };
      } else if (landedSpace.type === 'utility') {
        // Utility space
        spaceEffect = { type: 'utility', utility: landedSpace };
      } else if (landedSpace.type === 'start') {
        // Landed on START
        spaceEffect = { type: 'start' };
      } else if (landedSpace.type === 'free') {
        spaceEffect = { type: 'free' };
      } else if (landedSpace.type === 'jail') {
        spaceEffect = { type: 'visiting' };
      }

      // If not doubles, move to next player
      if (!isDoubles) {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      }

      io.to(roomCode).emit('dice-rolled', {
        gameState,
        playerId: currentPlayer.id,
        dice: [die1, die2],
        newPosition,
        spaceEffect,
        isDoubles,
      });
    });

    // Buy property
    socket.on('buy-property', ({ roomCode, propertyId }) => {
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

      const property = gameState.properties.find(p => p.id === propertyId);
      if (!property) {
        socket.emit('error', { message: 'Property not found' });
        return;
      }

      if (property.owner) {
        socket.emit('error', { message: 'Property already owned' });
        return;
      }

      if (player.balance < property.price) {
        socket.emit('error', { message: 'Insufficient funds' });
        return;
      }

      // Purchase property
      player.balance -= property.price;
      gameState.bank.balance += property.price;
      property.owner = player.id;

      gameState.transactions.push({
        from: player.id,
        to: 'bank',
        fromName: player.name,
        toName: 'Bank',
        amount: property.price,
        timestamp: Date.now(),
      });

      io.to(roomCode).emit('property-bought', { gameState, playerId: player.id, property });
      console.log(`${player.name} bought ${property.name} for ${property.price}`);
    });

    // Build house
    socket.on('build-house', ({ roomCode, propertyId }) => {
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

      const property = gameState.properties.find(p => p.id === propertyId);
      if (!property || property.owner !== player.id) {
        socket.emit('error', { message: 'You do not own this property' });
        return;
      }

      if (property.hasHotel) {
        socket.emit('error', { message: 'Already has hotel' });
        return;
      }

      if (property.houses >= 4) {
        socket.emit('error', { message: 'Max houses reached. Build hotel instead' });
        return;
      }

      if (player.balance < property.housePrice) {
        socket.emit('error', { message: 'Insufficient funds' });
        return;
      }

      // Build house
      player.balance -= property.housePrice;
      gameState.bank.balance += property.housePrice;
      property.houses += 1;

      io.to(roomCode).emit('house-built', { gameState, playerId: player.id, property });
      console.log(`${player.name} built house on ${property.name}`);
    });

    // Build hotel
    socket.on('build-hotel', ({ roomCode, propertyId }) => {
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

      const property = gameState.properties.find(p => p.id === propertyId);
      if (!property || property.owner !== player.id) {
        socket.emit('error', { message: 'You do not own this property' });
        return;
      }

      if (property.hasHotel) {
        socket.emit('error', { message: 'Already has hotel' });
        return;
      }

      if (property.houses < 4) {
        socket.emit('error', { message: 'Need 4 houses before building hotel' });
        return;
      }

      if (player.balance < property.housePrice) {
        socket.emit('error', { message: 'Insufficient funds' });
        return;
      }

      // Build hotel
      player.balance -= property.housePrice;
      gameState.bank.balance += property.housePrice;
      property.houses = 0;
      property.hasHotel = true;

      io.to(roomCode).emit('hotel-built', { gameState, playerId: player.id, property });
      console.log(`${player.name} built hotel on ${property.name}`);
    });

    // Pay to get out of jail
    socket.on('pay-jail', ({ roomCode }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const player = gameState.players.find(p => p.id === socket.id);
      if (!player || !player.inJail) {
        socket.emit('error', { message: 'Not in jail' });
        return;
      }

      if (player.balance < 500) {
        socket.emit('error', { message: 'Insufficient funds' });
        return;
      }

      player.balance -= 500;
      gameState.bank.balance += 500;
      player.inJail = false;
      player.jailTurns = 0;

      gameState.transactions.push({
        from: player.id,
        to: 'bank',
        fromName: player.name,
        toName: 'Bank',
        amount: 500,
        timestamp: Date.now(),
      });

      io.to(roomCode).emit('jail-paid', { gameState, playerId: player.id });
      console.log(`${player.name} paid to get out of jail`);
    });

    // Use get out of jail card
    socket.on('use-jail-card', ({ roomCode }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const player = gameState.players.find(p => p.id === socket.id);
      if (!player || !player.inJail || !player.hasGetOutOfJailCard) {
        socket.emit('error', { message: 'Cannot use card' });
        return;
      }

      player.inJail = false;
      player.jailTurns = 0;
      player.hasGetOutOfJailCard = false;

      io.to(roomCode).emit('jail-card-used', { gameState, playerId: player.id });
      console.log(`${player.name} used get out of jail card`);
    });

    // End turn manually
    socket.on('end-turn', ({ roomCode }) => {
      const gameState = gameRooms.get(roomCode);
      
      if (!gameState || !gameState.started) {
        socket.emit('error', { message: 'Game not started' });
        return;
      }

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.id !== socket.id) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      // Move to next player
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

      io.to(roomCode).emit('turn-ended', { gameState });
      console.log(`${currentPlayer.name} ended their turn`);
    });

    // ============= END MONOPOLY GAME LOGIC =============

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Find and update games where this player was present
      gameRooms.forEach((gameState, roomCode) => {
        const player = gameState.players.find(p => p.id === socket.id);
        
        if (player) {
          // Mark player as disconnected but keep their data for rejoining
          player.disconnected = true;
          player.disconnectedAt = Date.now();
          
          io.to(roomCode).emit('player-disconnected', { 
            playerId: socket.id, 
            playerName: player.name,
            gameState 
          });
          
          console.log(`${player.name} disconnected from game ${roomCode} (data preserved for rejoin)`);
        }
        
        // If host disconnects during game, keep game open for rejoin
        // Only delete game if host disconnects before game starts
        if (gameState.host === socket.id && !gameState.started) {
          io.to(roomCode).emit('game-closed', { message: 'Host disconnected before game started' });
          gameRooms.delete(roomCode);
          console.log(`Game ${roomCode} closed - host disconnected before start`);
        } else if (gameState.host === socket.id && gameState.started) {
          console.log(`Host disconnected from ${roomCode} but game continues (can rejoin)`);
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
