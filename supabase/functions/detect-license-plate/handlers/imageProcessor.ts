
import { RekognitionService } from "../services/rekognition.ts";

export async function processImage(imageUrl: string) {
  try {
    console.log('Starting image processing...');
    
    const rekognition = new RekognitionService();
    console.log('Rekognition service initialized');
    
    // Download image and convert to base64
    console.log('Downloading image from:', imageUrl);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const imageBytes = new Uint8Array(arrayBuffer);
    console.log('Image downloaded and converted');

    // Detect text (license plate)
    console.log('Detecting text...');
    const textResult = await rekognition.detectText(imageBytes);
    console.log('Text detection result:', textResult);

    // Detect labels (vehicle type)
    console.log('Detecting labels...');
    const labelsResult = await rekognition.detectLabels(imageBytes);
    console.log('Labels detection result:', labelsResult);

    // Process results
    const licensePlate = textResult.TextDetections?.[0]?.DetectedText || '';
    const confidence = textResult.TextDetections?.[0]?.Confidence || 0;
    
    // Find the most confident vehicle label
    const vehicleLabels = labelsResult.Labels?.filter(label => 
      ['Car', 'Automobile', 'Vehicle', 'Truck', 'Van', 'SUV', 'Pickup Truck'].includes(label.Name)
    ).sort((a, b) => (b.Confidence || 0) - (a.Confidence || 0)) || [];
    
    const vehicleType = vehicleLabels[0]?.Name || 'Unknown';
    const vehicleBoundingBox = vehicleLabels[0]?.Instances?.[0]?.BoundingBox || null;

    console.log('Processing complete:', { 
      licensePlate, 
      confidence, 
      vehicleType,
      vehicleBoundingBox,
      allLabels: labelsResult.Labels 
    });

    return {
      license_plate: licensePlate,
      confidence: confidence,
      vehicle_type: vehicleType,
      bounding_box: vehicleBoundingBox,
      vehicle_details: labelsResult.Labels
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
}
