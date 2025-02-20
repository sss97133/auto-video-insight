
import { corsHeaders } from "./utils/cors.ts";
import { processImage } from "./handlers/imageProcessor.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse and validate request
    if (!req.body) {
      throw new Error('Request body is empty');
    }

    const body = await req.json();
    console.log('Request body:', body);
    
    const { image_url } = body;
    if (!image_url) {
      throw new Error('No image URL provided');
    }

    // Process the image
    console.log('Starting image processing...');
    const result = await processImage(image_url);
    console.log('Processing result:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    });

  } catch (error) {
    console.error('Edge function error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      details: error.cause || error.stack
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
});
