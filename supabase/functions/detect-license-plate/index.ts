
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
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log request details
    console.log('Processing request...');
    const { image_url } = await req.json();
    
    if (!image_url) {
      console.error('No image URL provided');
      throw new Error('No image URL provided');
    }

    console.log('Image URL:', image_url);

    // Process the image
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
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      stack: error.stack,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
});
