
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { RekognitionService } from "./services/rekognition.ts";
import { ImageProcessor } from "./handlers/imageProcessor.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting edge function...');
    
    // Parse request body
    let body;
    try {
      const text = await req.text();
      body = JSON.parse(text);
      console.log('Request body:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { image_url } = body;
    if (!image_url) {
      console.error('No image URL provided');
      return new Response(
        JSON.stringify({ error: 'No image URL provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('Processing image URL:', image_url);

    // Validate AWS credentials early
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    if (!accessKeyId || !secretAccessKey) {
      console.error('AWS credentials missing');
      return new Response(
        JSON.stringify({ error: 'AWS credentials not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('AWS credentials found');

    // Download image
    let imageResponse;
    try {
      console.log('Downloading image...');
      imageResponse = await fetch(image_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      console.log('Image download successful');
    } catch (e) {
      console.error('Image download failed:', e);
      return new Response(
        JSON.stringify({ error: `Failed to fetch image: ${e.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert image to bytes
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);
    console.log('Image converted to bytes, size:', imageBytes.length);

    // Process image
    const rekognition = new RekognitionService(accessKeyId, secretAccessKey);
    const imageProcessor = new ImageProcessor(rekognition);
    
    const result = await imageProcessor.processImage(imageBytes);
    console.log('Processing completed successfully:', result);

    return new Response(
      JSON.stringify({
        ...result,
        image_url
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

