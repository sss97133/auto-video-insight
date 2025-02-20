
import { RekognitionClient } from "https://deno.land/x/aws_sdk@v3.32.0-1/client-rekognition/mod.ts";

export class RekognitionService {
  private client: RekognitionClient;

  constructor() {
    console.log('Initializing Rekognition client...');
    this.client = new RekognitionClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
        secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
      },
    });
    console.log('Rekognition client initialized');
  }

  async detectText(imageBytes: Uint8Array) {
    try {
      console.log('Calling Rekognition DetectText...');
      const command = {
        Image: {
          Bytes: imageBytes,
        },
      };
      const result = await this.client.detectText(command);
      console.log('DetectText completed');
      return result;
    } catch (error) {
      console.error('DetectText error:', error);
      throw error;
    }
  }

  async detectLabels(imageBytes: Uint8Array) {
    try {
      console.log('Calling Rekognition DetectLabels...');
      const command = {
        Image: {
          Bytes: imageBytes,
        },
        MaxLabels: 10,
        MinConfidence: 70,
      };
      const result = await this.client.detectLabels(command);
      console.log('DetectLabels completed');
      return result;
    } catch (error) {
      console.error('DetectLabels error:', error);
      throw error;
    }
  }
}

