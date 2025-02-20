
import { RekognitionClient } from "https://deno.land/x/aws_sdk@v3.32.0-1/client-rekognition/mod.ts";

export class RekognitionService {
  private client: RekognitionClient;

  constructor() {
    console.log('Initializing Rekognition client...');
    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not configured');
    }
    
    try {
      this.client = new RekognitionClient({
        region: "us-east-2",
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      console.log('Rekognition client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Rekognition client:', error);
      throw error;
    }
  }

  async detectText(imageBytes: ArrayBuffer) {
    try {
      console.log('Starting text detection...');
      const command = {
        Image: {
          Bytes: new Uint8Array(imageBytes),
        },
      };
      const result = await this.client.detectText(command);
      console.log('Text detection completed successfully');
      return result;
    } catch (error) {
      console.error('Text detection failed:', error);
      throw error;
    }
  }

  async detectLabels(imageBytes: ArrayBuffer) {
    try {
      console.log('Starting label detection...');
      const command = {
        Image: {
          Bytes: new Uint8Array(imageBytes),
        },
        MaxLabels: 10,
        MinConfidence: 70,
      };
      const result = await this.client.detectLabels(command);
      console.log('Label detection completed successfully');
      return result;
    } catch (error) {
      console.error('Label detection failed:', error);
      throw error;
    }
  }
}
