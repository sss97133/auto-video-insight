
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { S3, Rekognition } from "https://esm.sh/@aws-sdk/client-rekognition@3.540.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { image_url, camera_id } = await req.json()

    if (!image_url) {
      throw new Error('No image URL provided')
    }

    // Initialize AWS Rekognition
    const rekognition = new Rekognition({
      region: "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    })

    // Get image data
    const response = await fetch(image_url)
    const imageBuffer = await response.arrayBuffer()

    // Detect text in image using AWS Rekognition
    const result = await rekognition.detectText({
      Image: {
        Bytes: new Uint8Array(imageBuffer)
      }
    })

    // Process detected text to find license plates
    const detectedText = result.TextDetections || []
    let licensePlate = null
    let confidence = 0

    // Simple license plate pattern matching (can be improved based on your needs)
    const licensePlatePattern = /^[A-Z0-9]{5,8}$/
    for (const text of detectedText) {
      if (text.Type === 'LINE' && text.DetectedText) {
        const cleaned = text.DetectedText.replace(/[^A-Z0-9]/g, '')
        if (licensePlatePattern.test(cleaned)) {
          licensePlate = cleaned
          confidence = text.Confidence || 0
          break
        }
      }
    }

    if (!licensePlate) {
      return new Response(
        JSON.stringify({ message: 'No license plate detected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Store vehicle detection in database
    const { error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .upsert({
        license_plate: licensePlate,
        confidence: confidence / 100,
        last_seen: new Date().toISOString(),
        image_url,
        detected_at: new Date().toISOString()
      }, {
        onConflict: 'license_plate'
      })

    if (vehicleError) {
      throw vehicleError
    }

    // Create an analytics event
    const { error: analyticsError } = await supabaseAdmin
      .from('analytics')
      .insert({
        event_type: 'LICENSE_PLATE_DETECTED',
        camera_id,
        event_data: {
          license_plate: licensePlate,
          confidence: confidence / 100
        }
      })

    if (analyticsError) {
      console.error('Failed to create analytics event:', analyticsError)
    }

    return new Response(
      JSON.stringify({
        license_plate: licensePlate,
        confidence: confidence / 100
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in detect-license-plate function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
