// deno-lint-ignore-file
// @ts-nocheck // Basic TS checking, suppress Deno/NPM issues

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@^2.0.0";

console.log("[get-widget-settings] Function initializing...");

// --- CORS Headers ---
// Allow requests from any origin (consider restricting in production)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Supabase Client Setup (Anon Key) ---
// Use Anon key as this function should be publicly callable by the widget
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[get-widget-settings] Supabase URL or Anon Key environment variables not set.");
}

serve(async (req: Request) => {
  console.log(`[get-widget-settings] Received request. Method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[get-widget-settings] Responding OK to OPTIONS request.");
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
      console.warn(`[get-widget-settings] Method not allowed: ${req.method}`);
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json", "Allow": "GET" } });
  }

  try {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Server configuration error: Missing Supabase credentials.");
    }

    // Create Supabase client with Anon key for each request
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get identifier from query string parameters
    const url = new URL(req.url);
    const identifier = url.searchParams.get("identifier");

    if (!identifier) {
        console.error("[get-widget-settings] 'identifier' query parameter is missing.");
        return new Response(JSON.stringify({ error: "Missing 'identifier' query parameter" }), {
          status: 400, // Bad Request
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    console.log(`[get-widget-settings] Fetching configuration for identifier: ${identifier}`);

    // Fetch configuration from the database
    const { data, error } = await supabase
        .from('widget_configurations')
        .select('theme_color, initial_message, require_email_first')
        .eq('identifier', identifier)
        .maybeSingle(); // Use maybeSingle() as identifier should be unique

    if (error) {
        console.error(`[get-widget-settings] Database error fetching config for ${identifier}:`, error);
        throw error; // Let the global error handler catch it
    }

    if (!data) {
        console.warn(`[get-widget-settings] No configuration found for identifier: ${identifier}`);
        return new Response(JSON.stringify({ error: `Configuration not found for identifier: ${identifier}` }), {
          status: 404, // Not Found
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    console.log(`[get-widget-settings] Successfully fetched configuration for ${identifier}:`, data);

    // Return the configuration data
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('[get-widget-settings] Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

console.log("[get-widget-settings] Function ready."); 