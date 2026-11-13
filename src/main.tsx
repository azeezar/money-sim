import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { buzz } from './lib/native';
import { applyTheme } from './ui/theme';

applyTheme();

// In the iOS app, keep the status bar text readable against the app's own light or dark theme.
if (Capacitor.isNativePlatform()) {
  // No long-press text selection or magnifier, as in a native app. Text fields still work.
  document.documentElement.classList.add('native');
  // An app should not pinch- or double-tap-zoom like a web page. The website keeps zoom for accessibility.
  document.querySelector('meta[name=viewport]')?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  const sync = () => void StatusBar.setStyle({ style: document.documentElement.dataset.theme === 'dark' ? Style.Dark : Style.Light });
  sync();
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  requestAnimationFrame(() => void SplashScreen.hide());
  // A light tap on every button press, like a native app.
  document.addEventListener('click', (e) => (e.target as Element).closest?.('button:not(:disabled)') && buzz());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
