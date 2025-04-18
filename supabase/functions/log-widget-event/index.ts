// deno-lint-ignore-file
// @ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@^2.0.0";

console.log("[log-widget-event] Function initializing...");

// --- CORS Headers ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Restrict in production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Supabase Client Setup (Service Role) ---
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[log-widget-event] Supabase URL or Service Role Key environment variables not set.");
}

serve(async (req: Request) => {
  console.log(`[log-widget-event] Received request. Method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[log-widget-event] Responding OK to OPTIONS request.");
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json", "Allow": "POST" } });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Server configuration error: Missing Supabase service credentials.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get data from request body
    const { conversationId, threadId, eventType, eventDetails } = await req.json();

    // Basic validation
    if (!eventType || typeof eventType !== 'string') {
      throw new Error("Missing or invalid 'eventType' in request body.");
    }
    // eventDetails can be anything (JSONB)
    // conversationId and threadId can be null initially

    console.log(`[log-widget-event] Logging event: Type=${eventType}, ConvID=${conversationId}, ThreadID=${threadId}`, eventDetails);

    // Insert event into the database
    const { error } = await supabaseAdmin
      .from('widget_events')
      .insert({
        conversation_id: conversationId, // Can be null
        thread_id: threadId,           // Can be null
        event_type: eventType,
        event_details: eventDetails ?? {}
      });

    if (error) {
      console.error(`[log-widget-event] Database error inserting event:`, error);
      throw error;
    }

    console.log(`[log-widget-event] Successfully logged event: ${eventType}`);

    // Return success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('[log-widget-event] Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: error instanceof Error && error.message.includes('eventType') ? 400 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

console.log("[log-widget-event] Function ready."); 