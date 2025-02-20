
import { RekognitionService } from "../services/rekognition.ts";

export async function processImage(imageUrl: string) {
  console.log('Processing image:', imageUrl);
  
  try {
    const rekognition = new RekognitionService();

    console.log('Fetching image data...');
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    console.log('Image fetched successfully, size:', imageBuffer.byteLength);

    console.log('Starting text detection...');
    const textResult = await rekognition.detectText(imageBuffer);
    if (!textResult) {
      throw new Error('Text detection returned no result');
    }
    console.log('Text detection result:', textResult);

    console.log('Starting label detection...');
    const labelsResult = await rekognition.detectLabels(imageBuffer);
    if (!labelsResult) {
      throw new Error('Label detection returned no result');
    }
    console.log('Label detection result:', labelsResult);

    // Extract license plate text (first detected text)
    const licensePlate = textResult.TextDetections?.[0]?.DetectedText || '';
    const confidence = textResult.TextDetections?.[0]?.Confidence || 0;
    
    // Find the most confident vehicle label
    const vehicleLabels = labelsResult.Labels?.filter(label => 
      ['Car', 'Automobile', 'Vehicle', 'Truck', 'Van', 'SUV', 'Pickup Truck'].includes(label.Name)
    ).sort((a, b) => (b.Confidence || 0) - (a.Confidence || 0)) || [];
    
    const vehicleType = vehicleLabels[0]?.Name || 'Unknown';
    const vehicleBoundingBox = vehicleLabels[0]?.Instances?.[0]?.BoundingBox || null;

    const result = {
      license_plate: licensePlate,
      confidence: confidence,
      vehicle_type: vehicleType,
      bounding_box: vehicleBoundingBox,
      vehicle_details: labelsResult.Labels
    };

    console.log('Processing complete:', result);
    return result;

  } catch (error) {
    console.error('Image processing error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    throw error;
  }
}
