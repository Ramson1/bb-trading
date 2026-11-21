import { BotSettings, BotSnapshot } from '../shared/types';

export class BotService {
  private settings: BotSettings;

  constructor(initialSettings: BotSettings) {
    this.settings = initialSettings;
  }

  getSnapshot(): BotSnapshot {
    return {
      running: false,
      starting: false,
      status: 'idle',
      live: false,
      balance: 0,
      startBalance: 0,
      bet: 0,
      profit: 0,
      target: 0,
      wins: 0,
      losses: 0,
      winStreak: 0,
      lossStreak: 0,
      recoveryRemaining: 0,
      payout: 0,
      lastFlight: '',
      dryRunRounds: 0,
      inRecovery: false,
      recoveryBet: 0,
      sessionNumber: 0,
      autoRestarts: 0,
      maxLosses: 0,
      baseBet: 0,
      error: '',
      stopReason: ''
    };
  }

  start() { console.log('Bot started'); }
  stop() { console.log('Bot stopped'); }
  updateSettings(settings: Partial<BotSettings>) {
    this.settings = { ...this.settings, ...settings };
  }
}