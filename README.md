# Super Rich - Monopoly Money App 💰

A real-time multiplayer Monopoly Money management application with Thai property deed cards, built with Next.js, React, Socket.IO, and TypeScript.

## Features

- 🏦 **Bank Host Control** - Manage game, send/receive money, approve deed transactions
- 👥 **Multiplayer Support** - 2-6 players with real-time synchronization
- 📜 **29 Thai Property Deed Cards** - Buy, sell, and trade deed cards
- 💸 **Transaction System** - Smart money transfers with confirmation modals
- 📱 **QR Code Join** - Easy room joining via QR code scanning
- 🎨 **Player Colors** - Auto-assigned colors for each player
- 📊 **Transaction History** - Track all money and deed transactions
- ⚙️ **Configurable Settings** - Custom starting money and deed distribution

## Quick Start

### Option 1: Docker (Recommended for Deployment) 🐳

```bash
# Start the application
docker-compose up -d

# Or use the helper script
./docker.sh
```

Access at: `http://localhost:3000`

**See [DOCKER.md](./DOCKER.md) for complete Docker deployment guide**

### Option 2: Development Mode

1. **Install dependencies:**

```bash
npm install
```

2. **Run the development server:**

```bash
npm run dev
```

3. **Open your browser:**

```
http://localhost:3000
```

## How to Play

1. **Host Creates Game:**
   - Click "Host New Game"
   - Configure starting money and deed cards per player
   - Share room code or QR code with players

2. **Players Join:**
   - Click "Join Game"
   - Enter room code (or scan QR code)
   - Enter your name

3. **Start Game:**
   - Host assigns colors to players (or auto-assign)
   - Click "Start Game"
   - Players receive starting money and random deed cards

4. **During Game:**
   - Players can send money to each other or bank
   - Players can request to buy/sell deed cards (requires bank approval)
   - Bank can directly give deed cards to players
   - All transactions are tracked and displayed

## Technology Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Real-time:** Socket.IO 4.8
- **QR Codes:** qrcode library
- **Deployment:** Docker, Docker Compose

## Project Structure

```
super-rich/
├── src/
│   ├── app/
│   │   ├── lobby/          # Lobby page (create/join)
│   │   ├── host/           # Bank host control panel
│   │   └── player/         # Player interface
│   └── types/
│       └── game.ts         # TypeScript types & deed cards data
├── server.js               # Socket.IO server
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose configuration
└── docker.sh               # Docker helper script

```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Docker Deployment

### Quick Commands

```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Using Helper Script

```bash
# Make script executable (first time only)
chmod +x docker.sh

# Run the interactive menu
./docker.sh
```

The script provides options to:

- 🚀 Start the application
- 🛑 Stop the application
- 🔄 Rebuild and restart
- 📊 View logs
- 🧹 Clean up containers/images
- ℹ️ Show container status

## Environment Variables

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

## Game Settings

- **Starting Money:** 100 - 1,000,000 (default: 15,000)
- **Deed Cards Per Player:** 0 - 10 (default: 2)
- **Max Players:** 6
- **Min Players:** 2

## Deed Cards

29 Thai property deed cards included, ranging from ฿600 to ฿4,000:

- Popular Bangkok locations (Siam, Asok, Thonglor, etc.)
- Tourist destinations (Phuket, Pattaya, Chiang Mai)
- Cultural sites (Grand Palace, Ayutthaya, Floating Market)

## License

This project is private and for educational purposes.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
