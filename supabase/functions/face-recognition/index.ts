
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { RekognitionClient, SearchFacesByImageCommand, SearchFacesCommand } from 'npm:@aws-sdk/client-rekognition'

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
    // Initialize AWS Rekognition client
    const rekognition = new RekognitionClient({
      region: 'us-east-1', // Update with your AWS region
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { action, collectionId, image } = await req.json()
    console.log(`Processing ${action} request for collection ${collectionId}`)

    switch (action) {
      case 'searchFaces': {
        // Convert base64 image to buffer
        const imageBuffer = Buffer.from(image.split(',')[1], 'base64')

        const command = new SearchFacesByImageCommand({
          CollectionId: collectionId,
          Image: {
            Bytes: imageBuffer
          },
          MaxFaces: 5,
          FaceMatchThreshold: 90
        })

        const response = await rekognition.send(command)
        console.log('Face search response:', response)

        // Store results in video_analysis table
        if (response.FaceMatches && response.FaceMatches.length > 0) {
          const { error } = await supabaseClient
            .from('video_analysis')
            .insert({
              camera_id: collectionId, // Using collection ID as camera ID for this example
              frame_timestamp: new Date().toISOString(),
              faces: response.FaceMatches
            })

          if (error) {
            console.error('Error storing face analysis:', error)
            throw error
          }
        }

        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'searchById': {
        const { faceId } = await req.json()
        const command = new SearchFacesCommand({
          CollectionId: collectionId,
          FaceId: faceId,
          MaxFaces: 5,
          FaceMatchThreshold: 90
        })

        const response = await rekognition.send(command)
        console.log('Face search by ID response:', response)

        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  } catch (error) {
    console.error('Error in face-recognition function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
