
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { RekognitionClient, DetectTextCommand, DetectLabelsCommand, DetectModerationLabelsCommand } from "npm:@aws-sdk/client-rekognition"

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

    console.log('Initializing AWS Rekognition client...')
    const rekognition = new RekognitionClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || ''
      }
    })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download image
    console.log('Fetching image from URL:', image_url)
    const imageResponse = await fetch(image_url)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }
    const imageBuffer = await imageResponse.arrayBuffer()

    // Detect text for license plate
    console.log('Detecting text in image...')
    const detectTextCommand = new DetectTextCommand({
      Image: { Bytes: new Uint8Array(imageBuffer) }
    })
    const textDetectionResult = await rekognition.send(detectTextCommand)

    // Detect labels for vehicle attributes
    console.log('Detecting labels for vehicle attributes...')
    const detectLabelsCommand = new DetectLabelsCommand({
      Image: { Bytes: new Uint8Array(imageBuffer) },
      MinConfidence: 50
    })
    const labelsResult = await rekognition.send(detectLabelsCommand)

    // Detect damage using moderation labels
    console.log('Analyzing for vehicle damage...')
    const moderationCommand = new DetectModerationLabelsCommand({
      Image: { Bytes: new Uint8Array(imageBuffer) }
    })
    const moderationResult = await rekognition.send(moderationCommand)

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

    // Process vehicle attributes and damage detection
    const labels = labelsResult.Labels || []
    const detectedAttributes: Record<string, any> = {}
    let vehicleType = null
    let color = null
    let orientation = null
    let qualityScore = 0
    let hasSunroof = false
    let hasSpoiler = false

    // Extract measurements from bounding boxes
    const measurements: Record<string, any> = {}
    labels.forEach(label => {
      if (label.Name && label.Instances && label.Instances.length > 0) {
        const instance = label.Instances[0]
        if (instance.BoundingBox) {
          measurements[label.Name] = {
            width: instance.BoundingBox.Width,
            height: instance.BoundingBox.Height,
            left: instance.BoundingBox.Left,
            top: instance.BoundingBox.Top
          }
        }
      }
    })

    // Process damage detection
    const damageLabels = moderationResult.ModerationLabels || []
    let damageDetected = false
    let damageConfidence = 0
    const damageAssessment: Record<string, any> = {}

    damageLabels.forEach(label => {
      if (label.Name?.toLowerCase().includes('damage') && label.Confidence) {
        damageDetected = true
        damageConfidence = Math.max(damageConfidence, label.Confidence / 100)
        damageAssessment[label.Name] = label.Confidence / 100
      }
    })

    // Process other vehicle attributes
    labels.forEach(label => {
      if (label.Name && label.Confidence) {
        detectedAttributes[label.Name] = label.Confidence / 100

        if (['Sedan', 'SUV', 'Truck', 'Van', 'Coupe', 'Hatchback'].includes(label.Name)) {
          vehicleType = label.Name
        }
        if (label.Name === 'Sunroof') hasSunroof = true
        if (label.Name === 'Spoiler') hasSpoiler = true
        if (['Front View', 'Rear View', 'Side View'].includes(label.Name)) {
          orientation = label.Name
        }
        if (['Black', 'White', 'Red', 'Blue', 'Silver', 'Gray', 'Green', 'Yellow'].includes(label.Name)) {
          color = label.Name
        }
        if (['Clear', 'Sharp', 'Well Lit'].includes(label.Name)) {
          qualityScore = Math.max(qualityScore, label.Confidence / 100)
        }
      }
    })

    const currentTime = new Date().toISOString()

    // Store vehicle information with new fields
    const { data: vehicleData, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .upsert({
        license_plate: bestMatch.text,
        confidence: bestMatch.confidence,
        image_url: image_url,
        detected_at: currentTime,
        last_seen: currentTime,
        vehicle_type: vehicleType,
        color: color,
        orientation: orientation,
        quality_score: qualityScore,
        has_sunroof: hasSunroof,
        has_spoiler: hasSpoiler,
        detected_attributes: detectedAttributes,
        // New fields
        damage_detected: damageDetected,
        damage_assessment: damageAssessment,
        damage_confidence: damageConfidence,
        measurements: measurements,
        entry_timestamp: currentTime, // For new vehicles
        exit_timestamp: null // Will be updated when vehicle exits
      }, {
        onConflict: 'license_plate',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (vehicleError) {
      throw vehicleError
    }

    // Create an alert for damage detection if damage is found
    if (damageDetected) {
      await supabaseAdmin
        .from('alerts')
        .insert({
          message: `Damage detected on vehicle ${bestMatch.text}`,
          alert_type: 'damage_detected',
          severity: 'warning',
          confidence: damageConfidence,
          vehicle_id: vehicleData.id,
          camera_id: camera_id,
          event_type: 'damage_detection',
          event_metadata: {
            damage_assessment: damageAssessment,
            confidence: damageConfidence
          }
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          license_plate: bestMatch.text,
          confidence: bestMatch.confidence,
          vehicle_id: vehicleData.id,
          damage_detected: damageDetected,
          damage_confidence: damageConfidence,
          measurements: measurements,
          vehicle_type: vehicleType,
          color: color,
          orientation: orientation
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing image:', error)
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
