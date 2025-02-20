
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
    const { image_url } = await req.json();
    if (!image_url) {
      throw new Error('No image URL provided');
    }
    console.log('Processing image URL:', image_url);

    // Download image with error handling
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);
    console.log('Image downloaded successfully, size:', imageBytes.length);

    // Validate AWS credentials
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not configured');
    }

    // Initialize AWS client
    const rekognition = new RekognitionClient({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region: "us-east-1"
    });

    // Detect text (license plate) with error handling
    console.log('Starting text detection...');
    const textCommand = new DetectTextCommand({
      Image: { Bytes: imageBytes }
    });
    
    const textResponse = await rekognition.send(textCommand);
    console.log('Text detection response:', JSON.stringify(textResponse, null, 2));

    if (!textResponse.TextDetections || textResponse.TextDetections.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text detected in image' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get vehicle type and labels with error handling
    console.log('Starting label detection...');
    const labelsCommand = new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MinConfidence: 80
    });
    
    const labelsResponse = await rekognition.send(labelsCommand);
    console.log('Label detection response:', JSON.stringify(labelsResponse, null, 2));

    // Process results
    const licensePlate = textResponse.TextDetections
      .filter(text => text.Type === 'LINE')
      .map(text => ({
        text: text.DetectedText,
        confidence: text.Confidence ? text.Confidence / 100 : 0
      }))
      .sort((a, b) => b.confidence - a.confidence)[0];

    // Get vehicle type
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
    console.error('Error in detect-license-plate function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
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
