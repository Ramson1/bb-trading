import React from 'react';
import { useBotSnapshot } from '../hooks/useBotSnapshot';

export function Dashboard() {
  const { data: snapshot, isLoading } = useBotSnapshot();

  const handleStart = () => {
    window.electronAPI.startBot();
  };

  const handleStop = () => {
    window.electronAPI.stopBot();
  };

  const handleGoLive = () => {
    window.electronAPI.goLive();
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Banner / Controls */}
      <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${snapshot?.running ? 'bg-secondary animate-pulse' : 'bg-outline'}`}></span>
            <span className="font-headline-sm text-lg text-primary tracking-wide">
              BB-TRADING // AVIATOR BOT
            </span>
          </div>
          <span className="px-2 py-1 rounded bg-surface-container font-label-caps text-xs text-on-surface-variant">
            MODE: {snapshot?.live ? 'LIVE TRADING' : 'DRY RUN'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleStart}
            disabled={snapshot?.running}
            className="px-4 py-2 rounded bg-secondary text-on-secondary font-title-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Start Bot
          </button>
          <button
            onClick={handleStop}
            disabled={!snapshot?.running}
            className="px-4 py-2 rounded bg-error text-on-error font-title-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Stop Bot
          </button>
          <button
            onClick={handleGoLive}
            disabled={snapshot?.live}
            className="px-4 py-2 rounded bg-primary text-on-primary font-title-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Go Live
          </button>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex flex-col gap-2">
          <span className="font-label-caps text-outline text-xs">STATUS</span>
          <span className="font-headline-md text-on-surface uppercase">
            {isLoading ? 'Loading...' : snapshot?.status || 'Idle'}
          </span>
          <span className="font-body-sm text-outline">
            Session #{snapshot?.sessionNumber || 1}
          </span>
        </div>

        <div className="card p-4 flex flex-col gap-2">
          <span className="font-label-caps text-outline text-xs">BALANCE</span>
          <span className="font-mono-metric-lg text-secondary">
            {isLoading ? '...' : `${snapshot?.balance || 0} KES`}
          </span>
          <span className="font-body-sm text-outline">
            Start: {snapshot?.startBalance || 0} KES
          </span>
        </div>

        <div className="card p-4 flex flex-col gap-2">
          <span className="font-label-caps text-outline text-xs">CURRENT BET / RECOVERY</span>
          <span className="font-mono-metric-lg text-primary">
            {isLoading ? '...' : `${snapshot?.bet || 0} KES`}
          </span>
          <span className="font-body-sm text-outline">
            {snapshot?.inRecovery ? `Recovery Step (${snapshot?.recoveryRemaining} left)` : 'Normal Mode'}
          </span>
        </div>

        <div className="card p-4 flex flex-col gap-2">
          <span className="font-label-caps text-outline text-xs">PROFIT / TARGET</span>
          <span className={`font-mono-metric-lg ${(snapshot?.profit || 0) >= 0 ? 'positive' : 'negative'}`}>
            {isLoading ? '...' : `${snapshot?.profit || 0} KES`}
          </span>
          <span className="font-body-sm text-outline">
            Target: {snapshot?.target || 0} KES
          </span>
        </div>
      </div>

      {/* Secondary Metrics & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 flex flex-col gap-3 lg:col-span-2">
          <h3 className="font-headline-sm text-on-surface">Session Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface-container-low p-3 rounded">
              <span className="font-label-caps text-outline text-xs">WINS</span>
              <p className="font-mono-metric-md text-secondary mt-1">{snapshot?.wins || 0}</p>
            </div>
            <div className="bg-surface-container-low p-3 rounded">
              <span className="font-label-caps text-outline text-xs">LOSSES</span>
              <p className="font-mono-metric-md text-error mt-1">{snapshot?.losses || 0}</p>
            </div>
            <div className="bg-surface-container-low p-3 rounded">
              <span className="font-label-caps text-outline text-xs">WIN STREAK</span>
              <p className="font-mono-metric-md text-on-surface mt-1">{snapshot?.winStreak || 0}</p>
            </div>
            <div className="bg-surface-container-low p-3 rounded">
              <span className="font-label-caps text-outline text-xs">LOSS STREAK</span>
              <p className="font-mono-metric-md text-on-surface mt-1">{snapshot?.lossStreak || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 flex flex-col gap-3">
          <h3 className="font-headline-sm text-on-surface">Active Configuration</h3>
          <div className="flex flex-col gap-2 font-mono-metric-sm">
            <div className="flex justify-between py-1 border-b border-surface-container">
              <span className="text-outline">Base Bet:</span>
              <span className="text-on-surface">{snapshot?.baseBet || 50} KES</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-container">
              <span className="text-outline">Target Payout:</span>
              <span className="text-on-surface">{snapshot?.payout || 1.1}x</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-container">
              <span className="text-outline">Max Losses:</span>
              <span className="text-on-surface">{snapshot?.maxLosses || 15}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}