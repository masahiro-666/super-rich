export interface Player {
  id: string;
  name: string;
  balance: number;
  isBank?: boolean;
  color?: string;
  deedCards?: DeedCard[];
  position?: number;  // Current position on board (0-39)
  inJail?: boolean;
  jailTurns?: number; // Turns left in jail
  hasGetOutOfJailCard?: boolean;
  chanceCards?: ChanceCard[]; // Chance cards player owns
  turnOrderRoll?: number; // Initial dice roll for turn order
  turnOrder?: number; // Final turn order (1, 2, 3, etc.)
}

export interface DeedCard {
  id: number;
  name: string;
  price: number;
  rent?: number;
  rentWithHouse1?: number;
  rentWithHouse2?: number;
  rentWithHouse3?: number;
  rentWithHouse4?: number;
  rentWithHotel?: number;
  housePrice?: number;
  owner?: string | null; // Player ID who owns this property
  houses?: number; // 0-4 houses
  hasHotel?: boolean;
  color?: string; // Color group for monopoly sets
}

export interface DeedRequest {
  id: string;
  type: "buy" | "sell";
  playerId: string;
  playerName: string;
  deedCard: DeedCard;
  timestamp: number;
}

export interface Transaction {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  amount: number;
  timestamp: number;
}

export interface DeedTransaction {
  type: "buy" | "sell" | "give";
  playerId: string;
  playerName: string;
  deedCard: DeedCard;
  price: number;
  timestamp: number;
}

export interface BoardSpace {
  id: number;
  name: string;
  type: "start" | "city" | "chance" | "tax" | "jail" | "free" | "gotoJail" | "utility" | "station";
  price?: number;
  rent?: number;
  color?: string; // For property sets
  property?: DeedCard; // Full property details if type is "city"
}

export interface ChanceCard {
  id: number;
  text: string;
  type: "money" | "move" | "jail" | "repair";
  amount?: number;
  position?: number;
  isGetOutOfJail?: boolean;
}

export interface GameState {
  roomCode: string;
  host: string;
  hostName: string;
  playerCount: number;
  players: Player[];
  bank: Player;
  transactions: Transaction[];
  deedTransactions?: DeedTransaction[];
  started: boolean;
  settings: {
    startingMoney: number;
    deedCardsPerPlayer: number;
  };
  availableDeeds?: DeedCard[];
  deedRequests?: DeedRequest[];
  currentPlayerIndex?: number; // Who's turn is it
  board?: BoardSpace[]; // The 40 spaces on the board
  diceRoll?: number[]; // Last dice roll [die1, die2]
  chanceCards?: ChanceCard[];
  properties?: DeedCard[]; // All properties in the game
  waitingForTurnOrder?: boolean; // Are we waiting for players to roll for turn order
  playersRolledForOrder?: string[]; // Players who have rolled for turn order
}

export const INITIAL_MONEY = 15000;

export const MONEY_BREAKDOWN = {
  5000: 2,
  1000: 4,
  500: 1,
  100: 4,
  50: 1,
  10: 5,
};

export const DEED_CARDS: DeedCard[] = [
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
