
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { RekognitionService } from "./services/rekognition.ts";
import { ImageProcessor } from "./handlers/imageProcessor.ts";

serve(async (req) => {
  // Add initial request logging
  console.log('Edge function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting edge function execution...');
    
    // Parse request body with detailed logging
    let body;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      body = JSON.parse(text);
      console.log('Parsed request body:', body);
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', details: e.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { image_url } = body;
    if (!image_url) {
      console.error('No image URL provided in request');
      return new Response(
        JSON.stringify({ error: 'No image URL provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('Processing image URL:', image_url);

    // Validate AWS credentials with detailed logging
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    if (!accessKeyId || !secretAccessKey) {
      console.error('Missing AWS credentials');
      return new Response(
        JSON.stringify({ error: 'AWS credentials not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('AWS credentials validated successfully');

    // Download image with improved error handling
    let imageResponse;
    try {
      console.log('Attempting to download image...');
      imageResponse = await fetch(image_url);
      if (!imageResponse.ok) {
        throw new Error(`HTTP error! status: ${imageResponse.status}`);
      }
      console.log('Image downloaded successfully');
    } catch (e) {
      console.error('Failed to download image:', e);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch image', details: e.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert image to bytes with validation
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);
    if (imageBytes.length === 0) {
      console.error('Downloaded image is empty');
      return new Response(
        JSON.stringify({ error: 'Downloaded image is empty' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('Image converted to bytes, size:', imageBytes.length);

    // Initialize services and process image
    console.log('Initializing Rekognition service...');
    const rekognition = new RekognitionService(accessKeyId, secretAccessKey);
    const imageProcessor = new ImageProcessor(rekognition);
    
    console.log('Processing image with Rekognition...');
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
    console.error('Unexpected error in edge function:', error);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error)
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
