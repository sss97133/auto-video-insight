
import { RekognitionClient, DetectTextCommand, DetectLabelsCommand } from "npm:@aws-sdk/client-rekognition";

export class RekognitionService {
  private client: RekognitionClient;

  constructor(accessKeyId: string, secretAccessKey: string) {
    this.client = new RekognitionClient({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region: "us-east-1"
    });
  }

  async detectText(imageBytes: Uint8Array) {
    console.log('Starting text detection...');
    const command = new DetectTextCommand({
      Image: { Bytes: imageBytes }
    });
    return await this.client.send(command);
  }

  async detectLabels(imageBytes: Uint8Array) {
    console.log('Starting label detection...');
    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MinConfidence: 80
    });
    return await this.client.send(command);
  }
}

