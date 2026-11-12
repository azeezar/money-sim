import { useState } from 'react';
import { Backup } from '../components/Backup';
import { Logo } from '../components/Logo';
import { resetStore, useStore } from '../state/store';

/**
 * First screen on every app open. Start makes a new profile; Log in continues the one saved on this device.
 * shortcut: "accounts" are the single local save, no passwords or sync; add a backend for real accounts.
 */
export function Welcome({ onEnter }: { onEnter: () => void }) {
  const s = useStore();
  const [step, setStep] = useState<'home' | 'replace' | 'none'>('home');
  const saved = s.onboarded;

  return (
    <div className="welcome">
      <div className="welcome-in">
        <div className="welcome-hero">
          <Logo height={96} tone="white" />
          <h1>
            Money<b>Sim</b>
          </h1>
          <p>Learn money, play the games, and practise investing with pretend cash before it costs you anything real.</p>
          <div className="welcome-pts">
            <span>📚 32 bite-sized lessons</span>
            <span>🎮 Arcade games</span>
            <span>📈 Virtual portfolio and trading</span>
          </div>
        </div>

        <div className="welcome-act">
          {step === 'home' && (
            <>
              <button className="btn wide" onClick={() => (saved ? setStep('replace') : onEnter())}>
                Start
              </button>
              <button className="btn ghost wide" onClick={() => (saved ? onEnter() : setStep('none'))}>
                {saved && s.name ? `Log in as ${s.name}` : 'Log in'}
              </button>
            </>
          )}
          {step === 'replace' && (
            <div className="fb bad">
              <b>Start a new profile?</b>
              <p>
                This device already has {s.name ? `${s.name}’s` : 'a'} profile with {s.xp} XP. Starting new replaces it, and it cannot be undone. To keep it, log in instead.
              </p>
              <button
                className="btn bad wide"
                onClick={() => {
                  resetStore();
                  onEnter();
                }}
              >
                Replace and start new
              </button>
              <button className="btn ghost wide" onClick={onEnter}>
                Log in instead
              </button>
            </div>
          )}
          {step === 'none' && (
            <div className="fb bad">
              <b>No profile on this device yet</b>
              <p>Your progress is saved on the device you use. Tap Start to set up your profile, or paste a backup code from your old device.</p>
              <Backup onRestored={onEnter} />
              <button className="btn wide" onClick={onEnter}>
                Start
              </button>
              <button className="btn ghost wide" onClick={() => setStep('home')}>
                Back
              </button>
            </div>
          )}
          <p className="muted small center">All money in Money Sim is virtual. Education, not financial advice.</p>
        </div>
      </div>
    </div>
  );
}
