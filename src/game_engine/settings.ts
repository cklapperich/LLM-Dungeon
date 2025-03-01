// Import the settings file at the top level
import defaultSettings from '@assets/default-settings.json';
// Import your existing GameSettings interface
import { GameSettings } from '../types/gamestate';
const USERSETTINGS_KEY = 'userSettings';
/**
 * Gets the default settings for the application
 * @returns The default settings object
 */
function getDefaultSettings(): GameSettings {
  return defaultSettings as GameSettings;
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(USERSETTINGS_KEY, JSON.stringify(settings));
    console.log('Settings saved successfully');
    } catch (error) {
       console.warn('Failed to save settings:', error);
    }
}

export function getSettings(): GameSettings {
  // Start with default settings
  const settings = { ...getDefaultSettings() };
  
  try {
    const savedSettings = localStorage.getItem(USERSETTINGS_KEY);
    if (savedSettings) {
      const userSettings = JSON.parse(savedSettings);
      Object.assign(settings, userSettings);
    }
  } catch (error) {
    console.warn('Failed to load user settings:', error);
  }
  
  return settings;
}

export function get_api_key(settings:GameSettings): string {

    const settingsKey = settings.api_key;
    if (settingsKey) {
        return settingsKey;
    }

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('VITE_OPENROUTER_API_KEY environment variable is required');
    }
    return apiKey;
}
