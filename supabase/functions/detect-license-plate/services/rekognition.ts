
import { RekognitionClient, DetectTextCommand, DetectLabelsCommand } from "npm:@aws-sdk/client-rekognition@^3.0.0";

export class RekognitionService {
  private client: RekognitionClient;

  constructor() {
    console.log('Initializing Rekognition client...');
    
    // Validate AWS credentials
    if (!Deno.env.get("AWS_ACCESS_KEY_ID") || !Deno.env.get("AWS_SECRET_ACCESS_KEY")) {
      throw new Error("AWS credentials not found in environment");
    }

    try {
      this.client = new RekognitionClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || '',
          secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || ''
        }
      });
      console.log('Rekognition client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Rekognition client:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async detectText(imageData: ArrayBuffer) {
    console.log('Detecting text with Rekognition...');
    try {
      const command = new DetectTextCommand({
        Image: {
          Bytes: new Uint8Array(imageData)
        }
      });

      const response = await this.client.send(command);
      console.log('Text detection complete');
      return response;
    } catch (error) {
      console.error('Error in detectText:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async detectLabels(imageData: ArrayBuffer) {
    console.log('Detecting labels with Rekognition...');
    try {
      const command = new DetectLabelsCommand({
        Image: {
          Bytes: new Uint8Array(imageData)
        },
        MaxLabels: 10,
        MinConfidence: 70
      });

      const response = await this.client.send(command);
      console.log('Label detection complete');
      return response;
    } catch (error) {
      console.error('Error in detectLabels:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
