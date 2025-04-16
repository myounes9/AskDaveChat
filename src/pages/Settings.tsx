
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatbotSettings from '@/components/Settings/ChatbotSettings';
import { ChatWidgetSettings } from '@/types';
import { fetchChatbotSettings, saveChatbotSettings } from '@/services/mock-data';

const Settings = () => {
  const [settings, setSettings] = useState<ChatWidgetSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const data = await fetchChatbotSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const handleSaveSettings = async (updatedSettings: ChatWidgetSettings) => {
    try {
      const savedSettings = await saveChatbotSettings(updatedSettings);
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Tabs defaultValue="chatbot">
        <TabsList>
          <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chatbot" className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading settings...</div>
          ) : settings ? (
            <ChatbotSettings 
              settings={settings} 
              onSaveSettings={handleSaveSettings} 
            />
          ) : (
            <div>Error loading settings.</div>
          )}
        </TabsContent>
        
        <TabsContent value="account" className="mt-6">
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <p className="text-muted-foreground">Account settings will be available in a future update.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="integrations" className="mt-6">
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Integration Settings</h2>
            <p className="text-muted-foreground">Integration settings will be available in a future update.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
