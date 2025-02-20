
import { RekognitionService } from "../services/rekognition.ts";

export class ImageProcessor {
  private rekognition: RekognitionService;

  constructor(rekognition: RekognitionService) {
    this.rekognition = rekognition;
  }

  async processImage(imageBytes: Uint8Array) {
    console.log('Starting image processing...');
    
    try {
      const [textResponse, labelsResponse] = await Promise.all([
        this.rekognition.detectText(imageBytes),
        this.rekognition.detectLabels(imageBytes)
      ]);

      if (!textResponse.TextDetections?.length) {
        console.log('No text detected in image');
        return {
          license_plate: '',
          confidence: 0,
          vehicle_type: this.getVehicleType(labelsResponse.Labels || []),
          timestamp: new Date().toISOString()
        };
      }

      const licensePlate = textResponse.TextDetections
        .filter(text => text.Type === 'LINE')
        .map(text => ({
          text: text.DetectedText,
          confidence: text.Confidence ? text.Confidence / 100 : 0
        }))
        .sort((a, b) => b.confidence - a.confidence)[0];

      return {
        license_plate: licensePlate?.text || '',
        confidence: licensePlate?.confidence || 0,
        vehicle_type: this.getVehicleType(labelsResponse.Labels || []),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  private getVehicleType(labels: Array<{ Name?: string }>) {
    const vehicleTypes = ['Car', 'Automobile', 'Vehicle', 'Transportation'];
    const vehicleLabel = labels.find(label => 
      vehicleTypes.includes(label.Name || '')
    );
    return vehicleLabel?.Name?.toLowerCase() || 'unknown';
  }
}
