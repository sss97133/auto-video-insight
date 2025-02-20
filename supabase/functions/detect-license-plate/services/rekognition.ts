
import { RekognitionClient, DetectTextCommand, DetectLabelsCommand } from "npm:@aws-sdk/client-rekognition";

export class RekognitionService {
  private client: RekognitionClient;

  constructor(accessKeyId: string, secretAccessKey: string) {
    console.log('Initializing Rekognition client...');
    this.client = new RekognitionClient({
      region: "us-east-1",
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    console.log('Rekognition client initialized successfully');
  }

  async detectText(imageBytes: Uint8Array) {
    console.log('Starting text detection...');
    const command = new DetectTextCommand({
      Image: { Bytes: imageBytes }
    });

    try {
      const result = await this.client.send(command);
      console.log('Text detection completed successfully');
      return result;
    } catch (error) {
      console.error('Error in text detection:', error);
      throw error;
    }
  }

  async detectLabels(imageBytes: Uint8Array) {
    console.log('Starting label detection...');
    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MinConfidence: 80
    });

    try {
      const result = await this.client.send(command);
      console.log('Label detection completed successfully');
      return result;
    } catch (error) {
      console.error('Error in label detection:', error);
      throw error;
    }
  }
}
