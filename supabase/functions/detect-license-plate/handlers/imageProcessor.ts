
import { RekognitionService } from "../services/rekognition.ts";

export async function processImage(imageUrl: string) {
  console.log('Processing image:', imageUrl);
  
  // Download image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  console.log('Image downloaded successfully:', {
    size: imageBuffer.byteLength,
    type: imageResponse.headers.get('content-type')
  });

  // Initialize Rekognition service
  const rekognition = new RekognitionService();

  // Detect text and labels
  const [textResponse, labelsResponse] = await Promise.all([
    rekognition.detectText(imageBuffer),
    rekognition.detectLabels(imageBuffer)
  ]);

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
  return {
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
}

