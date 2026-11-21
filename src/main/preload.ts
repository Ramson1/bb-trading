import { contextBridge, ipcRenderer } from 'electron';
import { BotSnapshot, BotSettings, RoundRecord } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getSnapshot: (): Promise<BotSnapshot> => ipcRenderer.invoke('bot:snapshot'),
  startBot: () => ipcRenderer.invoke('bot:start'),
  stopBot: () => ipcRenderer.invoke('bot:stop'),
  goLive: () => ipcRenderer.invoke('bot:golive'),
  updateSettings: (settings: Partial<BotSettings>) => ipcRenderer.invoke('bot:settings', settings),
  getHistory: (limit?: number): Promise<{ history: RoundRecord[]; stats: any }> => ipcRenderer.invoke('bot:history', limit),
  onSnapshot: (callback: (snapshot: BotSnapshot) => void) => {
    ipcRenderer.on('bot:snapshot-update', (_, snapshot) => callback(snapshot));
  },
});
