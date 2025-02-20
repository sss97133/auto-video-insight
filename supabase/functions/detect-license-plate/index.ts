
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RekognitionClient, DetectTextCommand, DetectLabelsCommand, DetectModerationLabelsCommand } from "https://esm.sh/@aws-sdk/client-rekognition";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { image_url, camera_id } = await req.json();
    console.log(`Processing image from URL: ${image_url}`);

    if (!image_url) {
      throw new Error('No image URL provided');
    }

    // Download image
    const response = await fetch(image_url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const imageBytes = new Uint8Array(await response.arrayBuffer());
    console.log('Image downloaded successfully');

    // Initialize AWS client
    const rekognition = new RekognitionClient({
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
      region: "us-east-1"
    });

    // Detect text (license plate)
    console.log('Starting text detection...');
    const textCommand = new DetectTextCommand({
      Image: { Bytes: imageBytes }
    });
    const textResponse = await rekognition.send(textCommand);
    console.log('Text detection completed');

    // Get vehicle type and labels
    console.log('Starting label detection...');
    const labelsCommand = new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MinConfidence: 80
    });
    const labelsResponse = await rekognition.send(labelsCommand);
    console.log('Label detection completed');

    // Check for damage
    console.log('Starting moderation check...');
    const moderationCommand = new DetectModerationLabelsCommand({
      Image: { Bytes: imageBytes },
      MinConfidence: 60
    });
    const moderationResponse = await rekognition.send(moderationCommand);
    console.log('Moderation check completed');

    // Process results
    const licensePlate = (textResponse.TextDetections || [])
      .filter(text => text.Type === 'LINE')
      .map(text => ({
        text: text.DetectedText,
        confidence: (text.Confidence || 0) / 100
      }))
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (!licensePlate) {
      throw new Error('No license plate detected in image');
    }

    // Get vehicle type
    const vehicleLabel = (labelsResponse.Labels || []).find(label => 
      ['Car', 'Automobile', 'Vehicle', 'Transportation'].includes(label.Name || '')
    );

    // Process results
    const result = {
      license_plate: licensePlate.text,
      confidence: licensePlate.confidence,
      vehicle_type: vehicleLabel?.Name?.toLowerCase() || null,
      timestamp: new Date().toISOString(),
      camera_id,
      image_url
    };

    console.log('Processing completed successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in detect-license-plate function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
