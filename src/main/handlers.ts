import { ipcMain } from 'electron';
import { prisma } from './db';
import { BotService } from '../shared/bot.service';

const botService = new BotService({
  baseBet: 50,
  payout: 1.1,
  maxLosses: 15,
  targetPercent: 3,
  recoveryStepInc: 300
});

export function registerBotHandlers() {
  ipcMain.handle('bot:snapshot', async () => {
    return botService.getSnapshot();
  });

  ipcMain.handle('bot:start', async () => {
    botService.start();
  });

  ipcMain.handle('bot:stop', async () => {
    botService.stop();
  });

  ipcMain.handle('bot:golive', async () => {
    console.log('Go live');
  });

  ipcMain.handle('bot:settings', async (_, settings) => {
    botService.updateSettings(settings);
  });

  ipcMain.handle('bot:history', async (_, limit) => {
    return await prisma.round.findMany({ take: limit || 100 });
  });
}