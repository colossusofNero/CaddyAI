import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.caddyai',
  appName: 'CaddyAI',
  webDir: 'dist',
  server: {
    // For dev live reload with device, you can set url later, e.g.:
    // url: 'http://192.168.1.10:5173',
    // cleartext: true,
  },
};
export default config;