import { useState } from 'react';
import { useBotSnapshot } from '../hooks/useBotSnapshot';

export function SettingsPanel() {
  const { data: snapshot } = useBotSnapshot();
  const [baseBet, setBaseBet] = useState(snapshot?.baseBet || 50);
  const [payout, setPayout] = useState(snapshot?.payout || 1.1);
  const [maxLosses, setMaxLosses] = useState(snapshot?.maxLosses || 15);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await window.electronAPI.updateSettings({
      baseBet: Number(baseBet),
      payout: Number(payout),
      maxLosses: Number(maxLosses),
      recoveryStepInc: Number(baseBet) * 6
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-headline-lg text-2xl text-primary">Bot Configuration</h1>
        <p className="text-outline text-sm">Configure betting parameters, recovery multipliers, and risk thresholds.</p>
      </div>

      <form onSubmit={handleSave} className="card p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-label-caps text-xs text-outline">BASE BET (KES)</label>
          <input
            type="number"
            value={baseBet}
            onChange={(e) => setBaseBet(Number(e.target.value))}
            className="bg-surface-container-low border border-outline-variant rounded p-2 text-on-surface font-mono-metric-sm outline-none focus:border-primary"
          />
          <span className="text-[11px] text-outline">Recovery Start will be automatically set to Base Bet × 6 ({Number(baseBet || 0) * 6} KES)</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-label-caps text-xs text-outline">TARGET PAYOUT</label>
          <input
            type="number"
            step="0.01"
            value={payout}
            onChange={(e) => setPayout(Number(e.target.value))}
            className="bg-surface-container-low border border-outline-variant rounded p-2 text-on-surface font-mono-metric-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-label-caps text-xs text-outline">MAX LOSSES (RECOVERY LIMIT)</label>
          <input
            type="number"
            value={maxLosses}
            onChange={(e) => setMaxLosses(Number(e.target.value))}
            className="bg-surface-container-low border border-outline-variant rounded p-2 text-on-surface font-mono-metric-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-surface-container">
          {saved && <span className="text-secondary font-headline-sm text-sm">Settings saved successfully!</span>}
          <button
            type="submit"
            className="px-6 py-2.5 rounded bg-primary text-on-primary font-title-sm ml-auto hover:opacity-90 transition-opacity"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}