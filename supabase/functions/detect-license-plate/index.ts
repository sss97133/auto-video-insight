
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')!;
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')!;

    if (!supabaseUrl || !supabaseKey || !awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const rekognition = new RekognitionClient({
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
      region: "us-east-1"
    });

    const { image_url, camera_id } = await req.json();
    console.log(`Processing image from URL: ${image_url}`);

    if (!image_url) {
      throw new Error('No image URL provided');
    }

    const imageBytes = await downloadImage(image_url);
    console.log('Image downloaded successfully');

    const analysis = await detectVehicleDetails(imageBytes, rekognition);
    console.log('Analysis completed, processing results...');

    // Extract license plate
    const licensePlate = analysis.textDetections
      .filter(text => text.Type === 'LINE')
      .map(text => ({
        text: text.DetectedText,
        confidence: text.Confidence! / 100
      }))
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (!licensePlate) {
      throw new Error('No license plate detected in image');
    }

    // Get vehicle type and measurements
    const vehicleLabel = analysis.labels.find(label => 
      ['Car', 'Automobile', 'Vehicle', 'Transportation'].includes(label.Name!)
    );

    const measurements = vehicleLabel?.BoundingBox ? {
      width: vehicleLabel.BoundingBox.Width,
      height: vehicleLabel.BoundingBox.Height,
      aspect_ratio: vehicleLabel.BoundingBox.Width! / vehicleLabel.BoundingBox.Height!
    } : null;

    // Check for damage
    const damageLabels = analysis.moderationLabels.filter(label => 
      label.Name!.toLowerCase().includes('damage') ||
      label.Name!.toLowerCase().includes('broken') ||
      label.Name!.toLowerCase().includes('accident')
    );

    const damageDetected = damageLabels.length > 0;
    const damageConfidence = damageLabels.length > 0 
      ? Math.max(...damageLabels.map(d => d.Confidence!)) / 100 
      : 0;

    const timestamp = new Date().toISOString();

    // Check if vehicle already exists
    const { data: existingVehicle } = await supabase
      .from('vehicles')
      .select('id, entry_timestamp')
      .eq('license_plate', licensePlate.text)
      .maybeSingle();

    if (existingVehicle) {
      // Update existing vehicle
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          last_seen: timestamp,
          damage_detected: damageDetected,
          damage_confidence: damageConfidence,
          damage_assessment: damageLabels,
          measurements,
          exit_timestamp: timestamp,
          vehicle_type: vehicleLabel?.Name?.toLowerCase() || null,
          image_url
        })
        .eq('id', existingVehicle.id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({
        success: true,
        message: 'Vehicle updated successfully',
        vehicle_id: existingVehicle.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create new vehicle entry
    const { data: newVehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        license_plate: licensePlate.text,
        confidence: licensePlate.confidence,
        vehicle_type: vehicleLabel?.Name?.toLowerCase() || null,
        damage_detected: damageDetected,
        damage_confidence: damageConfidence,
        damage_assessment: damageLabels,
        measurements,
        entry_timestamp: timestamp,
        exit_timestamp: timestamp,
        image_url,
        last_seen: timestamp
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('Vehicle processed successfully:', newVehicle.id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Vehicle processed successfully',
      vehicle_id: newVehicle.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in detect-license-plate function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function downloadImage(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function detectVehicleDetails(imageBytes: Uint8Array, rekognition: RekognitionClient) {
  console.log('Starting vehicle detection analysis...');
  
  // Detect text for license plate
  const textCommand = new DetectTextCommand({
    Image: { Bytes: imageBytes }
  });
  const textResponse = await rekognition.send(textCommand);
  console.log('Text detection completed');

  // Get labels for vehicle measurements and type
  const labelsCommand = new DetectLabelsCommand({
    Image: { Bytes: imageBytes },
    MinConfidence: 80
  });
  const labelsResponse = await rekognition.send(labelsCommand);
  console.log('Label detection completed');

  // Check for damage using content moderation
  const moderationCommand = new DetectModerationLabelsCommand({
    Image: { Bytes: imageBytes },
    MinConfidence: 60
  });
  const moderationResponse = await rekognition.send(moderationCommand);
  console.log('Moderation check completed');

  return {
    textDetections: textResponse.TextDetections || [],
    labels: labelsResponse.Labels || [],
    moderationLabels: moderationResponse.ModerationLabels || []
  };
}
