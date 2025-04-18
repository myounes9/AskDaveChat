import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatbotSettings from '@/components/Settings/ChatbotSettings';
import { ChatWidgetSettings } from '@/types';
import { loadChatbotSettings, saveChatbotSettings } from '@/services/settings-service';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const [settings, setSettings] = useState<ChatWidgetSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const data = await loadChatbotSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error Loading Settings",
          description: "Could not load your settings. Default values will be used.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [toast]);

  const handleSaveSettings = async (updatedSettings: ChatWidgetSettings) => {
    setIsSaving(true);
    try {
      const savedSettings = await saveChatbotSettings(updatedSettings);
      setSettings(savedSettings);
      toast({
        title: "Settings Saved",
        description: "Your chatbot settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error Saving Settings",
        description: "Your settings could not be saved. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
              isSaving={isSaving}
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
