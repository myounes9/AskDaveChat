// deno-lint-ignore-file
// deno-fmt-ignore-file
// @ts-nocheck // Attempt to disable TS checks for the entire file due to Deno/NPM specifier issues

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "npm:openai@^4.12.4";
import { createClient } from "npm:@supabase/supabase-js@^2.0.0";
import type { OpenAI as OpenAITypes } from "npm:openai@^4.12.4";

console.log("Chat Handler Function Initializing...");

// --- OpenAI Setup ---
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});
const assistantId = Deno.env.get("OPENAI_ASSISTANT_ID");

// --- Supabase Client Setup (Service Role) ---
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase URL or Service Role Key environment variables not set.");
}
if (!assistantId) {
  console.error("OPENAI_ASSISTANT_ID environment variable not set.");
}

const supabaseAdmin = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '');

// Define interface for OpenAI Tool Output
interface ToolOutput {
    tool_call_id: string;
    output: string;
}

// --- Helper: Get Client IP Address ---
const getClientIp = (req: Request): string | null => {
    // Standard headers for client IP, especially behind proxies
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        // The header can contain a comma-separated list, the first is usually the client
        return forwarded.split(',')[0].trim();
    }
    // Deno specific way to get remote address if not behind proxy (might need permission)
    // For Supabase Edge Functions, relying on standard headers is safer.
    // const remoteAddr = (req as any).remoteAddr; 
    // return remoteAddr?.hostname || null;
    return null; // Fallback
};

// <<< START: New GeoIP Helper Function >>>
interface GeoIpResponse {
  status: string;
  message?: string; // Included in case of errors like 'private range'
  countryCode?: string;
  city?: string;
}

const getGeoIpData = async (ipAddress: string | null): Promise<{ countryCode: string | null; city: string | null }> => {
    if (!ipAddress) {
        console.log("[getGeoIpData] No IP address provided.");
        return { countryCode: null, city: null };
    }

    // Avoid lookups for private/internal/localhost IPs
    // Basic check, might need refinement
    if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
        console.log(`[getGeoIpData] Skipping lookup for private/local IP: ${ipAddress}`);
        return { countryCode: null, city: null };
    }

    try {
        const apiUrl = `http://ip-api.com/json/${ipAddress}?fields=status,message,countryCode,city`;
        console.log(`[getGeoIpData] Fetching GeoIP data from: ${apiUrl}`);
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`GeoIP API request failed with status: ${response.status}`);
        }
        const data: GeoIpResponse = await response.json();
        console.log("[getGeoIpData] Received response:", data);

        if (data.status === 'success') {
            return {
                countryCode: data.countryCode || null,
                city: data.city || null,
            };
        } else {
            console.warn(`[getGeoIpData] GeoIP API reported failure for IP ${ipAddress}:`, data.message || 'Unknown reason');
            return { countryCode: null, city: null };
        }
    } catch (error) {
        console.error(`[getGeoIpData] Error fetching or parsing GeoIP data for IP ${ipAddress}:`, error);
        // Don't block conversation creation, just return nulls
        return { countryCode: null, city: null };
    }
};
// <<< END: New GeoIP Helper Function >>>

// --- Helper: Get or Create Conversation (Modified for GeoIP) ---
const getOrCreateConversation = async (
    threadId: string, 
    metadataToSet: { 
        userEmail?: string | null;
        channel?: string | null;
        startUrl?: string | null;
        ipAddress?: string | null;
        userAgent?: string | null;
        userId?: string | null;
    }
) => {
  // Attempt to find existing first
  let { data: conversation, error: findError } = await supabaseAdmin
    .from('conversations')
    .select('id') 
    .eq('thread_id', threadId)
    .maybeSingle();

  if (findError) {
      console.error(`[getOrCreateConversation] Error finding conversation for thread ${threadId}:`, findError);
      throw findError;
  }

  if (conversation) {
    console.log(`[getOrCreateConversation] Found existing conversation ID: ${conversation.id} for thread ${threadId}`);
    return conversation.id;
  } else {
    // Conversation not found, create it
    console.log(`[getOrCreateConversation] Conversation for thread ${threadId} not found. Performing GeoIP lookup...`);
    
    // <<< Call GeoIP Lookup >>>
    const geoData = await getGeoIpData(metadataToSet.ipAddress);
    console.log(`[getOrCreateConversation] GeoIP lookup result for IP ${metadataToSet.ipAddress}:`, geoData);

    console.log(`[getOrCreateConversation] Creating conversation with metadata:`, metadataToSet, `and GeoData:`, geoData);
    const { data: newConversation, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
          thread_id: threadId, 
          metadata: metadataToSet.userEmail ? { userEmail: metadataToSet.userEmail } : null, 
          channel: metadataToSet.channel,
          start_url: metadataToSet.startUrl,
          ip_address: metadataToSet.ipAddress,
          user_agent: metadataToSet.userAgent,
          user_id: metadataToSet.userId,
          // <<< Add GeoIP data >>>
          country_code: geoData.countryCode,
          city: geoData.city
       })
      .select('id') 
      .single();

    if (createError) {
        console.error(`[getOrCreateConversation] Error creating conversation for thread ${threadId}:`, createError);
        throw createError;
    }
    if (!newConversation) throw new Error('Failed to create conversation record.');
    
    console.log(`[getOrCreateConversation] Created conversation with ID: ${newConversation.id}`);
    return newConversation.id;
  }
};

// --- Helper: Log Message ---
const logMessage = async (
  conversationId: string,
  role: string,
  content: string,
  runId: string | null = null,
  metadata: Record<string, any> | null = null
) => {
  console.log(`[logMessage] Attempting to log role=${role} for conversation ${conversationId}`);
  const { error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: role,
      content: content,
      run_id: runId,
      metadata: metadata
    });
  if (error) {
    console.error("[logMessage] Error during insert:", error);
  } else {
    console.log(`[logMessage] Successfully logged role=${role} for conversation ${conversationId}`);
  }
};

// <<< Function to handle scheduling callback >>>
const handleScheduleCallback = async (
  args: any,
  conversationId: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const { name, phone_number, enquiry_matter, callback_date, callback_time_slot } = args;
    console.log(`[handleScheduleCallback] Args received:`, args);
    if (!name || !phone_number || !enquiry_matter || !callback_date || !callback_time_slot) {
      throw new Error("Missing required fields for scheduling callback.");
    }
    
    console.log(`[handleScheduleCallback] Attempting to upsert lead for conversation ${conversationId}`);
    const leadData = {
        conversation_id: conversationId,
        name: name,
        phone: phone_number,
        enquiry_matter: enquiry_matter,
        callback_date: callback_date,
        callback_time_slot: callback_time_slot,
        // Status defaults to 'new' or keeps existing if updating
    };

    const { error: upsertError } = await supabaseAdmin
        .from('leads')
        .upsert(leadData, { onConflict: 'conversation_id' });

    if (upsertError) {
        console.error("[handleScheduleCallback] Error during upsert:", upsertError);
        throw upsertError;
    }

    console.log(`[handleScheduleCallback] Successfully saved callback details for conversation ${conversationId}`);
    // Maybe return specific confirmation details?
    return { success: true, message: `Callback scheduled successfully for ${name} on ${callback_date} (${callback_time_slot}). We will call ${phone_number}.` };

  } catch (error) {
    console.error("[handleScheduleCallback] Caught error:", error);
    return { success: false, error: error.message || "Failed to schedule callback." };
  }
};

// --- Helper: Handle Lead Capture (Modified - Add Default Status & userId) ---
const handleLeadCapture = async (
  args: any,
  conversationId: string,
  userId: string | null
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const { name, email, phone, interest } = args;
    console.log(`Capturing lead: Email=${email}, Name=${name}, Interest=${interest}, Phone=${phone}`);
    if (!email || !interest) throw new Error("Missing required fields: email and interest.");
    console.log(`[handleLeadCapture] Attempting to insert lead for conversation ${conversationId}, userId=${userId}`);
    const { error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({ 
          name, 
          email, 
          phone, 
          interest, 
          conversation_id: conversationId, 
          raw_data: args, 
          status: 'new', // Set default status on insert
          user_id: userId
       });
    if (insertError) {
        console.error("[handleLeadCapture] Error during insert:", insertError);
        throw insertError;
    }
    console.log(`[handleLeadCapture] Successfully inserted lead for conversation ${conversationId}`);
    return { success: true, message: "Lead details saved successfully." };
  } catch (error) {
    console.error("[handleLeadCapture] Caught error:", error);
    return { success: false, error: error.message || "Failed to save lead details." };
  }
};

// --- Regex for Citations ---
const citationRegex = /\s*【[^】†]+†source】/g;

// --- Main Request Handler (Modified) ---
serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json", "Allow": "POST" } });

  let conversationId: string | null = null;
  let currentThreadId: string | null = null;

  try {
    // Destructure new fields from request body
    const { message, threadId: existingThreadId, userEmail, startUrl, channel, userId } = await req.json();
    currentThreadId = existingThreadId;

    // Get IP and User Agent from headers
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get('user-agent');

    // --- Input Validation ---
    if (!message || typeof message !== 'string') throw new Error("Message is required and must be a string");
    // Optional: Add validation for channel/startUrl if needed
    if (currentThreadId && typeof currentThreadId !== 'string') throw new Error("threadId must be a string if provided");
    if (!assistantId || !supabaseUrl || !supabaseServiceKey) throw new Error("Server configuration error: Missing critical environment variables.");

    console.log(`Received message: "${message}", Thread ID: ${currentThreadId || 'New'}, User Email: ${userEmail || 'N/A'}, Start URL: ${startUrl || 'N/A'}, Channel: ${channel || 'N/A'}`);
    console.log(`Client IP: ${clientIp || 'N/A'}, User Agent: ${userAgent || 'N/A'}`);

    // --- OpenAI Interaction ---
    // 1. Get or Create Thread
    if (!currentThreadId) {
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
      console.log(`Created new thread with ID: ${currentThreadId}`);
    }
    if (!currentThreadId) throw new Error("Failed to get or create a thread ID.");

    // 2. Get or Create Conversation Record in DB (Pass all initial metadata)
    const initialMetadata = {
        userEmail: userEmail,
        channel: channel,
        startUrl: startUrl,
        ipAddress: clientIp,
        userAgent: userAgent,
        userId: userId
    };
    conversationId = await getOrCreateConversation(currentThreadId, initialMetadata);
    if (!conversationId) throw new Error("Failed to get or create a conversation ID.");

    // 3. Log User Message
    await logMessage(conversationId, 'user', message);

    // 4. Add the user's message to the thread
    await openai.beta.threads.messages.create(currentThreadId, { role: 'user', content: message });
    console.log(`Added message to thread ${currentThreadId}`);

    // 5. Create the Run
    let run = await openai.beta.threads.runs.create(currentThreadId, { assistant_id: assistantId });
    console.log(`Run created with ID: ${run.id} for thread ${currentThreadId}`);

    // 6. Poll Run Status and Handle Actions
    while (['queued', 'in_progress', 'requires_action'].includes(run.status)) {
        run = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
        console.log(`Run status: ${run.status}`);

        if (run.status === 'requires_action') {
            console.log(`[MainHandler] Entering requires_action block for run ${run.id}`);
            const requiredAction = run.required_action;
            if (!requiredAction || requiredAction.type !== 'submit_tool_outputs') {
                throw new Error('Unexpected required action type');
            }
            const toolOutputs: ToolOutput[] = [];
            for (const toolCall of requiredAction.submit_tool_outputs.tool_calls) {
                let output: any = { success: false, error: 'Function not implemented' };
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
                console.log(`[MainHandler] Processing tool call: ${functionName}`, functionArgs);
                
                // <<< Add handling for schedule_callback >>>
                if (functionName === 'capture_lead') {
                   console.log(`[MainHandler] Calling handleLeadCapture for tool call ${toolCall.id}`);
                   output = await handleLeadCapture(functionArgs, conversationId, userId);
                   console.log(`[MainHandler] Result from handleLeadCapture:`, output);
                } else if (functionName === 'schedule_callback') { 
                   console.log(`[MainHandler] Calling handleScheduleCallback for tool call ${toolCall.id}`);
                   // Pass conversationId (UUID), userId is not needed for the upsert here
                   output = await handleScheduleCallback(functionArgs, conversationId);
                   console.log(`[MainHandler] Result from handleScheduleCallback:`, output);
                } else {
                   console.warn(`Unhandled function call: ${functionName}`);
                   output = { success: false, error: `Function '${functionName}' is not handled by the backend.` };
                }
                toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify(output), // Send back result to Assistant
                });
            }
            console.log(`[MainHandler] Submitting tool outputs:`, toolOutputs);
            run = await openai.beta.threads.runs.submitToolOutputs(currentThreadId, run.id, {
                tool_outputs: toolOutputs,
            });
            console.log(`[MainHandler] Run status after submitting outputs: ${run.status}`);
        } else if (['queued', 'in_progress'].includes(run.status)){
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
             break; 
        }
    }

    // 7. Handle Final Run Status (Completed or Failed)
    if (run.status !== 'completed') {
        const errorMessage = run.last_error ? run.last_error.message : 'Run did not complete successfully';
        console.error(`Run failed or ended unexpectedly for thread ${currentThreadId}. Status: ${run.status}`);
        if (run.last_error) console.error('Run Error Details:', run.last_error);
        console.error(`[MainHandler] Final Run Status NOT COMPLETED: ${run.status}`);
        await logMessage(conversationId, 'error', `Run failed: ${errorMessage}`, run.id);
        throw new Error(`Run failed: ${errorMessage}`);
    } else {
         console.log(`[MainHandler] Final Run Status COMPLETED for thread ${currentThreadId}`);
        // 8. Retrieve and Process Final Messages
        const threadMessagesPage = await openai.beta.threads.messages.list(
            currentThreadId,
            {
                order: 'desc',
                limit: 10 // Fetch recent messages
            }
        );

        console.log(`[Messages] Retrieved ${threadMessagesPage.data.length} messages (desc order). Filtering for current run (${run.id})...`);

        // Filter messages: find the first assistant message belonging to this run
        const latestAssistantMessage = threadMessagesPage.data.find(
            (msg) => msg.run_id === run.id && msg.role === 'assistant'
        );

        if (latestAssistantMessage) {
            console.log(`[Messages] Found assistant message ${latestAssistantMessage.id} for run ${run.id}.`);
            // Extract text content - assuming text for now
            const textContents = latestAssistantMessage.content
                .filter((contentBlock: any) => contentBlock.type === 'text')
                .map((contentBlock: any) => contentBlock.text.value)
                .join('\n'); 
            
            if (textContents) {
                 // Log the full assistant message before stripping citations
                 await logMessage(conversationId, 'assistant', textContents, run.id, { citations: latestAssistantMessage.content[0]?.text?.annotations });

                 // Prepare for response, strip citations
                 const cleanText = textContents.replace(citationRegex, '').trim();
                 if (cleanText) {
                     const assistantMessages: { role: 'assistant'; text: string }[] = [{ role: 'assistant', text: cleanText }];
                     console.log(`Logged and sending ${assistantMessages.length} processed assistant message(s) for thread ${currentThreadId}`);

                     // --- Success Response ---
                     return new Response(
                       JSON.stringify({
                          messages: assistantMessages, 
                          threadId: currentThreadId,
                          conversationId: conversationId
                       }),
                       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                     );
                 }
            } else {
                console.log(`[Messages] Assistant message ${latestAssistantMessage.id} found, but has no text content.`);
            }
        } else {
            console.log(`[Messages] No assistant message found specifically for run ID ${run.id} in the latest batch.`);
            // This can happen if the run completed but only involved function calls or no output
        }
    }

  } catch (error) {
    console.error('[GLOBAL ERROR] Error processing request:', error);
    if (conversationId) {
        await logMessage(conversationId, 'error', `Server Error: ${error.message}`);
    }
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

console.log("Chat Handler Function Ready (with enhanced conversation metadata).");

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/chat-handler' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
