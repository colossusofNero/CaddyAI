import { useLocalStorage } from './useLocalStorage';
import { Settings } from '../types';

const defaultSettings: Settings = {
  theme: 'system',
  fontSize: 'medium',
  language: 'en',
  notifications: true,
  soundEnabled: true
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>('settings', defaultSettings);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    updateSettings
  };
}