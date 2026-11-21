import React from 'react';
import { useBotSnapshot } from '../hooks/useBotSnapshot';

export function Sidebar() {
  const { snapshot } = useBotSnapshot();

  return (
    <nav className="sidebar" style={{ width: '240px', background: '#0f131d', padding: '20px', minHeight: '100vh' }}>
      <div className="flex flex-col gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span style={{ fontSize: '24px' }}>📈</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-lg text-primary tracking-wide">BB-TRADING</h2>
            <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider">Aviator Bot</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-headline-sm transition-colors">
            <span style={{ fontSize: '18px' }}>📊</span>
            Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-headline-sm transition-colors">
            <span style={{ fontSize: '18px' }}>🎮</span>
            Game
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-headline-sm transition-colors">
            <span style={{ fontSize: '18px' }}>⚙️</span>
            Settings
          </button>
        </nav>

        {/* Quick Stats */}
        {snapshot && (
          <div className="mt-6 p-4 rounded-xl bg-surface-container border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label-caps text-[10px] text-outline uppercase">
                Live Status
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-body-sm text-outline">Balance</span>
                <span className="font-mono-metric-md text-secondary text-right">{snapshot.balance?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-sm text-outline">Active Bet</span>
                <span className="font-mono-metric-md text-primary text-right">{snapshot.bet?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-sm text-outline">Profit</span>
                <span className={`font-mono-metric-md text-right ${snapshot.profit >= 0 ? 'positive' : 'negative'}`}>
                  {snapshot.profit?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-sm text-outline">Session</span>
                <span className="font-mono-metric-md text-on-surface text-right">#{snapshot.sessionNumber || 1}</span>
              </div>
            </div>
          </div>
        )}

        {/* Session Counter */}
        <div className="mt-4 p-4 rounded-xl bg-surface-container border border-outline-variant/30">
          <div className="text-center">
            <span className="font-label-caps text-[10px] text-outline uppercase mb-2 block">Total Sessions</span>
            <span className="font-headline-lg text-primary">1,247</span>
            <div className="text-[11px] text-outline mt-1">Active: 23</div>
          </div>
        </div>
      </div>
    </nav>
  );
}