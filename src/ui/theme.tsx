import { useSyncExternalStore } from 'react';

/** Light (white) is the default for everyone. Dark is an opt-in, remembered per browser. */
export type Theme = 'light' | 'dark';
const KEY = 'money-sim-theme';
const subs = new Set<() => void>();

function read(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

let theme: Theme = read();

export function applyTheme(): void {
  document.documentElement.dataset.theme = theme;
}

export function setTheme(t: Theme): void {
  theme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* storage can be blocked */
  }
  applyTheme();
  subs.forEach((f) => f());
}

export const useTheme = (): Theme =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => theme,
    () => theme,
  );

export function ThemeToggle() {
  const t = useTheme();
  return (
    <button className="themebtn" onClick={() => setTheme(t === 'dark' ? 'light' : 'dark')} aria-label={t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={t === 'dark' ? 'Light mode' : 'Dark mode'}>
      {t === 'dark' ? '☀︎' : '☾'}
    </button>
  );
}
