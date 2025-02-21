
import { RekognitionService } from "../services/rekognition.ts";

export async function downloadImage(imageUrl: string): Promise<ArrayBuffer> {
  console.log('Downloading image:', imageUrl.substring(0, 50) + '...');
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  console.log('Image downloaded successfully:', {
    size: buffer.byteLength,
    type: response.headers.get('content-type')
  });
  
  return buffer;
}

export async function processImage(imageUrl: string) {
  try {
    console.log('Starting image processing...');
    
    // Download and process image
    const imageBuffer = await downloadImage(imageUrl);

    console.log('Initializing Rekognition service...');
    const rekognition = new RekognitionService();
    console.log('Rekognition service initialized');

    // Detect text and labels
    console.log('Detecting text in image...');
    const [textResponse, labelsResponse] = await Promise.all([
      rekognition.detectText(imageBuffer),
      rekognition.detectLabels(imageBuffer)
    ]);

    console.log('Raw Rekognition responses:', {
      text: textResponse,
      labels: labelsResponse
    });

    // Process text results
    const detectedText = textResponse.TextDetections || [];
    console.log('Processing detected text:', 
      detectedText.map(t => ({
        text: t.DetectedText,
        type: t.Type,
        confidence: t.Confidence
      }))
    );

    // Find license plate
    const licensePlate = detectedText.find(text => 
      text.Type === 'LINE' && 
      text.DetectedText && 
      /^[A-Z0-9]{5,8}$/.test(text.DetectedText)
    );

    if (!licensePlate) {
      throw new Error('No valid license plate detected in image');
    }

    // Find vehicle type
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

    // Return processed results
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

    console.log('Processing complete, returning result:', result);
    return result;

  } catch (error) {
    console.error('Error in processImage:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
