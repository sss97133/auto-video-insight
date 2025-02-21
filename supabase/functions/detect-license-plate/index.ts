
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { processImage } from "./handlers/imageProcessor.ts";

interface RequestBody {
  image_url: string;
}

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
    // Parse and validate request
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    console.log('Parsing request body...');
    const body = await req.json() as RequestBody;
    
    if (!body.image_url) {
      throw new Error('No image URL provided in request body');
    }

    console.log('Request validation successful, processing image:', {
      url: body.image_url.substring(0, 50) + '...' // Log truncated URL for privacy
    });

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
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    return new Response(JSON.stringify({
      error: error.message,
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
