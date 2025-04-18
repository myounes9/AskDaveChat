import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ChatWidgetSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { supabase } from '@/lib/supabaseClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, FileText } from 'lucide-react';

interface AssistantFile {
    id: string;
    file_id: string;
    vector_store_id: string;
    status: string;
    filename?: string;
}

interface ChatbotSettingsProps {
  settings: Omit<ChatWidgetSettings, 'requireEmailBeforeChat'>;
  onSaveSettings: (settings: Omit<ChatWidgetSettings, 'requireEmailBeforeChat'>) => void;
  isSaving?: boolean;
}

// Assume a default identifier for the configuration being edited
const CONFIG_IDENTIFIER = "default"; 

const ChatbotSettings: React.FC<ChatbotSettingsProps> = ({
  settings,
  onSaveSettings,
  isSaving = false
}) => {
  const { requireEmailFirst, setRequireEmailFirst } = useSettings();

  const { register, handleSubmit, formState: { errors }, control, reset } = useForm<Omit<ChatWidgetSettings, 'requireEmailBeforeChat'>>(
    {
      defaultValues: settings
    }
  );
  const { toast } = useToast();

  const [assistantInstructions, setAssistantInstructions] = useState<string>('');
  const [associatedFiles, setAssociatedFiles] = useState<AssistantFile[]>([]);
  const [isLoadingAssistantData, setIsLoadingAssistantData] = useState<boolean>(true);
  const [assistantDataError, setAssistantDataError] = useState<string | null>(null);

  // State for editing within the dialog
  const [editedInstructions, setEditedInstructions] = useState<string>('');
  const [isSavingInstructions, setIsSavingInstructions] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false); // Control dialog open state
  const [isSavingAppearanceBehavior, setIsSavingAppearanceBehavior] = useState<boolean>(false); // Local saving state

  useEffect(() => {
    const fetchAssistantData = async () => {
      setIsLoadingAssistantData(true);
      setAssistantDataError(null);
      try {
        console.log("Invoking manage-assistant function with GET method...");
        const { data, error } = await supabase.functions.invoke('manage-assistant', {
          method: 'GET'
        });

        if (error) throw error;

        if (data) {
           console.log("Received assistant data:", data);
           setAssistantInstructions(data.instructions || '');
           setEditedInstructions(data.instructions || ''); // Initialize edit state
           setAssociatedFiles(data.files || []);
        } else {
            throw new Error("No data received from manage-assistant function.");
        }

      } catch (err: any) {
        console.error("Error fetching assistant data:", err);
        setAssistantDataError(err.message || "Failed to load assistant configuration.");
        setAssistantInstructions('');
        setAssociatedFiles([]);
        // Reset editedInstructions on error
        setEditedInstructions('');
      } finally {
        setIsLoadingAssistantData(false);
      }
    };

    fetchAssistantData();
  }, []);

  useEffect(() => {
    // Reset form if the initial settings prop changes
    reset(settings);
  }, [settings, reset]);

  // --- Update onOpenChange logic --- BEGIN
  const handleOpenChange = (open: boolean) => {
      console.log(`[handleOpenChange] Called with open: ${open}`);
      if (open) {
        setEditedInstructions(assistantInstructions);
        console.log("[handleOpenChange] Reset editedInstructions");
      }
      setIsDialogOpen(open);
      console.log(`[handleOpenChange] Set isDialogOpen to: ${open}`);
  };
  // --- Update onOpenChange logic --- END

  const handleSaveInstructions = async () => {
    setIsSavingInstructions(true);
    console.log("Attempting to save instructions via API:", editedInstructions);
    try {
      const { data, error } = await supabase.functions.invoke('manage-assistant', {
        method: 'POST',
        body: { instructions: editedInstructions },
      });

      if (error) throw error;

      if (data?.success) {
        setAssistantInstructions(data.instructions || editedInstructions);
        toast({
          title: "Instructions Saved Successfully",
          description: "Assistant instructions have been updated.",
        });
        setIsDialogOpen(false); // Close dialog on success
      } else {
        throw new Error(data?.error || "Failed to save instructions. Function did not report success.");
      }
    } catch (err: any) {
      console.error("Error saving instructions:", err);
      toast({
        title: "Error Saving Instructions",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      // Keep dialog open on error
    } finally {
      setIsSavingInstructions(false);
    }
  };

  // <<< Updated onSubmit to save to Supabase >>>
  const onSubmit = async (formData: Omit<ChatWidgetSettings, 'requireEmailBeforeChat'>) => {
    setIsSavingAppearanceBehavior(true);
    console.log("Form Data Submitted:", formData);
    console.log("Require Email First State:", requireEmailFirst);

    const settingsToSave = {
        identifier: CONFIG_IDENTIFIER, // Use the hardcoded identifier
        theme_color: formData.themeColor,
        initial_message: formData.initialMessage,
        require_email_first: requireEmailFirst, // Get value from context state
        // position and collectLeadAfter are not in widget_configurations table yet
        // We might need to add them if they should be centrally managed
    };

    console.log("Attempting to save to widget_configurations:", settingsToSave);

    try {
        const { error } = await supabase
            .from('widget_configurations')
            .upsert(settingsToSave, { onConflict: 'identifier' }); // Upsert based on the unique identifier

        if (error) {
            console.error("Error saving settings to database:", error);
            throw error;
        }

        toast({
            title: "Settings Saved to Database",
            description: "Your chatbot settings have been updated successfully.",
        });
        
        // Optionally, still call the old save function if needed for localStorage sync?
        // onSaveSettings(formData); 

    } catch (err: any) {
        toast({
            title: "Error Saving Settings",
            description: err.message || "Failed to save settings to the database.",
            variant: "destructive",
        });
    } finally {
        setIsSavingAppearanceBehavior(false);
    }
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
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-medium">Appearance</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="themeColor">Theme Color</Label>
                <div className="flex items-center gap-2">
                  <Controller
                    name="themeColor"
                    control={control}
                    rules={{
                      required: 'Theme color is required',
                      pattern: {
                        value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                        message: 'Please enter a valid hex color code'
                      }
                    }}
                    render={({ field }) => (
                      <>
                        <Input
                          id="themeColor"
                          type="text"
                          placeholder="#10b981"
                          {...field}
                          className="flex-grow"
                        />
                        <Input
                          type="color"
                          value={field.value}
                          onChange={field.onChange}
                          className="h-9 w-10 p-1 rounded-md cursor-pointer"
                        />
                      </>
                    )}
                  />
                </div>
                {errors.themeColor && (
                  <p className="text-sm text-destructive mt-1">{errors.themeColor.message}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <div className="flex items-center space-x-4 pt-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="position-right"
                      value="right"
                      {...register('position')}
                    />
                    <Label htmlFor="position-right">Right</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="position-left"
                      value="left"
                      {...register('position')}
                    />
                    <Label htmlFor="position-left">Left</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-medium">Behavior</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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
                    min: { value: 1, message: 'Must be at least 1' },
                    max: { value: 10, message: 'Must be 10 or less' },
                  })}
                />
                {errors.collectLeadAfter && (
                  <p className="text-sm text-destructive">{errors.collectLeadAfter.message}</p>
                )}
              </div>

              <div className="grid gap-2 col-span-1 md:col-span-2"> {/* Span across columns */} 
                <div className="flex items-center space-x-2 pt-2">
                   <Switch 
                      id="requireEmailFirst"
                      checked={requireEmailFirst} 
                      onCheckedChange={setRequireEmailFirst}
                      aria-label="Require email before starting chat"
                   />
                   <Label htmlFor="requireEmailFirst">Require email before starting chat</Label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
               <h3 className="text-lg font-medium">Assistant Configuration</h3>
               {!isLoadingAssistantData && !assistantDataError && (
                   <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                     <DialogTrigger asChild>
                       <Button variant="outline" size="sm">
                         Edit Instructions
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
                       <DialogHeader>
                         <DialogTitle>Edit Assistant Instructions</DialogTitle>
                         <DialogDescription>
                           Enter new instructions for the assistant.
                         </DialogDescription>
                       </DialogHeader>
                       <div className="grid gap-2">
                         <Label htmlFor="assistantInstructions">Assistant Instructions</Label>
                         <Textarea
                           id="assistantInstructions"
                           value={editedInstructions}
                           onChange={(e) => setEditedInstructions(e.target.value)}
                           placeholder="Enter assistant instructions..."
                           rows={10}
                         />
                       </div>
                       <DialogFooter>
                         <Button 
                           type="submit" 
                           onClick={handleSaveInstructions} 
                           disabled={isSavingInstructions}
                         >
                           {isSavingInstructions ? (
                             <>
                               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                               Saving...
                             </>
                           ) : (
                             'Save'
                           )}
                         </Button>
                         <Button 
                           type="reset" 
                           onClick={() => setIsDialogOpen(false)} 
                           disabled={isSavingInstructions}
                         >
                           Cancel
                         </Button>
                       </DialogFooter>
                     </DialogContent>
                   </Dialog>
               )}
            </div>
            <Separator />

            {isLoadingAssistantData && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Loading Assistant Details...</span>
              </div>
            )}

            {assistantDataError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Assistant Config</AlertTitle>
                    <AlertDescription>{assistantDataError}</AlertDescription>
                </Alert>
            )}

            {!isLoadingAssistantData && !assistantDataError && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="assistantInstructions">Assistant Instructions</Label>
                  <Textarea
                    id="assistantInstructions"
                    readOnly={isDialogOpen}
                    value={isDialogOpen ? editedInstructions : assistantInstructions}
                    onChange={(e) => setEditedInstructions(e.target.value)}
                    placeholder={isDialogOpen ? "Enter assistant instructions..." : "Loading instructions..."}
                    rows={10}
                    className={isDialogOpen ? "bg-muted/50" : ""}
                  />
                </div>

                <div className="grid gap-2">
                   <Label>Associated Files (for File Search)</Label>
                   {associatedFiles.length > 0 ? (
                     <ul className="list-none space-y-2 rounded-md border p-3 bg-muted/50">
                       {associatedFiles.map((file) => (
                         <li key={file.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{file.filename || file.file_id}</span>
                            </div>
                           <span className={`text-xs px-2 py-0.5 rounded-full ${file.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                             {file.status}
                           </span>
                         </li>
                       ))}
                     </ul>
                   ) : (
                     <p className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                       No files currently associated with the assistant's File Search tool.
                     </p>
                   )}
                </div>
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={isSavingAppearanceBehavior}>
             {isSavingAppearanceBehavior ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
             Save Appearance & Behavior
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ChatbotSettings;
