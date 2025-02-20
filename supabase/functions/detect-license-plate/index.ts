
import { corsHeaders } from "./utils/cors.ts";
import { processImage } from "./handlers/imageProcessor.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Add detailed request logging
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse and validate request
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      throw new Error('Invalid request body');
    }
    
    const { image_url } = body;
    
    if (!image_url) {
      console.error('No image URL provided');
      throw new Error('No image URL provided');
    }

    console.log('Image URL received:', image_url);

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
    // Enhanced error logging
    console.error('Edge function error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });
    
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      stack: error.stack,
      details: error.cause,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
});
