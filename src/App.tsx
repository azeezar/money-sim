import { useEffect, useRef, useState } from 'react';
import { Logo } from './components/Logo';
import { Mascot, MascotIcon } from './components/Mascot';
import { Quests } from './components/Quests';
import { Toasts } from './components/Toasts';
import { XpBar } from './components/XpBar';
import { PROFILES } from './data/profiles';
import { gbp } from './lib/format';
import { ADMIN } from './lib/mode';
import { canPortfolio, canTrade, comingNext, isAdult, unlocks } from './lib/access';
import { Admin } from './screens/Admin';
import { Games } from './screens/Games';
import { Learn } from './screens/Learn';
import { LessonScreen } from './screens/Lesson';
import { AgeGate, Onboarding } from './screens/Onboarding';
import { Portfolio } from './screens/Portfolio';
import { MyMascot } from './screens/MyMascot';
import { Pot } from './screens/Pot';
import { Profile } from './screens/Profile';
import { Trade } from './screens/Trade';
import { Welcome } from './screens/Welcome';
import { markSeen, tickOrders } from './state/actions';
import { getState, useStore } from './state/store';
import { Icon, type IconName } from './ui/Icon';
import { ThemeToggle } from './ui/theme';
import { toast } from './ui/toast';

const VIEWS = ['learn', 'pot', 'portfolio', 'trade', 'games', 'mascot', 'profile', 'admin'] as const;
type View = (typeof VIEWS)[number];
const NAV: { v: View; label: string; icon: IconName }[] = [
  { v: 'learn', label: 'Learn', icon: 'learn' },
  { v: 'pot', label: 'My budget', icon: 'goal' },
  { v: 'portfolio', label: 'Portfolio', icon: 'pie' },
  { v: 'trade', label: 'Trade', icon: 'candles' },
  { v: 'games', label: 'Games', icon: 'games' },
  { v: 'mascot', label: 'Mascot', icon: 'user' },
  { v: 'profile', label: 'Profile', icon: 'user' },
  ...(ADMIN ? [{ v: 'admin' as View, label: 'Admin', icon: 'gear' as IconName }] : []),
];

const readHash = (): View => {
  const h = location.hash.slice(1);
  if (h === 'rewards') return 'profile';
  if (h === 'admin' && !ADMIN) return 'learn';
  if (h === 'trade' && !isAdult(getState())) return 'learn';
  return (VIEWS as readonly string[]).includes(h) ? (h as View) : 'learn';
};

export default function App() {
  const s = useStore();
  const [view, setView] = useState<View>(readHash);
  const [lesson, setLesson] = useState<string | null>(null);
  const [retake, setRetake] = useState(false);
  // The welcome screen shows once per app open (browser tab session).
  const [entered, setEntered] = useState(() => {
    try {
      return sessionStorage.getItem('money-sim-entered') === '1';
    } catch {
      return false;
    }
  });
  const enter = () => {
    try {
      sessionStorage.setItem('money-sim-entered', '1');
    } catch {
      /* private mode: the welcome screen just shows again next time */
    }
    setEntered(true);
  };

  useEffect(() => {
    const f = () => setView(readHash());
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);

  // Pending limit / stop orders fill in the background while the app is open.
  useEffect(() => {
    tickOrders();
    const id = setInterval(tickOrders, 2000);
    return () => clearInterval(id);
  }, []);

  // A toast the moment XP opens something new, even mid-lesson. The pop-up follows once the lesson closes.
  const announced = useRef(new Set(unlocks(s).map((u) => u.id)));
  useEffect(() => {
    for (const u of unlocks(s)) {
      if (announced.current.has(u.id)) continue;
      announced.current.add(u.id);
      toast(u.id.startsWith('tier-') ? `🎉 Next tier unlocked: ${u.title.replace(/ lessons and minigames$/, '')}` : `🔓 ${u.title} unlocked`);
    }
  }, [s]);

  const go = (v: View) => {
    if (location.hash.slice(1) !== v) location.hash = v;
    setView(v);
    scrollTo(0, 0);
  };

  if (!entered) {
    return (
      <>
        <Welcome onEnter={enter} />
        <Toasts />
      </>
    );
  }

  if (!s.onboarded || retake) {
    return (
      <>
        <Onboarding
          retake={retake}
          onDone={() => {
            setRetake(false);
            go('learn');
          }}
        />
        <Toasts />
      </>
    );
  }

  if (s.dob === null) {
    return (
      <>
        <AgeGate />
        <Toasts />
      </>
    );
  }

  if (lesson) {
    return (
      <>
        <LessonScreen
          key={lesson}
          id={lesson}
          onClose={() => setLesson(null)}
          onGames={() => {
            setLesson(null);
            go('games');
          }}
        />
        <Toasts />
      </>
    );
  }

  const g = s.goal;
  const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
  const wide = view === 'trade' && canTrade(s);
  // Under 18s never see the Trade tab at all.
  const nav = NAV.filter((n) => n.v !== 'trade' || isAdult(s));
  const locked = (v: View) => (v === 'trade' && !canTrade(s)) || (v === 'portfolio' && !canPortfolio(s));
  const fresh = unlocks(s).filter((u) => !s.seen[u.id]);
  const newTier = fresh.filter((u) => u.id.startsWith('tier-')).pop();
  const brand = (size: number) => (
    <div className="brand">
      <Logo height={size * 0.8} />
      <span>
        Money<b>Sim</b>
      </span>
      {ADMIN && <span className="admintag">Admin</span>}
    </div>
  );

  return (
    <>
      <div className={'shell' + (wide ? ' wide' : '')} data-view={view}>
        <nav className="side" aria-label="Sections">
          {brand(36)}
          {nav.map((n) => (
            <button key={n.v} className={`sidelink n-${n.v}` + (view === n.v ? ' on' : '')} onClick={() => go(n.v)} aria-current={view === n.v ? 'page' : undefined}>
              {n.v === 'mascot' ? <MascotIcon id={s.mascot} /> : <Icon name={n.icon} />}
              {n.label}
              {locked(n.v) && <Icon name="lock" size={14} />}
            </button>
          ))}
          <div className="side-foot">
            <ThemeToggle />
          </div>
        </nav>

        <main className="main">
          <header className="top">
            {brand(32)}
            <div className="stats num">
              <span className="stat s-streak" aria-label={`Day streak ${s.streak}`}>
                <Icon name="flame" />
                <b>{s.streak}</b>
              </span>
              <span className="stat s-star" aria-label={`Stars ${s.stars}`}>
                <Icon name="star" />
                <b>{s.stars}</b>
              </span>
              <span className="stat s-heart" aria-label={`Hearts ${s.hearts}`}>
                <Icon name="heart" />
                <b>{s.hearts}</b>
              </span>
              <span className="m-only">
                <ThemeToggle />
              </span>
            </div>
          </header>
          {wide ? (
            <Trade onLearn={() => go('learn')} />
          ) : (
            <div className="view">
              {view === 'learn' && <Learn openLesson={setLesson} />}
              {view === 'pot' && <Pot onGames={() => go('games')} />}
              {view === 'mascot' && <MyMascot />}
              {view === 'portfolio' && <Portfolio />}
              {view === 'trade' && isAdult(s) && <Trade onLearn={() => go('learn')} />}
              {view === 'games' && <Games />}
              {view === 'profile' && <Profile onRetake={() => setRetake(true)} go={go} />}
              {view === 'admin' && ADMIN && <Admin />}
            </div>
          )}
        </main>

        {!wide && (
          <aside className="rail">
            <div className="card">
              <div className="row">
                <Mascot id={s.mascot} size={44} />
                <div>
                  <h3>Hi{s.name ? `, ${s.name}` : ''}</h3>
                  <span className="muted small">{PROFILES[s.profile].name}</span>
                </div>
              </div>
            </div>
            {view !== 'learn' && view !== 'profile' && <XpBar xp={s.xp} />}
            <Quests s={s} />
            <div className="card goalcard">
              <span className="tag">{g.name}</span>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <b className="num">{gbp(g.saved)}</b>
                <span className="muted num">of {gbp(g.target)}</span>
              </div>
              <div className="bar">
                <i style={{ width: `${pct}%` }} />
              </div>
            </div>
          </aside>
        )}
      </div>

      <nav className="tabs" aria-label="Sections">
        {nav.map((n) => (
          <button key={n.v} className={`tab n-${n.v}` + (view === n.v ? ' on' : '')} onClick={() => go(n.v)} aria-current={view === n.v ? 'page' : undefined}>
            {n.v === 'mascot' ? <MascotIcon id={s.mascot} /> : <Icon name={n.icon} />}
            {n.label}
          </button>
        ))}
      </nav>
      {fresh.length > 0 && (
        <div className="t2-sheetwrap" role="dialog" aria-modal="true" aria-labelledby="unlock-title">
          <div className="t2-sheet unlockpop">
            <div className="center">
              <Mascot id={s.mascot} size={84} />
              <span className="tag">{newTier ? 'Tier unlocked' : 'Unlocked'}</span>
              <h2 id="unlock-title">
                {newTier ? `You've unlocked the next tier: ${newTier.title.replace(/ lessons and minigames$/, '')}` : fresh.length === 1 ? `${fresh[0].title} is now available` : 'New sections are now available'}
              </h2>
            </div>
            <div className="glist">
              {fresh.map((u) => (
                <div className="gitem" key={u.id}>
                  <span className="grow">
                    <b>{u.title}</b>
                    <br />
                    <span className="muted small">{u.text}</span>
                  </span>
                </div>
              ))}
            </div>
            {comingNext(s) && <p className="muted small">Next up: {comingNext(s)}</p>}
            <div className="row">
              {(newTier || fresh.some((u) => u.id === 'portfolio' || u.id === 'trade')) && (
                <button
                  className="btn ghost grow"
                  onClick={() => {
                    markSeen(fresh.map((u) => u.id));
                    go(fresh.some((u) => u.id === 'trade') ? 'trade' : fresh.some((u) => u.id === 'portfolio') ? 'portfolio' : 'learn');
                  }}
                >
                  Take me there
                </button>
              )}
              <button className="btn grow" onClick={() => markSeen(fresh.map((u) => u.id))}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      <Toasts />
    </>
  );
}
