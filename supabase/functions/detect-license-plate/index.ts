
import { corsHeaders } from "./utils/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RekognitionClient, DetectTextCommand } from "npm:@aws-sdk/client-rekognition";

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse and validate request
    if (!req.body) {
      throw new Error('Request body is empty');
    }

    const body = await req.json();
    console.log('Request body:', body);
    
    const { image_url } = body;
    if (!image_url) {
      throw new Error('No image URL provided');
    }

    // Download image from URL
    console.log('Downloading image from URL:', image_url);
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    console.log('Image downloaded successfully, size:', imageBuffer.byteLength);

    // Initialize AWS Rekognition client
    console.log('Initializing Rekognition client...');
    const client = new RekognitionClient({
      region: "us-east-2",
      credentials: {
        accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || '',
        secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || '',
      },
    });
    console.log('Rekognition client initialized');

    // Detect text in image
    console.log('Sending image to Rekognition...');
    const command = new DetectTextCommand({
      Image: {
        Bytes: new Uint8Array(imageBuffer),
      },
    });

    const textResponse = await client.send(command);
    console.log('Rekognition response:', textResponse);

    // Process results
    const detectedText = textResponse.TextDetections || [];
    const licensePlate = detectedText.find(text => 
      text.Type === 'LINE' && 
      text.DetectedText && 
      text.DetectedText.match(/^[A-Z0-9]{5,8}$/)
    );

    if (!licensePlate) {
      throw new Error('No valid license plate detected in image');
    }

    // Construct response
    const result = {
      license_plate: licensePlate.DetectedText,
      confidence: licensePlate.Confidence ? licensePlate.Confidence / 100 : 0,
      vehicle_type: "Unknown", // This would need additional processing to determine
      vehicle_details: {
        detected_text: detectedText.map(text => ({
          text: text.DetectedText,
          type: text.Type,
          confidence: text.Confidence ? text.Confidence / 100 : 0,
        }))
      },
      bounding_box: licensePlate.Geometry?.BoundingBox || null
    };

    console.log('Processing complete, returning result:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    });

  } catch (error) {
    console.error('Edge function error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      details: error.cause || error.stack
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
});
