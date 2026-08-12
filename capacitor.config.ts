import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lessgo.app',
  appName: 'LessGo',
  webDir: 'dist',
  // Point the app at the live site instead of bundling a snapshot of dist/,
  // so shipping an update to Vercel updates the app immediately — no new
  // Play Store release needed unless native (Capacitor) code changes.
  server: {
    url: 'https://lessgo-mu.vercel.app',
    androidScheme: 'https',
  },
};

export default config;
