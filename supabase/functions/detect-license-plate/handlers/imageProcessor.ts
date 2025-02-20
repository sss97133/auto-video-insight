
import { RekognitionService } from "../services/rekognition.ts";

export class ImageProcessor {
  private rekognition: RekognitionService;

  constructor(rekognition: RekognitionService) {
    this.rekognition = rekognition;
  }

  async processImage(imageBytes: Uint8Array) {
    const textResponse = await this.rekognition.detectText(imageBytes);
    const labelsResponse = await this.rekognition.detectLabels(imageBytes);

    if (!textResponse.TextDetections || textResponse.TextDetections.length === 0) {
      throw new Error('No text detected in image');
    }

    const licensePlate = textResponse.TextDetections
      .filter(text => text.Type === 'LINE')
      .map(text => ({
        text: text.DetectedText,
        confidence: text.Confidence ? text.Confidence / 100 : 0
      }))
      .sort((a, b) => b.confidence - a.confidence)[0];

    const vehicleLabel = labelsResponse.Labels?.find(label => 
      ['Car', 'Automobile', 'Vehicle', 'Transportation'].includes(label.Name || '')
    );

    return {
      license_plate: licensePlate?.text || '',
      confidence: licensePlate?.confidence || 0,
      vehicle_type: vehicleLabel?.Name?.toLowerCase() || 'unknown',
      timestamp: new Date().toISOString()
    };
  }
}

