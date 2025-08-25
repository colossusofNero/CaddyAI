import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Monitor, Type, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { Settings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }: SettingsModalProps) {
  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Settings
                </h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Theme Settings */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Sun size={16} className="mr-2" />
                    Theme
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {themeOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => onUpdateSettings({ theme: option.value as any })}
                          className={`p-3 rounded-lg border text-sm transition-colors flex flex-col items-center space-y-1 ${
                            settings.theme === option.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <IconComponent size={18} />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Type size={16} className="mr-2" />
                    Font Size
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {fontSizeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onUpdateSettings({ fontSize: option.value as any })}
                        className={`p-3 rounded-lg border text-sm transition-colors ${
                          settings.fontSize === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Globe size={16} className="mr-2" />
                    Language
                  </h3>
                  <select
                    value={settings.language}
                    onChange={(e) => onUpdateSettings({ language: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notifications */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Notifications
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Enable notifications
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.notifications}
                        onChange={(e) => onUpdateSettings({ notifications: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Sound effects
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.soundEnabled}
                        onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 space-x-3">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={onClose}>
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}