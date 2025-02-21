
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { processImage } from "./handlers/imageProcessor.ts";

serve(async (req) => {
  console.log('Function started:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    const body = await req.json();
    console.log('Request body:', body);

    if (!body.image_url) {
      throw new Error('No image URL provided');
    }

    // Process image
    const result = await processImage(body.image_url);
    console.log('Processing complete, returning result:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    });

  } catch (error) {
    console.error('Function error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error?.cause
    });
    
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: error.message.includes('No valid license plate') ? 400 : 500,
    });
  }
});

