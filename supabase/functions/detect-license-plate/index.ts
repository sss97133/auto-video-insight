
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RekognitionClient, DetectTextCommand, DetectLabelsCommand } from "https://esm.sh/@aws-sdk/client-rekognition";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting edge function...');
    
    // Validate request body
    let body;
    try {
      body = await req.json();
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
      console.error('No image URL provided in request body');
      return new Response(
        JSON.stringify({ error: 'No image URL provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('Processing image URL:', image_url);

    // Test AWS credentials
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
    console.log('AWS credentials found');

    // Download image with error handling
    let imageResponse;
    try {
      console.log('Attempting to download image...');
      imageResponse = await fetch(image_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      console.log('Image downloaded successfully');
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

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);
    console.log('Image converted to bytes, size:', imageBytes.length);

    // Initialize AWS client
    console.log('Initializing AWS Rekognition client...');
    const rekognition = new RekognitionClient({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region: "us-east-1"
    });

    // Detect text (license plate)
    console.log('Starting text detection...');
    let textResponse;
    try {
      const textCommand = new DetectTextCommand({
        Image: { Bytes: imageBytes }
      });
      textResponse = await rekognition.send(textCommand);
      console.log('Text detection successful:', JSON.stringify(textResponse.TextDetections, null, 2));
    } catch (e) {
      console.error('Text detection failed:', e);
      return new Response(
        JSON.stringify({ error: `Text detection failed: ${e.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!textResponse.TextDetections || textResponse.TextDetections.length === 0) {
      console.log('No text detected in image');
      return new Response(
        JSON.stringify({ error: 'No text detected in image' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Detect labels
    console.log('Starting label detection...');
    let labelsResponse;
    try {
      const labelsCommand = new DetectLabelsCommand({
        Image: { Bytes: imageBytes },
        MinConfidence: 80
      });
      labelsResponse = await rekognition.send(labelsCommand);
      console.log('Label detection successful:', JSON.stringify(labelsResponse.Labels, null, 2));
    } catch (e) {
      console.error('Label detection failed:', e);
      return new Response(
        JSON.stringify({ error: `Label detection failed: ${e.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process results
    const licensePlate = textResponse.TextDetections
      .filter(text => text.Type === 'LINE')
      .map(text => ({
        text: text.DetectedText,
        confidence: text.Confidence ? text.Confidence / 100 : 0
      }))
      .sort((a, b) => b.confidence - a.confidence)[0];

    const vehicleLabel = labelsResponse.Labels?.find(label => 
      ['Car', 'Automobile', 'Vehicle', 'Transportation'].includes(label.Name || '')
    );

    const result = {
      license_plate: licensePlate?.text || '',
      confidence: licensePlate?.confidence || 0,
      vehicle_type: vehicleLabel?.Name?.toLowerCase() || 'unknown',
      timestamp: new Date().toISOString(),
      image_url
    };

    console.log('Processing completed successfully:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Unexpected error in detect-license-plate function:', error);
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
