export interface Player {
  id: string;
  name: string;
  balance: number;
  isBank?: boolean;
  color?: string;
  deedCards?: DeedCard[];
}

export interface DeedCard {
  id: number;
  name: string;
  price: number;
  landRent?: number;
  rent1House?: number;
  rent2Houses?: number;
  rent3Houses?: number;
  rent4Houses?: number;
  rentHotel?: number;
  houseCost?: number;
  hotelCost?: number;
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
  { id: 1, name: "กรุงเทพฯ", price: 600, landRent: 20, rent1House: 100, rent2Houses: 300, rent3Houses: 900, rent4Houses: 1600, rentHotel: 2500, houseCost: 500, hotelCost: 2500 },
  { id: 2, name: "นครปฐม", price: 600, landRent: 40, rent1House: 200, rent2Houses: 600, rent3Houses: 1800, rent4Houses: 3200, rentHotel: 4500, houseCost: 500, hotelCost: 2500 },
  { id: 3, name: "เซ็นทรัล", price: 2000, landRent: 250, rent1House: 300, rent2Houses: 350, rent3Houses: 400, rent4Houses: 450 },
  { id: 4, name: "การ์เด้น", price: 2000, landRent: 250, rent1House: 300, rent2Houses: 350, rent3Houses: 400, rent4Houses: 450 },
  { id: 5, name: "ตลาดโบ๊เบ๊", price: 1000, landRent: 60, rent1House: 300, rent2Houses: 900, rent3Houses: 2700, rent4Houses: 4000, rentHotel: 5500, houseCost: 500, hotelCost: 2500 },
  { id: 6, name: "เยาวราช", price: 1000, landRent: 60, rent1House: 300, rent2Houses: 900, rent3Houses: 2700, rent4Houses: 4000, rentHotel: 5500, houseCost: 500, hotelCost: 2500 },
  { id: 7, name: "จันทบุรี", price: 1200, landRent: 80, rent1House: 400, rent2Houses: 1000, rent3Houses: 3000, rent4Houses: 4500, rentHotel: 6000, houseCost: 500, hotelCost: 2500 },
  { id: 8, name: "กาญจนบุรี", price: 1400, landRent: 100, rent1House: 500, rent2Houses: 1500, rent3Houses: 4500, rent4Houses: 6250, rentHotel: 7500, houseCost: 1000, hotelCost: 5000 },
  { id: 9, name: "การไฟฟ้า", price: 1500, landRent: 300, rent1House: 600 },
  { id: 10, name: "ระยอง", price: 1400, landRent: 100, rent1House: 500, rent2Houses: 1500, rent3Houses: 4500, rent4Houses: 6250, rentHotel: 7500, houseCost: 1000, hotelCost: 5000 },
  { id: 11, name: "สุโขทัย", price: 1600, landRent: 120, rent1House: 600, rent2Houses: 1800, rent3Houses: 5000, rent4Houses: 7000, rentHotel: 9000, houseCost: 1000, hotelCost: 5000 },
  { id: 12, name: "เอเมอรัล", price: 2000, landRent: 250, rent1House: 300, rent2Houses: 350, rent3Houses: 400, rent4Houses: 450 },
  { id: 13, name: "ภูเก็ต", price: 1800, landRent: 140, rent1House: 700, rent2Houses: 2000, rent3Houses: 5500, rent4Houses: 7500, rentHotel: 9500, houseCost: 1000, hotelCost: 5000 },
  { id: 14, name: "สุราษฎร์ธานี", price: 1800, landRent: 140, rent1House: 700, rent2Houses: 2000, rent3Houses: 5500, rent4Houses: 7500, rentHotel: 9500, houseCost: 1000, hotelCost: 5000 },
  { id: 15, name: "สงขลา", price: 2000, landRent: 160, rent1House: 800, rent2Houses: 2200, rent3Houses: 6000, rent4Houses: 8000, rentHotel: 10000, houseCost: 1000, hotelCost: 5000 },
  { id: 16, name: "เพชรบุรี", price: 2200, landRent: 180, rent1House: 900, rent2Houses: 2500, rent3Houses: 7000, rent4Houses: 8750, rentHotel: 10500, houseCost: 1500, hotelCost: 7500 },
  { id: 17, name: "เชียงใหม่", price: 2200, landRent: 180, rent1House: 900, rent2Houses: 2500, rent3Houses: 7000, rent4Houses: 8750, rentHotel: 10500, houseCost: 1500, hotelCost: 7500 },
  { id: 18, name: "เชียงราย", price: 2400, landRent: 200, rent1House: 1000, rent2Houses: 2500, rent3Houses: 7500, rent4Houses: 9250, rentHotel: 11000, houseCost: 1500, hotelCost: 7500 },
  { id: 19, name: "แกรนด์จอมเทียน", price: 2000, landRent: 250, rent1House: 300, rent2Houses: 350, rent3Houses: 400, rent4Houses: 450 },
  { id: 20, name: "แม่ฮ่องสอน", price: 2600, landRent: 220, rent1House: 1100, rent2Houses: 3300, rent3Houses: 8000, rent4Houses: 9750, rentHotel: 11500, houseCost: 1500, hotelCost: 7500 },
  { id: 21, name: "ลำปาง", price: 2600, landRent: 220, rent1House: 1100, rent2Houses: 3300, rent3Houses: 8000, rent4Houses: 9750, rentHotel: 11500, houseCost: 1500, hotelCost: 7500 },
  { id: 22, name: "การประปา", price: 1500, landRent: 300, rent1House: 600 },
  { id: 23, name: "โคราช", price: 2800, landRent: 220, rent1House: 1200, rent2Houses: 3600, rent3Houses: 8500, rent4Houses: 10250, rentHotel: 12000, houseCost: 1500, hotelCost: 7500 },
  { id: 24, name: "แดนเนรมิต", price: 3000, landRent: 260, rent1House: 1300, rent2Houses: 3900, rent3Houses: 9000, rent4Houses: 11000, rentHotel: 12750, houseCost: 2000, hotelCost: 10000 },
  { id: 25, name: "สุรินทร์", price: 3000, landRent: 260, rent1House: 1300, rent2Houses: 3900, rent3Houses: 9000, rent4Houses: 11000, rentHotel: 12750, houseCost: 2000, hotelCost: 10000 },
  { id: 26, name: "อุบลราชธานี", price: 3200, landRent: 280, rent1House: 1500, rent2Houses: 4500, rent3Houses: 10000, rent4Houses: 12000, rentHotel: 14000, houseCost: 2000, hotelCost: 10000 },
  { id: 27, name: "โนโวเทล", price: 2000, landRent: 250, rent1House: 300, rent2Houses: 350, rent3Houses: 400, rent4Houses: 450 },
  { id: 28, name: "ดอนเมือง", price: 3500, landRent: 350, rent1House: 1750, rent2Houses: 5000, rent3Houses: 11000, rent4Houses: 13000, rentHotel: 15000, houseCost: 2000, hotelCost: 10000 },
  { id: 29, name: "เสาชิงช้า", price: 4000, landRent: 500, rent1House: 2000, rent2Houses: 6000, rent3Houses: 14000, rent4Houses: 17000, rentHotel: 20000, houseCost: 2000, hotelCost: 10000 },
];
