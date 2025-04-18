// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck // Basic TS checking, suppress Deno/NPM issues

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "npm:openai@^4.12.4"; // Use the same version as chat-handler

console.log("[manage-assistant] Function initializing...");

// --- Define CORS Headers ---
// Standard CORS headers - Adjust origin in production!
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow requests from any origin (e.g., your frontend localhost or production domain)
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Allow GET (for fetching), POST (for updating), OPTIONS (for preflight)
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", // Headers your frontend might send
};

// --- OpenAI Setup ---
const apiKey = Deno.env.get("OPENAI_API_KEY");
const assistantId = Deno.env.get("OPENAI_ASSISTANT_ID");

if (!apiKey || !assistantId) {
  console.error("[manage-assistant] Missing OpenAI API Key or Assistant ID in secrets!");
  // Optionally throw an error during initialization if critical
}

const openai = new OpenAI({ apiKey });

// --- Main Handler ---
serve(async (req: Request) => {
  const requestTimestamp = new Date().toISOString();
  console.log(`[manage-assistant] Received request at ${requestTimestamp}. Method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[manage-assistant] Responding OK to OPTIONS request.");
    return new Response("ok", { headers: corsHeaders });
  }

  // Secure the function (Optional but recommended: Check user auth if needed)
  // Example: const { user } = await getUserFromRequest(req);
  // if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  // console.log("[manage-assistant] Authorized user:", user.id);

  try {
    console.log("[manage-assistant] Entering main try block.");

    if (!apiKey || !assistantId) {
      throw new Error("Server configuration error: Missing OpenAI credentials.");
    }

    // --- Handle GET Request (Fetch Data) ---
    if (req.method === "GET") {
      console.log(`[manage-assistant] Handling GET request...`);
      // --- Fetch Assistant Details ---
      console.log(`[manage-assistant] Fetching details for Assistant ID: ${assistantId}`);
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      console.log("[manage-assistant] Retrieved Assistant details.");

      let vectorStoreFiles: any[] = [];
      const fileSearchResources = assistant.tool_resources?.file_search;

      // --- Fetch Associated Files (if File Search enabled and Vector Store attached) ---
      if (fileSearchResources && fileSearchResources.vector_store_ids && fileSearchResources.vector_store_ids.length > 0) {
        const vectorStoreId = fileSearchResources.vector_store_ids[0]; // Assuming only one for now
        console.log(`[manage-assistant] Found Vector Store ID: ${vectorStoreId}. Fetching associated files...`);

        // List files associated with the vector store
        // Note: This API might paginate, handle pagination if necessary for > 100 files
        const vsFilesList = await openai.vectorStores.files.list(vectorStoreId, { limit: 100 }); // Get up to 100 files

        // --- Log the raw data structure --- BEGIN
        console.log("[manage-assistant] Raw data from vectorStores.files.list:", JSON.stringify(vsFilesList.data, null, 2));
        // --- Log the raw data structure --- END

        // --- Corrected Mapping ---
        console.log("[manage-assistant] Mapping Vector Store File list...");
        vectorStoreFiles = vsFilesList.data.map(vsFileFromList => {
          // Assume vsFileFromList.id IS the File ID needed for retrieve
          console.log(`[manage-assistant] Mapping file list item - ID: ${vsFileFromList.id}, Status: ${vsFileFromList.status}`);
          return {
            vector_store_file_id: vsFileFromList.id, // The ID of the item in the vector store list
            file_id_to_retrieve: vsFileFromList.id, // <<< ASSUME this is the ID needed for files.retrieve
            vector_store_id: vsFileFromList.vector_store_id,
            status: vsFileFromList.status,
            filename: '(Fetching...)', // Placeholder
          };
        });
        console.log(`[manage-assistant] Mapped ${vectorStoreFiles.length} files for detail fetching.`);

        // --- Corrected Loop ---
        console.log("[manage-assistant] Fetching actual filenames...");
        for (const mappedFile of vectorStoreFiles) {
          // Check if we have an ID to retrieve
          if (!mappedFile.file_id_to_retrieve) {
            console.warn(`[manage-assistant] Skipping file details fetch because file_id_to_retrieve is missing for vector_store_file_id: ${mappedFile.vector_store_file_id}`);
            mappedFile.filename = "(File ID missing)";
            continue;
          }

          try {
            console.log(`[manage-assistant] Attempting openai.files.retrieve with ID: ${mappedFile.file_id_to_retrieve}`);
            // Use the ID we mapped
            const fileDetails = await openai.files.retrieve(mappedFile.file_id_to_retrieve);
            mappedFile.filename = fileDetails.filename;
            console.log(`[manage-assistant] Successfully retrieved filename: ${fileDetails.filename} for ID: ${mappedFile.file_id_to_retrieve}`);
          } catch (fileError) {
            console.error(`[manage-assistant] Failed to retrieve details for file ID ${mappedFile.file_id_to_retrieve}:`, fileError.message, fileError.code);
            // Keep the placeholder or set an error message
            mappedFile.filename = `(Error: ${fileError.code || fileError.message})`;
          }
        }
        console.log("[manage-assistant] Finished fetching filenames.");

        // Clean up the response object structure if needed (optional)
        // Example: Remove file_id_to_retrieve if you don't want it in the final response
        vectorStoreFiles = vectorStoreFiles.map(({ file_id_to_retrieve, ...rest }) => rest);

      } else {
        console.log("[manage-assistant] No File Search Vector Stores found attached to the Assistant.");
      }

      // --- Prepare GET Response ---
      const responseData = {
        id: assistant.id,
        name: assistant.name,
        instructions: assistant.instructions,
        model: assistant.model,
        tools: assistant.tools,
        files: vectorStoreFiles // List of associated files (with filenames if fetched)
      };

      console.log("[manage-assistant] Sending successful GET response.");
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Handle POST Request (Update Instructions) ---
    else if (req.method === "POST") {
      console.log(`[manage-assistant] Handling POST request...`);
      // Parse the request body
      const body = await req.json();
      const newInstructions = body.instructions;

      if (typeof newInstructions !== 'string' || newInstructions.trim() === '') {
        console.error("[manage-assistant] Invalid or missing 'instructions' in POST body");
        return new Response(JSON.stringify({ error: "Invalid request body: 'instructions' field is required and must be a non-empty string." }), {
          status: 400, // Bad Request
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[manage-assistant] Attempting to update Assistant ${assistantId} instructions...`);

      // Call OpenAI API to update the assistant
      const updatedAssistant = await openai.beta.assistants.update(assistantId, {
        instructions: newInstructions,
      });

      console.log(`[manage-assistant] Successfully updated Assistant ${assistantId} instructions.`);

      // Return success response (could return the updated assistant object or just success message)
      return new Response(JSON.stringify({ success: true, instructions: updatedAssistant.instructions }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Handle Other Methods ---
    else {
      console.error(`[manage-assistant] Method Not Allowed: ${req.method}`);
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (error) {
    console.error('[manage-assistant] Error processing request:', error);
    const errorMsg = error.message || "Internal Server Error";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

console.log("[manage-assistant] Function ready.");

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/manage-assistant' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
