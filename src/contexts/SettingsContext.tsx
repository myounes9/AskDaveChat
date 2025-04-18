'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface SettingsContextProps {
  requireEmailFirst: boolean;
  setRequireEmailFirst: (value: boolean) => void;
}

const REQUIRE_EMAIL_KEY = 'chatbot_require_email';

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get the saved value from localStorage or use default (true)
  const [requireEmailFirst, setRequireEmailFirstState] = useState<boolean>(() => {
    // Only run this on client-side
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(REQUIRE_EMAIL_KEY);
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Persist value to localStorage when it changes
  const setRequireEmailFirst = (value: boolean) => {
    setRequireEmailFirstState(value);
    
    // Only run this on client-side
    if (typeof window !== 'undefined') {
      localStorage.setItem(REQUIRE_EMAIL_KEY, value.toString());
    }
  };

  return (
    <SettingsContext.Provider value={{ requireEmailFirst, setRequireEmailFirst }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextProps => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 