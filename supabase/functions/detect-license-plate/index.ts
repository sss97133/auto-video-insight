
import { corsHeaders } from "./utils/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  RekognitionClient,
  DetectTextCommand,
  DetectLabelsCommand 
} from "https://deno.land/x/aws_sdk@v3.32.0-1/client-rekognition/mod.ts";

serve(async (req) => {
  console.log('Function started:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse and validate request
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      throw new Error('Invalid request body: ' + error.message);
    }
    
    const { image_url } = body;
    if (!image_url) {
      console.error('No image URL in request');
      throw new Error('No image URL provided');
    }

    // Download image from URL
    console.log('Downloading image from:', image_url);
    let imageResponse;
    try {
      imageResponse = await fetch(image_url);
      if (!imageResponse.ok) {
        throw new Error(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
      }
    } catch (error) {
      console.error('Image download failed:', {
        error,
        message: error.message,
        url: image_url
      });
      throw new Error(`Failed to download image: ${error.message}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    console.log('Image downloaded successfully:', {
      size: imageBuffer.byteLength,
      type: imageResponse.headers.get('content-type')
    });

    // Initialize AWS Rekognition client
    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    
    if (!accessKeyId || !secretAccessKey) {
      console.error('AWS credentials missing:', {
        hasAccessKey: !!accessKeyId,
        hasSecretKey: !!secretAccessKey
      });
      throw new Error('AWS credentials not configured');
    }

    console.log('Initializing Rekognition client...');
    const client = new RekognitionClient({
      region: "us-east-2",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Detect text in image
    let textResponse;
    try {
      console.log('Sending DetectText request...');
      const detectTextCommand = new DetectTextCommand({
        Image: {
          Bytes: new Uint8Array(imageBuffer),
        },
      });
      textResponse = await client.send(detectTextCommand);
      console.log('Text detection response:', JSON.stringify(textResponse, null, 2));
    } catch (error) {
      console.error('Text detection failed:', {
        error,
        message: error.message,
        code: error.code,
        requestId: error.$metadata?.requestId
      });
      throw new Error(`Text detection failed: ${error.message}`);
    }

    // Detect labels for vehicle type
    let labelsResponse;
    try {
      console.log('Sending DetectLabels request...');
      const detectLabelsCommand = new DetectLabelsCommand({
        Image: {
          Bytes: new Uint8Array(imageBuffer),
        },
        MaxLabels: 10,
        MinConfidence: 70,
      });
      labelsResponse = await client.send(detectLabelsCommand);
      console.log('Label detection response:', JSON.stringify(labelsResponse, null, 2));
    } catch (error) {
      console.error('Label detection failed:', {
        error,
        message: error.message,
        code: error.code,
        requestId: error.$metadata?.requestId
      });
      throw new Error(`Label detection failed: ${error.message}`);
    }

    // Process text results
    const detectedText = textResponse.TextDetections || [];
    console.log('Processing detected text:', 
      detectedText.map(t => ({
        text: t.DetectedText,
        type: t.Type,
        confidence: t.Confidence
      }))
    );

    const licensePlate = detectedText.find(text => 
      text.Type === 'LINE' && 
      text.DetectedText && 
      /^[A-Z0-9]{5,8}$/.test(text.DetectedText)
    );

    if (!licensePlate) {
      console.log('No valid license plate found in detected text');
      throw new Error('No valid license plate detected in image');
    }

    // Find vehicle type from labels
    const vehicleLabels = labelsResponse.Labels?.filter(label => 
      ['Car', 'Automobile', 'Vehicle', 'Truck', 'Van', 'SUV', 'Pickup Truck'].includes(label.Name || '')
    ) || [];
    
    console.log('Found vehicle labels:', 
      vehicleLabels.map(l => ({
        name: l.Name,
        confidence: l.Confidence
      }))
    );
    
    const vehicleType = vehicleLabels.length > 0 ? vehicleLabels[0].Name : "Unknown";

    // Construct response
    const result = {
      license_plate: licensePlate.DetectedText,
      confidence: licensePlate.Confidence ? licensePlate.Confidence / 100 : 0,
      vehicle_type: vehicleType,
      vehicle_details: {
        detected_text: detectedText.map(text => ({
          text: text.DetectedText,
          type: text.Type,
          confidence: text.Confidence ? text.Confidence / 100 : 0,
        })),
        labels: labelsResponse.Labels?.map(label => ({
          name: label.Name,
          confidence: label.Confidence ? label.Confidence / 100 : 0,
        }))
      },
      bounding_box: licensePlate.Geometry?.BoundingBox || null
    };

    console.log('Processing complete, returning result:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    });

  } catch (error) {
    console.error('Function error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error?.cause
    });
    
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: error.message.includes('No valid license plate') ? 400 : 500,
    });
  }
});

