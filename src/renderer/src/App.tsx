import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { GameView } from './components/GameView';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'game'>('dashboard');

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'settings' && <SettingsPanel />}
        {activeTab === 'game' && <>
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-headline-lg text-2xl text-primary">Embedded Game View</h1>
            <span className="font-label-caps text-xs text-secondary uppercase tracking-wider">
              Live Connection: {snapshot?.status === 'running' ? '● 12ms' : '○ Disconnected'}
            </span>
          </div>
          <div style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
            <GameView />
          </div>
        </>}
      </main>
    </div>
  );
}