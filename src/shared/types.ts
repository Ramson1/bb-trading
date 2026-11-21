export interface BotSettings {
  baseBet: number;
  payout: number;
  maxLosses: number;
  targetPercent: number;
  recoveryStepInc: number;
}

export interface RoundRecord {
  id: string;
  sessionId: string;
  result: 'win' | 'loss';
  amount: number;
  payout: number;
  multiplier: number;
  profit: number;
  balanceAfter: number;
  mode: 'normal' | 'recovery';
  betBefore: number;
  timestamp: string;
}

export interface SessionRecord {
  id: string;
  startBalance: number;
  endBalance: number | null;
  targetProfit: number;
  baseBet: number;
  payout: number;
  maxLosses: number;
  wins: number;
  losses: number;
  status: string;
  startedAt: string;
  endedAt: string | null;
}

export interface BotSnapshot {
  running: boolean;
  starting: boolean;
  status: string;
  live: boolean;
  balance: number;
  startBalance: number;
  bet: number;
  profit: number;
  target: number;
  wins: number;
  losses: number;
  winStreak: number;
  lossStreak: number;
  recoveryRemaining: number;
  payout: number;
  lastFlight: string;
  dryRunRounds: number;
  inRecovery: boolean;
  recoveryBet: number;
  sessionNumber: number;
  autoRestarts: number;
  maxLosses: number;
  baseBet: number;
  error: string;
  stopReason: string;
}

export type BotCommand =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'GO_LIVE' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<BotSettings> };
