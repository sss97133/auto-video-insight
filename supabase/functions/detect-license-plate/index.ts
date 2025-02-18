
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { RekognitionClient, DetectTextCommand, DetectLabelsCommand } from "npm:@aws-sdk/client-rekognition"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { image_url, camera_id } = await req.json()

    if (!image_url) {
      throw new Error('No image URL provided')
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download image from Supabase Storage
    const imageResponse = await fetch(image_url)
    const imageBuffer = await imageResponse.arrayBuffer()

    // Initialize AWS Rekognition client with explicit region and credentials
    const rekognition = new RekognitionClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    })

    console.log('AWS Credentials loaded:', {
      hasAccessKey: !!Deno.env.get('AWS_ACCESS_KEY_ID'),
      hasSecretKey: !!Deno.env.get('AWS_SECRET_ACCESS_KEY')
    })

    // Detect text for license plate
    const detectTextCommand = new DetectTextCommand({
      Image: {
        Bytes: new Uint8Array(imageBuffer)
      }
    })

    const textDetectionResult = await rekognition.send(detectTextCommand)
    
    // Detect labels for vehicle attributes
    const detectLabelsCommand = new DetectLabelsCommand({
      Image: {
        Bytes: new Uint8Array(imageBuffer)
      },
      MinConfidence: 50
    })

    const labelsResult = await rekognition.send(detectLabelsCommand)
    
    // Process license plate detection
    let bestMatch = null
    let highestConfidence = 0
    const licensePlatePattern = /^[A-Z0-9]{5,8}$/

    textDetectionResult.TextDetections?.forEach((detection) => {
      if (detection.Type === 'LINE' && detection.Confidence && detection.DetectedText) {
        const text = detection.DetectedText.replace(/\s/g, '')
        if (licensePlatePattern.test(text) && detection.Confidence > highestConfidence) {
          bestMatch = {
            text: text,
            confidence: detection.Confidence / 100
          }
          highestConfidence = detection.Confidence
        }
      }
    })

    if (!bestMatch) {
      throw new Error('No license plate detected in the image')
    }

    // Process vehicle attributes from labels
    const labels = labelsResult.Labels || []
    const detectedAttributes: Record<string, any> = {}
    let vehicleType = null
    let color = null
    let orientation = null
    let qualityScore = 0
    let hasSunroof = false
    let hasSpoiler = false

    labels.forEach(label => {
      if (label.Name && label.Confidence) {
        detectedAttributes[label.Name] = label.Confidence / 100

        // Determine vehicle type
        if (['Sedan', 'SUV', 'Truck', 'Van', 'Coupe', 'Hatchback'].includes(label.Name)) {
          vehicleType = label.Name
        }

        // Check for specific features
        if (label.Name === 'Sunroof') hasSunroof = true
        if (label.Name === 'Spoiler') hasSpoiler = true

        // Detect orientation
        if (['Front View', 'Rear View', 'Side View'].includes(label.Name)) {
          orientation = label.Name
        }

        // Detect colors
        if (['Black', 'White', 'Red', 'Blue', 'Silver', 'Gray', 'Green', 'Yellow'].includes(label.Name)) {
          color = label.Name
        }

        // Update quality score based on image quality labels
        if (['Clear', 'Sharp', 'Well Lit'].includes(label.Name)) {
          qualityScore = Math.max(qualityScore, label.Confidence / 100)
        }
      }
    })

    console.log('Detected vehicle attributes:', {
      license_plate: bestMatch.text,
      vehicle_type: vehicleType,
      color,
      orientation,
      quality_score: qualityScore,
      has_sunroof: hasSunroof,
      has_spoiler: hasSpoiler,
      detected_attributes: detectedAttributes
    })

    // Store the vehicle information in the database
    const { data: vehicleData, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .upsert({
        license_plate: bestMatch.text,
        confidence: bestMatch.confidence,
        image_url: image_url,
        detected_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        vehicle_type: vehicleType,
        color: color,
        orientation: orientation,
        quality_score: qualityScore,
        has_sunroof: hasSunroof,
        has_spoiler: hasSpoiler,
        detected_attributes: detectedAttributes
      }, {
        onConflict: 'license_plate',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (vehicleError) {
      throw vehicleError
    }

    // Create an alert for the detected vehicle
    const { error: alertError } = await supabaseAdmin
      .from('alerts')
      .insert({
        message: `License plate ${bestMatch.text} detected`,
        alert_type: 'vehicle_detected',
        severity: 'info',
        confidence: bestMatch.confidence,
        vehicle_id: vehicleData.id,
        camera_id: camera_id,
        event_type: 'license_plate_detection',
        event_metadata: {
          license_plate: bestMatch.text,
          confidence: bestMatch.confidence,
          image_url: image_url,
          vehicle_type: vehicleType,
          color: color
        }
      })

    if (alertError) {
      throw alertError
    }

    // Log analytics event
    const { error: analyticsError } = await supabaseAdmin
      .from('analytics')
      .insert({
        event_type: 'license_plate_detection',
        camera_id: camera_id,
        vehicle_id: vehicleData.id,
        event_data: {
          license_plate: bestMatch.text,
          confidence: bestMatch.confidence,
          image_url: image_url,
          vehicle_attributes: {
            type: vehicleType,
            color: color,
            orientation: orientation,
            quality_score: qualityScore,
            has_sunroof: hasSunroof,
            has_spoiler: hasSpoiler
          }
        }
      })

    if (analyticsError) {
      throw analyticsError
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          license_plate: bestMatch.text,
          confidence: bestMatch.confidence,
          vehicle_id: vehicleData.id,
          vehicle_type: vehicleType,
          color: color,
          orientation: orientation,
          quality_score: qualityScore,
          has_sunroof: hasSunroof,
          has_spoiler: hasSpoiler
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
