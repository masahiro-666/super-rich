export interface Player {
  id: string;
  name: string;
  balance: number;
  isBank?: boolean;
  color?: string;
}

export interface Transaction {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  amount: number;
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
  started: boolean;
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
