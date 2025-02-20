
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
    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    
    if (!accessKeyId || !secretAccessKey) {
      console.error('AWS credentials not found in environment');
      throw new Error('AWS credentials not configured');
    }

    const client = new RekognitionClient({
      region: "us-east-2",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    console.log('Rekognition client initialized successfully');

    // Detect text in image
    console.log('Creating DetectText command...');
    const detectTextCommand = new DetectTextCommand({
      Image: {
        Bytes: new Uint8Array(imageBuffer),
      },
    });

    console.log('Sending DetectText request to Rekognition...');
    const textResponse = await client.send(detectTextCommand);
    console.log('Text detection response:', JSON.stringify(textResponse, null, 2));

    // Detect labels for vehicle type
    console.log('Creating DetectLabels command...');
    const detectLabelsCommand = new DetectLabelsCommand({
      Image: {
        Bytes: new Uint8Array(imageBuffer),
      },
      MaxLabels: 10,
      MinConfidence: 70,
    });

    console.log('Sending DetectLabels request to Rekognition...');
    const labelsResponse = await client.send(detectLabelsCommand);
    console.log('Label detection response:', JSON.stringify(labelsResponse, null, 2));

    // Process text results
    const detectedText = textResponse.TextDetections || [];
    const licensePlate = detectedText.find(text => 
      text.Type === 'LINE' && 
      text.DetectedText && 
      /^[A-Z0-9]{5,8}$/.test(text.DetectedText)
    );

    if (!licensePlate) {
      throw new Error('No valid license plate detected in image');
    }

    // Find vehicle type from labels
    const vehicleLabels = labelsResponse.Labels?.filter(label => 
      ['Car', 'Automobile', 'Vehicle', 'Truck', 'Van', 'SUV', 'Pickup Truck'].includes(label.Name || '')
    ) || [];
    
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
    console.error('Edge function error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      details: error.stack || error.cause
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
});
