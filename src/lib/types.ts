// Tipos do aplicativo Wol's

export type Platform = 'uber' | '99' | 'indriver';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  instagram?: string;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: Date;
}

export interface Ride {
  id: string;
  userId: string;
  platform: Platform;
  date: Date;
  value: number;
  distance: number;
  duration: number;
  category: string;
  bonus: number;
  multiplier?: number;
  totalEarnings: number;
}

export interface DailyExpense {
  id: string;
  userId: string;
  date: Date;
  fuel: number;
  food: number;
  toll: number;
  other: number;
  total: number;
}

export interface DailySummary {
  date: Date;
  totalEarnings: number;
  totalExpenses: number;
  netProfit: number;
  timeOnline: number; // em minutos
  totalRides: number;
  earningsByPlatform: {
    uber: number;
    '99': number;
    indriver: number;
  };
  totalBonus: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

export interface Ranking {
  userId: string;
  userName: string;
  city: string;
  totalEarnings: number;
  position: number;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'read' | 'resolved';
}
