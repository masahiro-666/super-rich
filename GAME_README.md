# 🎲 Super Rich - Thai Monopoly Game

A real-time multiplayer Monopoly board game featuring Thai provinces, built with Next.js, Socket.IO, and TypeScript.

## 🎮 Game Features

### Core Monopoly Mechanics
- **40 Board Spaces** - Thai provinces and special spaces
- **Dice Rolling** - Roll two dice to move around the board
- **Property Ownership** - Buy Thai provinces and earn rent
- **Building System** - Build houses (1-4) and hotels on properties
- **Chance Cards** - Thai-themed chance cards with various effects
- **Jail System** - Get sent to jail, pay to get out
- **Turn-Based Gameplay** - Players take turns rolling and moving

### Board Spaces
- **Start (เริ่มต้น)** - Collect ฿2000 when passing
- **Cities (จังหวัด)** - 28 Thai provinces to buy and develop
- **Chance Cards (โอกาส)** - Random events
- **Tax Spaces (ภาษี)** - Pay taxes
- **Stations (สถานีรถไฟ)** - 4 railway stations
- **Utilities (การไฟฟ้า/การประปา)** - 2 utility companies
- **Jail (คุก)** - Go to jail space
- **Free Parking (จอดฟรี)** - Free space

### Property Colors & Groups
- 🟤 Brown: กรุงเทพ, นครปฐม
- 🔵 Light Blue: จันทบุรี, กาญจนบุรี, ระยอง
- 💗 Pink: สุโขทัย, ภูเก็ต, สุราษฎร์ธานี
- 🟠 Orange: เพชรบุรี, เชียงใหม่, เชียงราย
- 🔴 Red: แม่ฮ่องสอน, ลำปาง, นครราชสีมา
- 🟡 Yellow: สุรินทร์, อุบลราชธานี
- 🟢 Green: ขอนแก่น, อุดรธานี, ชลบุรี
- 🔵 Dark Blue: สงขลา, พัทยา

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed
- Port 4400 available

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:4400`

## 🎯 How to Play

### 1. Create a Game (Host)
- Click "Host New Game"
- Share the room code with players
- Or show QR code for easy joining
- Start the game when all players join

### 2. Join a Game (Players)
- Click "Join Game"
- Enter the room code
- Enter your name
- Wait for host to start

### 3. Gameplay
- **Roll Dice** - Click the dice button on your turn
- **Buy Properties** - When landing on unowned properties
- **Pay Rent** - Automatically charged when landing on owned properties
- **Build Houses** - Click on your properties to build
- **Upgrade to Hotel** - Build 4 houses first, then upgrade
- **Chance Cards** - Follow card instructions when drawn
- **End Turn** - Click "End Turn" when done

### Game Rules
- Starting money: ฿15,000
- Pass START: Collect ฿2,000
- Jail fine: ฿500
- Must own all properties in a color group to build
- Maximum 4 houses per property
- Hotel replaces 4 houses
- Land on "Go to Jail" → Go directly to jail
- Roll doubles → Roll again

## 🏗️ Project Structure

```
src/
├── app/
│   ├── lobby/          # Game lobby (create/join)
│   ├── host/           # Host waiting room
│   ├── player/         # Player waiting room
│   └── monopoly/       # Main game board
├── components/
│   ├── MonopolyBoard.tsx   # Board component
│   ├── Dice.tsx            # Dice roller
│   ├── PropertyModal.tsx   # Property info/actions
│   └── ChanceModal.tsx     # Chance card display
├── config/
│   └── board.ts        # Board configuration
└── types/
    └── game.ts         # TypeScript interfaces
```

## 🔧 Technical Details

### Technologies
- **Next.js 16** - React framework with Turbopack
- **Socket.IO** - Real-time multiplayer communication
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Styling

### Socket Events

**Client → Server:**
- `create-game` - Create new game room
- `join-game` - Join existing game
- `start-game` - Host starts the game
- `roll-dice` - Roll dice and move
- `buy-property` - Purchase property
- `build-house` - Build house on property
- `build-hotel` - Build hotel on property
- `pay-jail` - Pay to leave jail
- `end-turn` - End current turn

**Server → Client:**
- `game-created` - Game room created
- `joined-game` - Successfully joined
- `game-started` - Game has begun
- `dice-rolled` - Dice roll result
- `property-bought` - Property purchased
- `house-built` - House constructed
- `hotel-built` - Hotel constructed
- `game-updated` - General state update

## 🎨 Customization

### Change Starting Money
Edit in `src/app/lobby/page.tsx`:
```typescript
const [startingMoney, setStartingMoney] = useState(15000);
```

### Modify Board Spaces
Edit `src/config/board.ts` to change:
- Property prices
- Rent amounts
- House/hotel costs
- Chance card text

### Add More Players
Change max players in `server.js`:
```javascript
playerCount: 6, // Change this number
```

## 🐛 Troubleshooting

### Socket Connection Issues
- Check if port 4400 is available
- Ensure server is running with `npm run dev`
- Clear browser cache and localStorage

### Players Can't Join
- Verify room code is correct
- Check if game already started
- Ensure max players not reached

### Build Errors
- Run `npm install` again
- Delete `.next` folder and rebuild
- Check Node.js version (20+)

## 📝 Game Design Credits

Inspired by the classic Monopoly board game, adapted with:
- Thai province names and culture
- Thai language interface
- Thai baht currency (฿)
- Local landmarks and utilities

## 🚢 Deployment

### Docker
```bash
docker-compose up -d
```

### Production
```bash
npm run build
npm start
```

## 📄 License

This is a educational project for learning game development with real-time multiplayer features.

---

**Enjoy playing Super Rich - Thai Monopoly! 🎲🇹🇭**
