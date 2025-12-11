export interface ActivityItem {
  id: string;
  type: 'check-in' | 'streak-bonus' | 'connect';
  timestamp: string;
  txHash?: string;
}

export interface UserState {
  isConnected: boolean;
  address: string | null;
  lastCheckin: string | null;
  totalCheckins: number;
  streak: number;
}