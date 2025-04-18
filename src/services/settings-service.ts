import { ChatWidgetSettings } from '@/types';

// Default chatbot settings
export const defaultChatbotSettings: ChatWidgetSettings = {
  initialMessage: "Hi there! 👋 How can I help you today?",
  themeColor: "#10b981",
  position: 'right',
  collectLeadAfter: 3,
  requireEmailBeforeChat: false
};

const SETTINGS_STORAGE_KEY = 'chatbot_settings';

/**
 * Loads chatbot settings from localStorage, falling back to defaults if not found
 */
export const loadChatbotSettings = (): Promise<ChatWidgetSettings> => {
  return new Promise((resolve) => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        resolve({
          ...defaultChatbotSettings, // Fallback for any missing properties
          ...parsedSettings,
        });
      } else {
        resolve(defaultChatbotSettings);
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
      resolve(defaultChatbotSettings);
    }
  });
};

/**
 * Saves chatbot settings to localStorage
 */
export const saveChatbotSettings = (settings: ChatWidgetSettings): Promise<ChatWidgetSettings> => {
  return new Promise((resolve, reject) => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      resolve(settings);
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
      reject(error);
    }
  });
};

/**
 * Updates only specific properties of the chatbot settings
 */
export const updateChatbotSettings = async (
  partialSettings: Partial<ChatWidgetSettings>
): Promise<ChatWidgetSettings> => {
  const currentSettings = await loadChatbotSettings();
  const updatedSettings = {
    ...currentSettings,
    ...partialSettings,
  };
  return saveChatbotSettings(updatedSettings);
}; 