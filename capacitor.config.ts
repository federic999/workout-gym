import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.federic.hypertrophytracker',
  appName: 'Hypertrophy Tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
