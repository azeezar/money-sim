import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moneysim.app',
  appName: 'Money Sim',
  webDir: 'dist',
  ios: { contentInset: 'never', backgroundColor: '#6a45e8' },
  plugins: {
    SplashScreen: { launchShowDuration: 900, backgroundColor: '#6a45e8', showSpinner: false },
  },
};

export default config;
