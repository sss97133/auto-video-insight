
import { RekognitionClient, DetectTextCommand, DetectLabelsCommand, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')!;
const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);
const rekognition = new RekognitionClient({
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
  region: "us-east-1"
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function downloadImage(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function detectVehicleDetails(imageBytes: Uint8Array) {
  // Detect text for license plate
  const textCommand = new DetectTextCommand({
    Image: { Bytes: imageBytes }
  });
  const textResponse = await rekognition.send(textCommand);

  // Get labels for vehicle measurements and type
  const labelsCommand = new DetectLabelsCommand({
    Image: { Bytes: imageBytes },
    MinConfidence: 80
  });
  const labelsResponse = await rekognition.send(labelsCommand);

  // Check for damage using content moderation
  const moderationCommand = new DetectModerationLabelsCommand({
    Image: { Bytes: imageBytes },
    MinConfidence: 60
  });
  const moderationResponse = await rekognition.send(moderationCommand);

  return {
    textDetections: textResponse.TextDetections || [],
    labels: labelsResponse.Labels || [],
    moderationLabels: moderationResponse.ModerationLabels || []
  };
}

function extractVehicleMeasurements(labels: any[]) {
  const vehicleLabel = labels.find(label => 
    label.Name === 'Car' || 
    label.Name === 'Automobile' || 
    label.Name === 'Vehicle'
  );

  if (vehicleLabel && vehicleLabel.BoundingBox) {
    const { Width, Height } = vehicleLabel.BoundingBox;
    return {
      width: Width,
      height: Height,
      aspect_ratio: Width / Height
    };
  }

  return null;
}

function detectDamage(moderationLabels: any[]) {
  const damageIndicators = moderationLabels.filter(label => 
    label.Name.toLowerCase().includes('damage') ||
    label.Name.toLowerCase().includes('broken') ||
    label.Name.toLowerCase().includes('accident')
  );

  if (damageIndicators.length > 0) {
    return {
      damage_detected: true,
      damage_confidence: Math.max(...damageIndicators.map(d => d.Confidence)) / 100,
      damage_details: damageIndicators.map(d => ({
        type: d.Name,
        confidence: d.Confidence / 100
      }))
    };
  }

  return {
    damage_detected: false,
    damage_confidence: 0,
    damage_details: []
  };
}

function extractLicensePlate(textDetections: any[]) {
  const potentialPlates = textDetections
    .filter(text => text.Type === 'LINE')
    .map(text => ({
      text: text.DetectedText,
      confidence: text.Confidence / 100,
      boundingBox: text.Geometry.BoundingBox
    }))
    .sort((a, b) => b.confidence - a.confidence);

  return potentialPlates[0] || null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url, camera_id } = await req.json();
    console.log(`Processing image from URL: ${image_url}`);

    const imageBytes = await downloadImage(image_url);
    const analysis = await detectVehicleDetails(imageBytes);
    
    console.log('Analysis completed, processing results...');

    // Extract license plate
    const licensePlate = extractLicensePlate(analysis.textDetections);
    if (!licensePlate) {
      throw new Error('No license plate detected in image');
    }

    // Get measurements
    const measurements = extractVehicleMeasurements(analysis.labels);
    
    // Check for damage
    const damageAssessment = detectDamage(analysis.moderationLabels);

    // Determine vehicle type and attributes
    const vehicleLabels = analysis.labels.filter(label => 
      ['Car', 'Truck', 'SUV', 'Van', 'Sedan', 'Coupe'].includes(label.Name)
    );

    const vehicleType = vehicleLabels[0]?.Name.toLowerCase() || null;
    const quality_score = licensePlate.confidence;

    // Get current timestamp
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
          quality_score,
          damage_detected: damageAssessment.damage_detected,
          damage_assessment: damageAssessment,
          measurements,
          exit_timestamp: timestamp, // Update exit time on each detection
          vehicle_type: vehicleType
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
        vehicle_type: vehicleType,
        quality_score,
        damage_detected: damageAssessment.damage_detected,
        damage_assessment: damageAssessment,
        measurements,
        entry_timestamp: timestamp,
        exit_timestamp: timestamp,
        image_url,
        last_seen: timestamp
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Create analytics event for new vehicle
    await supabase.from('analytics').insert({
      event_type: 'vehicle_detected',
      camera_id,
      vehicle_id: newVehicle.id,
      event_data: {
        license_plate: licensePlate.text,
        damage_detected: damageAssessment.damage_detected,
        vehicle_type: vehicleType
      }
    });

    // If damage is detected, create an alert
    if (damageAssessment.damage_detected) {
      await supabase.from('alerts').insert({
        vehicle_id: newVehicle.id,
        camera_id,
        alert_type: 'damage_detected',
        event_type: 'suspicious_vehicle',
        severity: damageAssessment.damage_confidence > 0.8 ? 'high' : 'medium',
        message: `Vehicle damage detected on ${licensePlate.text}`,
        confidence: damageAssessment.damage_confidence,
        event_metadata: damageAssessment
      });
    }

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
