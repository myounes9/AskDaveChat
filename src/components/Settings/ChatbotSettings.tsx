
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatWidgetSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ChatbotSettingsProps {
  settings: ChatWidgetSettings;
  onSaveSettings: (settings: ChatWidgetSettings) => void;
}

const ChatbotSettings: React.FC<ChatbotSettingsProps> = ({
  settings,
  onSaveSettings
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ChatWidgetSettings>({
    defaultValues: settings
  });
  const { toast } = useToast();

  const onSubmit = (data: ChatWidgetSettings) => {
    onSaveSettings(data);
    toast({
      title: "Settings Saved",
      description: "Your chatbot settings have been updated successfully.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chatbot Settings</CardTitle>
        <CardDescription>
          Configure how your chatbot appears and behaves on your website.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            <Separator />
            
            <div className="grid gap-2">
              <Label htmlFor="themeColor">Theme Color (Hex)</Label>
              <Input
                id="themeColor"
                type="text"
                placeholder="#10b981"
                {...register('themeColor', {
                  required: 'Theme color is required',
                  pattern: {
                    value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                    message: 'Please enter a valid hex color code'
                  }
                })}
              />
              {errors.themeColor && (
                <p className="text-sm text-destructive">{errors.themeColor.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="position-right"
                  value="right"
                  {...register('position')}
                />
                <Label htmlFor="position-right">Right</Label>
                
                <input
                  type="radio"
                  id="position-left"
                  value="left"
                  className="ml-4"
                  {...register('position')}
                />
                <Label htmlFor="position-left">Left</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Behavior</h3>
            <Separator />
            
            <div className="grid gap-2">
              <Label htmlFor="initialMessage">Initial Message</Label>
              <Input
                id="initialMessage"
                placeholder="Hi there! How can I help you today?"
                {...register('initialMessage', { required: 'Initial message is required' })}
              />
              {errors.initialMessage && (
                <p className="text-sm text-destructive">{errors.initialMessage.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="collectLeadAfter">Collect Lead After (messages)</Label>
              <Input
                id="collectLeadAfter"
                type="number"
                min="1"
                max="10"
                {...register('collectLeadAfter', {
                  required: 'This field is required',
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: 'Value must be at least 1'
                  },
                  max: {
                    value: 10,
                    message: 'Value must not exceed 10'
                  }
                })}
              />
              {errors.collectLeadAfter && (
                <p className="text-sm text-destructive">{errors.collectLeadAfter.message}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="requireEmailBeforeChat"
                {...register('requireEmailBeforeChat')}
              />
              <Label htmlFor="requireEmailBeforeChat">Require email before starting chat</Label>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit">Save Changes</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ChatbotSettings;
