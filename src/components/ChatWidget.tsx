import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Import the Supabase client
import { cn } from "@/lib/utils"; // Import cn utility
import { useSettings } from '@/contexts/SettingsContext'; // Import useSettings

// Import shadcn/ui components
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Example avatar
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, SendHorizonal, AlertCircle, Bot, User, X, Phone, FileText, Calendar as CalendarIcon, MessageSquare, Minus } from "lucide-react"; // Icons
import { loadChatbotSettings } from '@/services/settings-service';
import { ChatWidgetSettings } from '@/types';
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from "@/components/ui/textarea"; // <<< Import Textarea
import ReactMarkdown from 'react-markdown'; // <<< Import ReactMarkdown

// --- Type Definitions ---
interface ResourceAction { 
  label: string;
  type: 'link' | 'lead_capture_contact' | 'lead_capture_sample' | 'gallery' | 'price_guide' | 'video'; // Added video type
  value: string; // URL for link/video, identifier/prompt for other types
}

interface ProductLevelInfo { // Represents a specific product (like Bifold Doors or Smoothsash Windows)
  label: string;
  productPageUrl?: string; // <<< Add Product Page URL
  prompt?: string; 
  resources: { [key: string]: ResourceAction };
}

interface CategoryInfo { // Represents a top-level category (like Doors or Windows)
  label: string;
  prompt?: string; // Optional entry prompt for the category
  subcategories?: { [key: string]: ProductLevelInfo }; // Optional subcategories 
  // Removed direct resources from CategoryInfo, assume all products have resources
}

interface ProductInfoType {
  [key: string]: CategoryInfo; // Index signature for top-level categories
}

// --- Configuration ---
// Removed: const requireEmailFirst = true; // Now using context
const initialMessageContent = "Hi there! 👋 How can I help you today?";
const WIDGET_CHANNEL = 'website_widget';
const THREAD_STORAGE_KEY = 'dawsbot_thread_id'; // <<< Key for localStorage
// --- End Configuration ---

// Interface for messages in the chat
interface ChatMessage {
  role: 'user' | 'assistant' | 'error'; // Added error role for display
  text: string;
}

// Define the expected structure of the response data from the function
interface FunctionResponse {
  messages: { role: 'assistant'; text: string }[];
  threadId: string;
  conversationId: string; // <<< Add conversationId (UUID)
}

// Define the structure for function invocation errors
interface FunctionError {
  message: string;
  // Supabase often includes code/details, but we'll keep it simple
}

// TODO: Get Supabase Function URL from environment variables
const CHAT_FUNCTION_URL = '/functions/v1/chat-handler'; // Relative URL will work with Vite proxy if we were using one, but now needs absolute
// We should fetch the Supabase URL/anon key to invoke functions directly or configure vite proxy if running node server

// Interface for widget configuration fetched from backend
interface WidgetConfig {
    theme_color: string;
    initial_message: string;
    require_email_first: boolean;
}

// Interface for props
interface ChatWidgetProps {
  onClose: () => void; // Add onClose prop
  configIdentifier: string; // <<< Add prop for configuration identifier
}

// --- Regex for Citations (same as backend) ---
const citationRegex = /\s*【[^】†]+†source】/g;

type ConversationMode = 
  'INITIAL' | 
  'CALLBACK_NAME' | 'CALLBACK_PHONE' | 'CALLBACK_ENQUIRY' | 'CALLBACK_DATETIME' | 'CALLBACK_TIME' | 
  'ENQUIRY_CATEGORY' | 'ENQUIRY_SUBCATEGORY' | 'ENQUIRY_RESOURCE' | 
  'LEAD_CAPTURE_CONTACT_FORM' | 'LEAD_CAPTURE_SAMPLE_FORM' |
  'FREE_CHAT';

// <<< Define Time Slots >>>
const TIME_SLOTS = [
  { label: "Morning (9am - 12pm)", value: "morning" },
  { label: "Afternoon (1pm - 5pm)", value: "afternoon" },
  // Add more if needed, e.g., Evening
];

// --- Product Info Structure (Updated with URLs and refined keys) ---
const productInfo: ProductInfoType = {
  doors: {
    label: "Doors",
    prompt: "Which door type can I help you with today?",
    subcategories: {
      smoothfold: {
        label: "Smoothfold Bi-folding Doors",
        productPageUrl: "https://www.daws.co.uk/products/smoothfold-bifolding-doors",
        prompt: "Our Smoothfold system offers thermally-broken aluminium frames, custom-made sizes, and multiple colours. Would you like to:",
        resources: {
          techSheet: { label: "View Technical Data Sheet", type: 'link', value: "/placeholder/smoothfold-tech.pdf" },
          measureGuide: { label: "See Measuring Guide", type: 'link', value: "/placeholder/smoothfold-measure-guide.pdf" }
        }
      },
      smoothslide: {
        label: "Smoothslide Sliding Doors",
        productPageUrl: "https://www.daws.co.uk/products/smoothslide-sliding-doors",
        prompt: "Smoothslide features ultra-smooth rollers, slim sightlines, and U-values down to 1.4 W/m²K. What would you like?",
        resources: {
          gallery: { label: "View Gallery", type: 'gallery', value: "https://www.daws.co.uk/products/smoothslide-sliding-doors#gallery" }, // Link to page section
          techSheet: { label: "Download Tech Sheet", type: 'link', value: "/placeholder/smoothslide-tech.pdf" },
          priceGuide: { label: "Get Price Guide", type: 'price_guide', value: "/placeholder/smoothslide-price-guide.pdf" } // Placeholder link
        }
      },
      designer: {
        label: "Designer Entrance Doors",
        productPageUrl: "https://www.daws.co.uk/products/designer-entrance-doors",
        prompt: "Our Designer Entrance Doors come with multi-point locking and security glass options. You can:",
        resources: {
          sample: { label: "Request a Sample Door Finish", type: 'lead_capture_sample', value: "Request Sample: Designer Entrance Door" },
          specSheet: { label: "Download Specification Sheet", type: 'link', value: "/placeholder/designer-spec.pdf" }
        }
      }
    }
  },
  windows: {
    label: "Windows",
    prompt: "Looking for windows? Pick a system below.",
    subcategories: {
      smoothsash400: {
        label: "Smoothsash 400 Windows",
        productPageUrl: "https://www.daws.co.uk/products/smoothsash-400-windows",
        prompt: "Smoothsash 400 combines a heritage casement style with polyamide thermal break technology (U-values from 1.3 W/m²K). Would you like:",
        resources: {
          techData: { label: "View Technical Data", type: 'link', value: "/placeholder/smoothsash400-tech.pdf" },
          contact: { label: "Contact Trade Sales", type: 'lead_capture_contact', value: "Contact Request: Smoothsash 400" }
        }
      }
      // Add other window types if applicable
    }
  },
  steel_look: {
    label: "Steel-Look Products",
    prompt: "Explore our steel-look aluminium systems.",
    subcategories: {
      legacy: {
        label: "Legacy Steel-Look Collection",
        productPageUrl: "https://www.daws.co.uk/products/legacy-steel-look-collection",
        prompt: "Legacy offers authentic sightlines from 25 mm and a variety of RAL colours. To proceed:",
        resources: {
          productSheet: { label: "Download Product Sheet", type: 'link', value: "/placeholder/legacy-steel-sheet.pdf" },
          caseStudies: { label: "View Case Studies", type: 'link', value: "/placeholder/legacy-steel-casestudies" }
        }
      },
      autograph: {
        label: "Autograph Steel-Look Doors", // Should this be Autograph Steel Collection?
        productPageUrl: "https://www.daws.co.uk/products/autograph-steel-collection",
        prompt: "Autograph doors offer a premium steel-look aesthetic. What would you like?",
        resources: { 
           contact: { label: "Contact Sales", type: 'lead_capture_contact', value: "Contact Request: Autograph Steel-Look" }
         }
      }
    }
  },
  lanterns: {
    label: "Lanterns",
    prompt: "Interested in roof lanterns?",
    subcategories: {
      standard: {
        label: "Standard Roof Lanterns",
        productPageUrl: "https://www.daws.co.uk/products/standard-roof-lanterns",
        prompt: "Our double-glazed aluminium lanterns deliver U-values down to 1.4 W/m²K. Would you like:",
        resources: {
          video: { label: "Watch Installation Video", type: 'video', value: "/placeholder/standard-lantern-video" } // Link to video page/resource
        }
      },
      walk_on: {
        label: "Walk-On Lanterns",
        productPageUrl: "https://www.daws.co.uk/products/walk-on-lanterns",
        prompt: "Our walk-on lanterns provide light and functional roof access. What would you like?",
        resources: { 
            contact: { label: "Contact Sales", type: 'lead_capture_contact', value: "Contact Request: Walk-On Lanterns" }
         }
      }
    }
  }
};
// Note: Actual links/structure might differ. This is for UI flow.

const ChatWidget: React.FC<ChatWidgetProps> = ({ onClose, configIdentifier }) => {
  const { requireEmailFirst } = useSettings();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [threadId, setThreadId] = useState<string | null>(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem(THREAD_STORAGE_KEY);
      }
      return null;
  });
  const [conversationDbId, setConversationDbId] = useState<string | null>(null); // <<< State for DB conversation ID
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for widget settings - use WidgetConfig type
  const [widgetSettings, setWidgetSettings] = useState<WidgetConfig | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [settingsError, setSettingsError] = useState<string | null>(null); // Separate error state for settings

  // State for email capture flow
  const [userEmail, setUserEmail] = useState<string | null>(null); // Store user's email
  const [emailInput, setEmailInput] = useState<string>(''); // Controlled input for email form
  // Show form initially based on context setting AND if email hasn't been provided yet
  const [showEmailForm, setShowEmailForm] = useState<boolean>(requireEmailFirst && !userEmail);
  const [emailError, setEmailError] = useState<string | null>(null); // Error for email input

  // Store startUrl once when component mounts
  const [startUrl] = useState<string>(() => typeof window !== 'undefined' ? window.location.href : '');

  // --- New State --- 
  const [conversationMode, setConversationMode] = useState<ConversationMode>('INITIAL');
  
  // Callback Flow State
  const [nameInput, setNameInput] = useState<string>('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState<string>(''); 
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submittedPhoneNumber, setSubmittedPhoneNumber] = useState<string | null>(null); 
  const [enquiryInput, setEnquiryInput] = useState<string>(''); // <<< New
  const [enquiryError, setEnquiryError] = useState<string | null>(null); // <<< New
  const [submittedEnquiry, setSubmittedEnquiry] = useState<string | null>(null); // <<< New
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined); 
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null); 
  const [callbackFlowCompleted, setCallbackFlowCompleted] = useState<boolean>(false);

  // --- Enquiry Flow State --- 
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const scrollAreaRef = useRef<null | HTMLDivElement>(null);

  const [isMinimized, setIsMinimized] = useState(false); // <<< State for minimize

  // <<< Add state for lead capture forms >>>
  const [leadCaptureContext, setLeadCaptureContext] = useState<string | null>(null); // Store context like product name
  const [leadNameInput, setLeadNameInput] = useState<string>('');
  const [leadEmailInput, setLeadEmailInput] = useState<string>('');
  const [leadPhoneInput, setLeadPhoneInput] = useState<string>('');
  const [leadAddressInput, setLeadAddressInput] = useState<string>(''); // For samples
  const [leadDetailsError, setLeadDetailsError] = useState<string | null>(null); // Generic error for lead forms

  // <<< Helper function to log widget events >>>
  const logWidgetEvent = async (eventType: string, eventDetails: Record<string, any>) => {
    // Fire and forget - don't block UI for analytics
    console.log(`[logWidgetEvent] Logging: ${eventType}`, eventDetails);
    try {
        const payload = {
            eventType: eventType,
            eventDetails: eventDetails,
            conversationId: conversationDbId, // Use state variable
            threadId: threadId             // Use state variable
        };
        const { error } = await supabase.functions.invoke('log-widget-event', {
            body: payload
        });
        if (error) {
            console.error(`[logWidgetEvent] Failed to log event ${eventType}:`, error);
        }
    } catch (err) {
        // Catch errors from invoke itself
        console.error(`[logWidgetEvent] Error invoking function for event ${eventType}:`, err);
    }
  };

  // <<< New useEffect to fetch settings from backend function >>>
  useEffect(() => {
    const fetchWidgetConfig = async () => {
        if (!configIdentifier) {
            console.error("ChatWidget: Missing required prop 'configIdentifier'. Cannot fetch settings.");
            setSettingsError("Widget configuration identifier is missing.");
            setIsLoadingSettings(false);
            return; // Stop if no identifier
        }

        console.log(`ChatWidget: Fetching configuration for identifier: ${configIdentifier}`);
        setIsLoadingSettings(true);
        setSettingsError(null);
        try {
            const { data, error } = await supabase.functions.invoke<WidgetConfig>('get-widget-settings', {
                method: 'GET', // Specify GET method for invoke
                // Pass identifier as query param using Supabase function invoke convention (though edge func reads url directly)
                // Note: Supabase invoke might not directly support query params easily this way.
                // The Edge function is designed to read from url.searchParams, so we might need a direct fetch.
                // Let's try direct fetch instead of supabase.functions.invoke for GET with query params
            });
            
            // Using direct fetch:
            // Construct URL and get anon key safely from environment variables
            const baseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            if (!baseUrl || !anonKey) {
                // Log error but proceed with default settings if env vars are missing client-side
                console.error("ChatWidget: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are not defined.");
                setSettingsError("Client-side configuration error.");
                // Use default settings defined in the catch block
                setWidgetSettings({ 
                     theme_color: '#dc2626', // Default red on error?
                     initial_message: 'Sorry, could not load settings. How can I help?',
                     require_email_first: false
                });
                setIsLoadingSettings(false);
                return; // Stop fetch attempt
            }

            // Now baseUrl and anonKey are guaranteed to be strings
            const functionUrl = `${baseUrl}/functions/v1/get-widget-settings?identifier=${encodeURIComponent(configIdentifier)}`;
            console.log(`ChatWidget: Attempting fetch from ${functionUrl}`); // Added log
            const response = await fetch(functionUrl, {
                method: 'GET',
                headers: {
                    // We need the anon key for RLS to pass if policies require it, even for SELECT.
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}` // Use anon key as Bearer token for RLS
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
                throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
            }

            const configData: WidgetConfig = await response.json();

            console.log("ChatWidget: Received widget configuration:", configData);
            if (!configData || !configData.theme_color || !configData.initial_message) {
                 throw new Error("Invalid configuration data received from server.");
            }
            setWidgetSettings(configData);

        } catch (err: any) {
            console.error('ChatWidget: Error loading widget configuration:', err);
            setSettingsError(`Failed to load widget settings: ${err.message}`);
            // Optionally set default settings here on error?
            setWidgetSettings({ 
                 theme_color: '#dc2626', // Default red on error?
                 initial_message: 'Sorry, could not load settings. How can I help?',
                 require_email_first: false
            });
        } finally {
            setIsLoadingSettings(false);
        }
    };

    fetchWidgetConfig();
  }, [configIdentifier]); // Re-fetch if identifier changes

  // <<< Updated useEffect for showEmailForm >>>
  useEffect(() => {
    // Show form only if settings are loaded, require_email_first is true, and email hasn't been provided
    if (widgetSettings) {
        setShowEmailForm(widgetSettings.require_email_first && !userEmail);
    }
  }, [widgetSettings, userEmail]); // Run when settings load or email changes

  // Effect to log the loaded threadId (for debugging)
  useEffect(() => {
    console.log("ChatWidget: Initial threadId loaded from state/storage:", threadId);
  }, []); // Run only once on mount

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
        // Find the viewport element within ScrollArea and scroll it
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  // Modify initial message useEffect to only add if settings are loaded and messages are empty
  useEffect(() => {
    // Check isLoadingSettings is false and widgetSettings is not null
    if (!isLoadingSettings && widgetSettings && messages.length === 0 && !showEmailForm) { 
      setMessages([{ role: 'assistant', text: widgetSettings.initial_message }]);
    }
    // Dependency array includes showEmailForm to re-evaluate if email form is submitted
  }, [isLoadingSettings, widgetSettings, messages.length, showEmailForm]);

  // Handle email form submission
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    setEmailError(null); // Clear previous errors
    const potentialEmail = emailInput.trim();

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!potentialEmail) {
        setEmailError("Email address cannot be empty.");
        return;
    }
    if (!emailRegex.test(potentialEmail)) {
        setEmailError("Please enter a valid email address.");
        return;
    }

    console.log("Email captured:", potentialEmail);
    setUserEmail(potentialEmail); // Store the email
    setShowEmailForm(false); // Hide the form
    // Optional: Send email to backend/analytics here if needed immediately
  };

  // <<< Reusable function to establish/send message >>>
  const establishConversation = async (messageContent: string): Promise<{ threadId: string | null, conversationId: string | null, success: boolean }> => {
    const isHiddenSystemMessage = messageContent === "User initiated callback flow"; // <<< Flag for our hidden message
    setIsLoading(true);
    setError(null);
    let localThreadId = threadId; // Use current state threadId
    let localConvDbId = conversationDbId; // Use current state convId

    try {
      console.log(`[establishConversation] Sending: "${messageContent}", Existing Thread: ${localThreadId}, Existing ConvDB: ${localConvDbId}`);

      const requestBody = {
          message: messageContent,
          threadId: localThreadId,
          userEmail, // Include if available
          startUrl: startUrl,
          channel: WIDGET_CHANNEL,
          userId: null // Always null for anonymous widget user
      };

      const { data, error: invokeError } = await supabase.functions.invoke<FunctionResponse>('chat-handler', {
         body: requestBody,
      });

      if (invokeError) throw invokeError;
      if (data && (data as any).error) throw new Error((data as any).error.message || 'Function execution failed');
      if (!data || !data.messages || !data.threadId || !data.conversationId) throw new Error('Invalid response structure');

      console.log('[establishConversation] Received data:', data);

      // Update state and localStorage for threadId
      if (data.threadId && data.threadId !== localThreadId) {
          console.log(`[establishConversation] Updating threadId state/storage to ${data.threadId}`);
          setThreadId(data.threadId);
          if (typeof window !== 'undefined') {
              localStorage.setItem(THREAD_STORAGE_KEY, data.threadId);
          }
          localThreadId = data.threadId; // Update local copy for return
      }

      // Update state for conversationDbId
      if (data.conversationId && data.conversationId !== localConvDbId) {
          console.log(`[establishConversation] Updating conversationDbId state to ${data.conversationId}`);
          setConversationDbId(data.conversationId);
          localConvDbId = data.conversationId; // Update local copy for return
      }

      // <<< Conditionally add assistant messages >>>
      if (!isHiddenSystemMessage) { // <<< Only add if NOT the hidden message
          const assistantMessages = data.messages
              .filter((msg: any): msg is { role: 'assistant', text: string } => msg.role === 'assistant' && typeof msg.text === 'string')
              .map(msg => ({ 
                  role: 'assistant' as const, 
                  text: msg.text.replace(citationRegex, '').trim() 
              }))
              .filter(msg => msg.text.length > 0);
          
          if (assistantMessages.length > 0) {
              console.log('[establishConversation] Adding assistant messages to UI.');
              setMessages(prev => [...prev, ...assistantMessages]);
          } else {
              console.log('[establishConversation] No assistant messages to add.');
          }
      } else {
          console.log('[establishConversation] Skipping adding assistant message for hidden system message.');
      }
      
      return { threadId: localThreadId, conversationId: localConvDbId, success: true };

    } catch (err: any) {
      console.error("[establishConversation] Error:", err);
      setError(err.message || "Failed establish conversation");
      setMessages(prev => [...prev, { role: 'error', text: err.message || "An unknown error occurred." }]);
      return { threadId: localThreadId, conversationId: localConvDbId, success: false }; // Return current IDs even on failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading || conversationMode !== 'FREE_CHAT') return; 

    // Add user message immediately
    const userMessageObj = { role: 'user' as const, text: userMessage };
    setMessages(prev => [...prev, userMessageObj]);
    setInput(''); // Clear input after adding to state

    // Call the reusable function
    await establishConversation(userMessage);
    // We might not need to do anything with the returned IDs here 
    // as establishConversation updates state directly.
  };

  // --- Flow Control Handlers ---
  const handleStartCallbackFlow = async () => {
    console.log("[handleStartCallbackFlow] Starting...");
    setIsLoading(true);
    const initialMessage = "User initiated callback flow";
    const { success, conversationId: newConvId } = await establishConversation(initialMessage);
    setIsLoading(false);

    if (!success || !newConvId) {
      console.error("[handleStartCallbackFlow] Failed to establish conversation.");
      toast.error("Could not start callback flow. Please try again.");
      return;
    }
    
    console.log("[handleStartCallbackFlow] Conversation established/confirmed. Setting mode to CALLBACK_NAME.");
    setConversationMode('CALLBACK_NAME');
    setMessages(prev => [...prev, { role: 'assistant', text: "Okay, let's arrange a callback. Could I get your name, please?" }]);
    logWidgetEvent('flow_start', { flow: 'callback', label: 'Arrange a Callback' });
  };

  const handleStartEnquiryFlow = () => {
    console.log("[handleStartEnquiryFlow] Starting Product Enquiry flow...");
    // Reset previous selections if any
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    // Add initial prompt message
    setMessages(prev => [...prev, { role: 'assistant', text: "Okay, I can help with that. Which product category are you interested in?" }]);
    // Set mode to show category buttons
    setConversationMode('ENQUIRY_CATEGORY'); 
  };

  // <<< Handler for Name Submission >>>
  const handleNameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setNameError(null);
      const potentialName = nameInput.trim();
      if (!potentialName) {
          setNameError("Name cannot be empty.");
          return;
      }
      console.log("Name submitted:", potentialName);
      setSubmittedName(potentialName);
      setMessages(prev => [...prev, {role: 'user', text: `My name is ${potentialName}`}]);
      // <<< Transition to Phone >>>
      setConversationMode('CALLBACK_PHONE');
      setMessages(prev => [...prev, { role: 'assistant', text: `Thanks ${potentialName}! What's the best phone number to reach you at?` }]);
      setNameInput(''); // Clear input
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setPhoneError(null);
      const potentialPhone = phoneInput.trim();
      if (!potentialPhone) {
          setPhoneError("Phone number cannot be empty.");
          return;
      }
      const phoneRegex = /^[\d\s()+-]+$/;
      if (!phoneRegex.test(potentialPhone) || potentialPhone.length < 7) {
          setPhoneError("Please enter a valid phone number.");
          return;
      }
      
      console.log("Phone number submitted:", potentialPhone);
      setSubmittedPhoneNumber(potentialPhone); 
      setMessages(prev => [...prev, {role: 'user', text: `My number is ${potentialPhone}`}]);
      
      // <<< Transition to Enquiry >>>
      setConversationMode('CALLBACK_ENQUIRY'); 
      setMessages(prev => [...prev, { role: 'assistant', text: "Got it. And briefly, what is the call regarding?" }]);
      setPhoneInput(''); // Clear input field
  };

  // <<< Handler for Enquiry Submission >>>
  const handleEnquirySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setEnquiryError(null);
      const potentialEnquiry = enquiryInput.trim();
      if (!potentialEnquiry) {
          setEnquiryError("Please provide a reason for the call.");
          return;
      }
      console.log("Enquiry submitted:", potentialEnquiry);
      setSubmittedEnquiry(potentialEnquiry);
      setMessages(prev => [...prev, {role: 'user', text: `It's regarding: ${potentialEnquiry}`}]);
      // <<< Transition to Date/Time >>>
      setConversationMode('CALLBACK_DATETIME'); 
      setMessages(prev => [...prev, { role: 'assistant', text: "Great, please pick a date for our call." }]);
      setEnquiryInput(''); // Clear input
  };

  const handleDateSubmit = () => {
      if (!selectedDate) {
          toast.error("Please select a date first.");
          return;
      }
      if (!submittedPhoneNumber) {
          toast.error("Error: Phone number was not saved. Please restart the callback process.");
          setConversationMode('INITIAL');
          return;
      }
      
      const formattedDate = format(selectedDate, "PPP");
      console.log("Date selected:", formattedDate);
      
      // <<< Transition to Time Selection >>>
      setMessages(prev => [...prev, {role: 'user', text: `I'd like the call on ${formattedDate}`}]); // Add user confirmation of date
      setConversationMode('CALLBACK_TIME'); 
      // <<< Add bot prompt for time slot >>>
      setMessages(prev => [...prev, { role: 'assistant', text: "Got it. And is morning or afternoon better for the call?" }]); 
      
      // No reset here yet
  };

  // <<< Handler for Time Slot Selection >>>
  const handleTimeSelect = async (slot: { label: string; value: string }) => { 
      // <<< Check for ALL details needed for the final message >>>
      if (!submittedName || !submittedPhoneNumber || !submittedEnquiry || !selectedDate) {
          toast.error("Internal error: Missing some callback details before sending final confirmation.");
          setConversationMode('INITIAL');
          setSubmittedName(null);
          setSubmittedPhoneNumber(null);
          setSubmittedEnquiry(null);
          setSelectedDate(undefined);
          return;
      }

      const formattedDate = format(selectedDate, "PPP"); // Format date here

      // <<< Construct detailed final message >>>
      const finalUserMessage = 
          `${slot.label} works for me. Please schedule the callback with these details: ` +
          `Name: ${submittedName}, Phone: ${submittedPhoneNumber}, Enquiry: ${submittedEnquiry}, ` +
          `Date: ${formattedDate}, Time Slot: ${slot.value}`;
      
      console.log(`[handleTimeSelect] Sending final user confirmation message with details: "${finalUserMessage}"`);

      // Add user message to UI immediately (maybe just the simple part?)
      // Let's show the user only their simple confirmation for better UX
      setMessages(prev => [...prev, {role: 'user', text: `${slot.label} works for me.`}]);
      
      // <<< Trigger Assistant with the DETAILED message >>>
      await establishConversation(finalUserMessage);
      
      // Assistant's response (after function call) will provide final confirmation.

      // <<< Reset frontend state >>> 
      setCallbackFlowCompleted(true); 
      setSelectedDate(undefined);
      setSubmittedName(null); 
      setSubmittedPhoneNumber(null);
      setSubmittedEnquiry(null); 
      setSelectedTimeSlot(null); 
      setConversationMode('FREE_CHAT'); 
  };

  // <<< Handler for starting free chat >>>
  const handleStartFreeChat = () => {
    console.log("Starting Free Chat mode...");
    setConversationMode('FREE_CHAT');
    // Optional: Add a prompt if needed, or just show the input
    // setMessages(prev => [...prev, { role: 'assistant', text: "Sure, what's your question?" }]);
  };

  const handleMinimize = () => setIsMinimized(true);
  const handleMaximize = () => setIsMinimized(false);

  const renderMinimizedWidget = () => (
    <button 
      onClick={handleMaximize}
      className="fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-xl text-[hsl(var(--primary-foreground))] flex items-center justify-center hover:scale-110 transition-transform" 
      style={{ backgroundColor: 'var(--theme-color)' }}
      aria-label="Open Chat"
    >
      <Bot className="h-6 w-6" />
    </button>
  );

  const renderEmailForm = () => (
    <div className="p-4 flex flex-col items-center justify-center h-full">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Welcome!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Please enter your email address to start chatting.
          </p>
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              aria-label="Email Address"
              disabled={isLoading}
            />
            {emailError && (
               <Alert variant="destructive" className="p-2 text-xs">
                   <AlertCircle className="h-3 w-3" />
                   <AlertDescription>{emailError}</AlertDescription>
               </Alert>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading} 
              style={{ backgroundColor: 'var(--theme-color)' }}
            >
              Start Chat
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  // <<< Handler for Category Selection >>>
  const handleCategorySelect = (categoryKey: string) => {
    // <<< Explicitly type the category variable >>>
    const category: CategoryInfo | undefined = productInfo[categoryKey as keyof typeof productInfo];
    
    // Check if category exists
    if (!category) {
      console.error(`Invalid category key selected: ${categoryKey}`);
      return;
    }

    console.log(`[handleCategorySelect] Category selected: ${category.label}`);
    setSelectedCategory(categoryKey);
    setMessages(prev => [...prev, { role: 'user', text: `I'm interested in ${category.label}.` }]);

    // Check if subcategories exist 
    if (category.subcategories && Object.keys(category.subcategories).length > 0) {
      const prompt = category.prompt || `Great! Which type of ${category.label.toLowerCase()} are you looking for?`;
      setMessages(prev => [...prev, { role: 'assistant', text: prompt }]);
      setConversationMode('ENQUIRY_SUBCATEGORY');
    } 
    // No direct resources check needed based on new structure
    else {
      // Fallback if category somehow has no subcategories 
      console.warn(`Category ${categoryKey} has no subcategories defined.`);
      setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I couldn't find specific products for ${category.label}. Is there anything else?` }]);
      setConversationMode('FREE_CHAT');
    }
    logWidgetEvent('button_click', { type: 'category_select', category: categoryKey, label: category.label });
  };

  // <<< Handler for Subcategory Selection >>>
  const handleSubcategorySelect = (subcategoryKey: string) => {
    if (!selectedCategory) {
      console.error("[handleSubcategorySelect] Error: selectedCategory is null.");
      setConversationMode('INITIAL'); // Reset if state is invalid
      return;
    }
    const category = productInfo[selectedCategory];
    const subcategory = category?.subcategories?.[subcategoryKey];

    if (!subcategory) {
      console.error(`[handleSubcategorySelect] Invalid subcategory key: ${subcategoryKey} for category: ${selectedCategory}`);
      setConversationMode('INITIAL'); // Reset
      return;
    }

    console.log(`[handleSubcategorySelect] Subcategory selected: ${subcategory.label}`);
    setSelectedSubcategory(subcategoryKey);

    // Add user message confirmation
    setMessages(prev => [...prev, { role: 'user', text: `Okay, tell me more about ${subcategory.label}.` }]);

    // Use subcategory prompt if available, otherwise default
    const prompt = subcategory.prompt || `Okay, for ${subcategory.label}, which document or action would you like?`;
    setMessages(prev => [...prev, { role: 'assistant', text: prompt }]);

    // Transition to resource selection mode
    setConversationMode('ENQUIRY_RESOURCE');
    logWidgetEvent('button_click', { type: 'subcategory_select', category: selectedCategory, subcategory: subcategoryKey, label: subcategory.label });
  };

  // <<< Update handleResourceSelect >>>
  const handleResourceSelect = (resource: ResourceAction) => {
    logWidgetEvent('button_click', { 
        type: 'resource_select', 
        category: selectedCategory, 
        subcategory: selectedSubcategory, // Added subcategory context
        resource: resource.label, 
        resource_type: resource.type // Renamed label to resource_type for clarity
    });
    console.log(`[handleResourceSelect] Resource selected: ${resource.label}, Type: ${resource.type}, Value: ${resource.value}`);
    setMessages(prev => [...prev, { role: 'user', text: resource.label }]);
    
    let assistantResponse = ""; // Clear default message
    let nextMode: ConversationMode | null = 'FREE_CHAT';

    switch (resource.type) {
      case 'link':
      case 'gallery':
      case 'video':
      case 'price_guide':
        assistantResponse = `Okay, opening the link for: ${resource.label}`;
        if (resource.value && resource.value !== '#') { 
          window.open(resource.value, '_blank');
        } else {
          console.warn(`[handleResourceSelect] Invalid or missing URL for resource: ${resource.label}`);
          assistantResponse = `Sorry, the link for '${resource.label}' seems to be missing or invalid.`;
        }
        break;
      case 'lead_capture_contact':
         assistantResponse = `Okay, I can help with that. Please provide your contact details below.`;
         setLeadCaptureContext(resource.value); // Store the contact request context
         nextMode = 'LEAD_CAPTURE_CONTACT_FORM'; 
         break;
      case 'lead_capture_sample':
          assistantResponse = `Okay, I can help request a sample. Please provide your details and delivery address below.`;
          setLeadCaptureContext(resource.value); // Store the sample request context
          nextMode = 'LEAD_CAPTURE_SAMPLE_FORM'; 
          break;
      default:
        console.warn(`[handleResourceSelect] Unhandled resource type: ${resource.type}`);
        assistantResponse = `Sorry, I'm not sure how to handle '${resource.label}' right now.`;
        nextMode = 'FREE_CHAT';
        break;
    }

    // Add the assistant's response message if one was generated
    if (assistantResponse) {
        setMessages(prev => [...prev, { role: 'assistant', text: assistantResponse }]);
    }

    // Transition state and mode
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    if (nextMode) { // Only transition if nextMode is set
        setConversationMode(nextMode);
    }
  };

  // <<< Handler for "Tell Me More" >>>
  const handleTellMeMore = async () => {
    if (!selectedCategory || !selectedSubcategory) {
      console.error("[handleTellMeMore] Missing category or subcategory state.");
      setConversationMode('INITIAL'); // Reset
      return;
    }
    const subcategory = productInfo[selectedCategory]?.subcategories?.[selectedSubcategory];
    if (!subcategory) {
      console.error("[handleTellMeMore] Could not find subcategory data.");
      setConversationMode('INITIAL'); // Reset
      return;
    }

    const userMessage = `Tell me more about ${subcategory.label}.`;
    console.log(`[handleTellMeMore] Sending message: \"${userMessage}\"`);

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    // Reset enquiry state before sending
    setSelectedCategory(null);
    setSelectedSubcategory(null);

    // Send message to assistant and switch to free chat
    await establishConversation(userMessage);
    setConversationMode('FREE_CHAT');
    logWidgetEvent('button_click', { type: 'tell_me_more', category: selectedCategory, subcategory: selectedSubcategory });
  };

  // <<< Add Lead Capture Submit Handlers >>>
  const handleLeadSubmit = async (type: 'contact' | 'sample') => {
    setLeadDetailsError(null);
    const name = leadNameInput.trim();
    const email = leadEmailInput.trim();
    const phone = leadPhoneInput.trim();
    const address = leadAddressInput.trim();
    const context = leadCaptureContext || (type === 'contact' ? 'General Contact Request' : 'General Sample Request');

    // Basic Validation
    if (!name || !email) {
        setLeadDetailsError("Name and Email are required.");
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setLeadDetailsError("Please enter a valid email address.");
        return;
    }
    if (type === 'sample' && !address) {
        setLeadDetailsError("Delivery address is required for samples.");
        return;
    }
    // Optional: Add phone validation

    // Construct details string for the assistant
    let detailsString = `Type: ${type}, Context: ${context}, Name: ${name}, Email: ${email}`;
    if (phone) detailsString += `, Phone: ${phone}`;
    if (type === 'sample' && address) detailsString += `, Address: ${address}`;
    
    const userMessage = `Okay, here are my details for the ${type} request: ${name}, ${email}${phone ? ", "+phone : ""}${type === 'sample' && address ? ", Address: "+address : ""}. Context: ${context}`; 
    const assistantInstruction = `Please capture the following lead details: ${detailsString}`; // Ask assistant to use capture_lead tool

    console.log(`[handleLeadSubmit] Submitting lead details. User message: "${userMessage}", Assistant instruction: "${assistantInstruction}"`);
    logWidgetEvent('form_submit', { form_type: `lead_capture_${type}`, context });

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    // Clear form and context
    setLeadNameInput('');
    setLeadEmailInput('');
    setLeadPhoneInput('');
    setLeadAddressInput('');
    setLeadCaptureContext(null);
    
    // Send message to assistant to trigger lead capture
    await establishConversation(assistantInstruction);
    setConversationMode('FREE_CHAT'); // Transition back after sending
  };

  const renderChatInterface = () => {
    console.log("[renderChatInterface] Current conversationMode:", conversationMode);
    const currentCategory = selectedCategory ? productInfo[selectedCategory] : null;
    const currentSubcategory = selectedCategory && selectedSubcategory 
                              ? productInfo[selectedCategory]?.subcategories?.[selectedSubcategory] 
                              : null;

    return (
      <>
        <CardContent className="flex-1 overflow-hidden p-0 bg-[hsl(var(--background))] ">
          <ScrollArea className="h-full p-4 custom-scrollbar" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={cn("flex items-start gap-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {/* Assistant Avatar */}
                  {msg.role === 'assistant' ? (
                    <Avatar className="h-7 w-7 border border-muted">
                        <AvatarFallback className="bg-muted"><Bot size={16} /></AvatarFallback>
                    </Avatar>
                  ) : null}

                  {/* Message Bubble */}
                  <div className={cn(
                      "rounded-lg px-4 py-2.5 max-w-[80%] text-sm break-words shadow-sm",
                      msg.role === 'user' && 'text-[hsl(var(--primary-foreground))] rounded-br-none',
                      msg.role === 'assistant' && 'bg-card text-card-foreground border border-border rounded-bl-none',
                      msg.role === 'error' && 'bg-destructive text-destructive-foreground'
                    )}
                    style={msg.role === 'user' ? { backgroundColor: 'var(--theme-color)' } : {}}
                  >
                    {/* Render message content using ReactMarkdown (Simplified) */}
                    <ReactMarkdown>
                        {msg.text}
                    </ReactMarkdown>
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' ? (
                      <Avatar className="h-7 w-7 border border-muted">
                          <AvatarFallback className="bg-muted"><User size={16} /></AvatarFallback>
                      </Avatar>
                  ) : null}
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading ? (
                  <div className="flex items-center justify-start p-2 text-sm text-muted-foreground ml-10">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assistant is thinking...
                  </div>
              ) : null}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-3 border-t flex flex-col items-stretch gap-2.5 bg-card">
          {error && (
            <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* === Flow Content Area === */}
          <div className="w-full">
             {/* Initial Quick Actions */}
            {conversationMode === 'INITIAL' && (
              <div className="flex flex-col space-y-2.5">
                 {/* Primary Button Style */}
                 {!callbackFlowCompleted && (
                   <Button 
                     onClick={handleStartCallbackFlow} 
                     size="lg" 
                     className="w-full text-[hsl(var(--primary-foreground))] rounded-md py-2.5"
                     style={{ backgroundColor: 'var(--theme-color)' }}
                   > 
                      <Phone className="mr-2 h-4 w-4"/> Arrange a Callback
                   </Button>
                 )}
                 {/* Secondary Button Style - Keep restored variant + black text */}
                 <Button 
                   onClick={handleStartEnquiryFlow} 
                   variant="outline" 
                   size="lg" 
                   className="w-full rounded-md py-2.5 border-black text-black hover:bg-accent hover:text-black"
                 >
                   <FileText className="mr-2 h-4 w-4"/> Enquire More About Our Products
                 </Button>
                 {/* Tertiary Button Style */}
                 <Button
                   onClick={handleStartFreeChat}
                   variant="ghost"
                   size="lg"
                   className="text-muted-foreground hover:text-primary"
                 >
                     <MessageSquare className="mr-2 h-4 w-4"/> Or, ask a question...
                 </Button>
              </div>
            )}

            {/* Callback Name Input */}
            {conversationMode === 'CALLBACK_NAME' && (
               <form onSubmit={handleNameSubmit} className="space-y-2">
                   <Input placeholder="Enter your name..." value={nameInput} onChange={(e) => setNameInput(e.target.value)} disabled={isLoading} className="rounded-md" />
                   {nameError && (
                      <Alert variant="destructive" className="p-2 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          <AlertDescription>{nameError}</AlertDescription>
                      </Alert>
                   )}
                   <Button 
                     type="submit" 
                     className="w-full text-[hsl(var(--primary-foreground))] rounded-md py-2.5" 
                     style={{ backgroundColor: 'var(--theme-color)' }}
                     disabled={isLoading}>
                      Submit Name
                   </Button>
               </form>
            )}

            {/* Callback Phone Input */}
            {conversationMode === 'CALLBACK_PHONE' && (
               <form onSubmit={handlePhoneSubmit} className="space-y-2">
                   <Input type="tel" placeholder="Enter your phone number..." value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} disabled={isLoading} className="rounded-md" />
                   {phoneError && (
                      <Alert variant="destructive" className="p-2 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          <AlertDescription>{phoneError}</AlertDescription>
                      </Alert>
                   )}
                   <Button 
                     type="submit" 
                     className="w-full text-[hsl(var(--primary-foreground))] rounded-md py-2.5" 
                     style={{ backgroundColor: 'var(--theme-color)' }}
                     disabled={isLoading}>
                      Submit Phone Number
                   </Button>
               </form>
            )}

             {/* Callback Enquiry Input */}
             {conversationMode === 'CALLBACK_ENQUIRY' && (
               <>
                 <form onSubmit={handleEnquirySubmit} className="space-y-2">
                     <Textarea placeholder="What is the call regarding?" value={enquiryInput} onChange={(e) => setEnquiryInput(e.target.value)} disabled={isLoading} rows={3} className="rounded-md"/>
                     {enquiryError && (
                        <Alert variant="destructive" className="p-2 text-xs">
                            <AlertCircle className="h-3 w-3" />
                            <AlertDescription>{enquiryError}</AlertDescription>
                        </Alert>
                     )}
                     <Button 
                       type="submit" 
                       className="w-full text-[hsl(var(--primary-foreground))] rounded-md py-2.5" 
                       style={{ backgroundColor: 'var(--theme-color)' }}
                       disabled={isLoading}>
                        Submit Enquiry Details
                     </Button>
                 </form>
               </>
            )}

             {/* Callback Date Input */}
             {conversationMode === 'CALLBACK_DATETIME' && (
              <div className="p-3 flex flex-col items-center space-y-3">
                   <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border p-0" disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}/>
                   <Button 
                      onClick={handleDateSubmit} 
                      disabled={!selectedDate || isLoading}
                      className="w-full text-[hsl(var(--primary-foreground))] rounded-md py-2.5"
                      style={{ backgroundColor: 'var(--theme-color)' }}
                  >
                      Confirm Date {selectedDate ? format(selectedDate, "PPP") : ""}
                  </Button>
              </div>
            )}

             {/* Time Slot Buttons - Keep restored variant + black text */} 
             {conversationMode === 'CALLBACK_TIME' && (
                <div className="p-1 flex flex-col space-y-2">
                    {TIME_SLOTS.map((slot) => (
                        <Button 
                            key={slot.value} 
                            variant="outline"
                            onClick={() => handleTimeSelect(slot)}
                            disabled={isLoading}
                            className="w-full rounded-md py-2.5 border-black text-black hover:bg-accent hover:text-black"
                        >
                            {slot.label}
                        </Button>
                    ))}
                </div>
            )}

            {/* === Enquiry Flow UI === */}
            
            {/* Category Selection */} 
            {conversationMode === 'ENQUIRY_CATEGORY' && (
              <div className="p-1 flex flex-col space-y-2">
                {Object.entries(productInfo).map(([key, category]) => (
                   <Button 
                      key={key}
                      variant="outline" 
                      onClick={() => handleCategorySelect(key)} // <<< Connect handler
                      className="w-full rounded-md py-2.5 border-black text-black hover:bg-accent hover:text-black"
                  >
                      {category.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Subcategory Selection */} 
            {conversationMode === 'ENQUIRY_SUBCATEGORY' && currentCategory?.subcategories && (
               <div className="p-1 flex flex-col space-y-2">
                 {Object.entries(currentCategory.subcategories).map(([key, subcat]) => (
                    <Button 
                       key={key}
                       variant="outline" 
                       onClick={() => handleSubcategorySelect(key)} // <<< Connect handler
                       className="w-full rounded-md py-2.5 border-black text-black hover:bg-accent hover:text-black"
                   >
                       {subcat.label}
                   </Button>
                 ))}
               </div>
            )}

            {/* Resource Selection */} 
            {conversationMode === 'ENQUIRY_RESOURCE' && currentSubcategory && (
              <div className="p-1 flex flex-col space-y-2">
                 {/* Display Product Page Link first if available */} 
                 {currentSubcategory.productPageUrl && (
                   <Button 
                     variant="secondary" // Style differently?
                     onClick={() => { 
                       if (currentSubcategory.productPageUrl && currentSubcategory.productPageUrl !== '#') {
                          window.open(currentSubcategory.productPageUrl, '_blank');
                          setMessages(prev => [...prev, { role: 'user', text: `View Product Page (${currentSubcategory.label})` }]);
                          setMessages(prev => [...prev, { role: 'assistant', text: `Okay, opening the product page for ${currentSubcategory.label}.` }]);
                          // Reset state after opening link
                          setSelectedCategory(null);
                          setSelectedSubcategory(null);
                          setConversationMode('FREE_CHAT');
                       } else {
                         console.warn(`[Enquiry Resource] Invalid or missing productPageUrl for: ${currentSubcategory.label}`);
                         setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, the product page link for ${currentSubcategory.label} seems to be missing.` }]);
                       }
                     }} 
                     className="w-full rounded-md py-2.5"
                   >
                     View Product Page
                   </Button>
                 )}
                 {/* Map through resources */} 
                 {Object.entries(currentSubcategory.resources).map(([key, resource]) => (
                   <Button 
                      key={key}
                      variant="outline" 
                      onClick={() => handleResourceSelect(resource)} 
                      className="w-full rounded-md py-2.5 border-black text-black hover:bg-accent hover:text-black"
                  >
                      {resource.label}
                  </Button>
                 ))}
                 {/* <<< Add Tell Me More Button >>> */}
                 <Button
                    variant="ghost"
                    onClick={handleTellMeMore}
                    className="w-full rounded-md py-2.5 text-muted-foreground hover:text-primary"
                >
                    Ask About This Product
                </Button>
              </div>
            )}

            {/* <<< Add Lead Capture Contact Form >>> */}
            {conversationMode === 'LEAD_CAPTURE_CONTACT_FORM' && (
                <form onSubmit={(e) => {e.preventDefault(); handleLeadSubmit('contact'); }} className="space-y-2">
                    <p className="text-sm text-muted-foreground pb-1">Enter contact details for: {leadCaptureContext || 'General Inquiry'}</p>
                    <Input placeholder="Your Name *" value={leadNameInput} onChange={(e) => setLeadNameInput(e.target.value)} disabled={isLoading} className="rounded-md" />
                    <Input type="email" placeholder="Your Email *" value={leadEmailInput} onChange={(e) => setLeadEmailInput(e.target.value)} disabled={isLoading} className="rounded-md" />
                    <Input type="tel" placeholder="Your Phone (Optional)" value={leadPhoneInput} onChange={(e) => setLeadPhoneInput(e.target.value)} disabled={isLoading} className="rounded-md" />
                    {leadDetailsError && (
                      <Alert variant="destructive" className="p-2 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          <AlertDescription>{leadDetailsError}</AlertDescription>
                      </Alert>
                   )}
                   <Button 
                     type="submit" 
                     className="w-full text-[hsl(var(--primary-foreground))] rounded-md py-2.5" 
                     style={{ backgroundColor: 'var(--theme-color)' }}
                     disabled={isLoading}>
                      Submit Contact Request
                   </Button>
               </form>
            )}

            {/* <<< Add Lead Capture Sample Form >>> */}
            {conversationMode === 'LEAD_CAPTURE_SAMPLE_FORM' && (
                 <form onSubmit={(e) => {e.preventDefault(); handleLeadSubmit('sample'); }} className="space-y-2">
                    <p className="text-sm text-muted-foreground pb-1">Enter details for sample request: {leadCaptureContext || 'General Sample'}</p>
                    <Input placeholder="Your Name *" value={leadNameInput} onChange={(e) => setLeadNameInput(e.target.value)} disabled={isLoading} className="rounded-md" />
                    <Input type="email" placeholder="Your Email *" value={leadEmailInput} onChange={(e) => setLeadEmailInput(e.target.value)} disabled={isLoading} className="rounded-md" />
                    <Input type="tel" placeholder="Your Phone (Optional)" value={leadPhoneInput} onChange={(e) => setLeadPhoneInput(e.target.value)} disabled={isLoading} className="rounded-md" />
                    <Textarea placeholder="Delivery Address *" value={leadAddressInput} onChange={(e) => setLeadAddressInput(e.target.value)} disabled={isLoading} rows={3} className="rounded-md"/>
                    {leadDetailsError && (
                      <Alert variant="destructive" className="p-2 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          <AlertDescription>{leadDetailsError}</AlertDescription>
                      </Alert>
                   )}
                   <Button 
                     type="submit" 
                     className="w-full text-[hsl(var(--primary-foreground))] rounded-md py-2.5" 
                     style={{ backgroundColor: 'var(--theme-color)' }}
                     disabled={isLoading}>
                      Submit Sample Request
                   </Button>
               </form>
            )}

          </div>

          {/* === Standard Chat Input === */}
          {conversationMode === 'FREE_CHAT' && (
            <div className="flex w-full items-center space-x-2 pt-1">
              <Input
                type="text"
                placeholder="Type your message..."
                className="flex-1 rounded-md px-3 py-2 border border-border focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="text-[hsl(var(--primary-foreground))] rounded-md w-9 h-9 flex items-center justify-center"
                style={{ backgroundColor: 'var(--theme-color)' }}
              >
                <SendHorizonal className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          )}
        </CardFooter>
      </>
    );
  };

  // --- Main Return Logic ---
  if (isMinimized) {
    return renderMinimizedWidget();
  }

  // <<< Conditionally render based on settings loading state >>>
  if (isLoadingSettings) {
    // Render a loading state BEFORE the main card to prevent flash
    // Adjust size/styling as needed
    return (
       <div className="fixed bottom-4 right-4 z-40 w-96 h-[600px] flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg shadow-xl border border-border">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
       </div>
    );
  }

  // Render error state if settings failed to load
  if (settingsError && !widgetSettings) { // Only show fatal error if settings are truly missing
     return (
       <Card className="fixed bottom-4 right-4 z-40 w-96 shadow-xl rounded-lg flex flex-col h-[600px] font-['Montserrat'] overflow-hidden border border-destructive">
         <CardHeader className="border-b bg-destructive text-destructive-foreground flex flex-row items-center justify-between py-2.5 px-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Error
            </CardTitle>
             <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-destructive-foreground hover:bg-white/20 rounded-full">
                 <X className="h-4 w-4" />
                 <span className="sr-only">Close chat</span>
             </Button>
         </CardHeader>
         <CardContent className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-sm font-medium text-destructive">Failed to Load Widget Configuration</p>
            <p className="text-xs text-muted-foreground mt-1">{settingsError}</p>
            <Button variant="outline" size="sm" onClick={onClose} className="mt-4">
              Close
            </Button>
         </CardContent>
       </Card>
     );
  }
  
  // Render the main widget only if settings are loaded (widgetSettings should not be null here)
  return (
    <Card
      className={`fixed bottom-4 right-4 z-40 w-96 shadow-xl rounded-lg flex flex-col h-[600px] font-['Montserrat'] overflow-hidden border border-border`}
      style={{ 
         '--theme-color': widgetSettings?.theme_color || 'hsl(var(--theme-color-fallback))', 
       } as React.CSSProperties}
    >
      <CardHeader
        className="border-b flex flex-row items-center justify-between py-2.5 px-4 text-[hsl(var(--primary-foreground))]"
        style={{ backgroundColor: 'var(--theme-color)' } as React.CSSProperties}
      >
        <CardTitle className="text-base font-semibold flex items-center gap-2">
           <Bot className="h-5 w-5" />
           How can we help you today? 👋
        </CardTitle>
        <div className="flex items-center space-x-1">
          {/* Minimize Button */} 
          <Button variant="ghost" size="icon" onClick={handleMinimize} className="h-7 w-7 text-[hsl(var(--primary-foreground))] hover:bg-white/20 rounded-full">
            <Minus className="h-4 w-4" />
            <span className="sr-only">Minimize chat</span>
          </Button>
          {/* Close Button */}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-[hsl(var(--primary-foreground))] hover:bg-white/20 rounded-full">
            <X className="h-4 w-4" />
            <span className="sr-only">Close chat</span>
          </Button>
        </div>
      </CardHeader>

      {isLoadingSettings ? (
         <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
      ) : (
        <>
          {showEmailForm ? renderEmailForm() : renderChatInterface()}
        </>
      )}
    </Card>
  );
};

export default ChatWidget; 