
import { 
  RekognitionClient,
  DetectTextCommand,
  DetectLabelsCommand 
} from "https://deno.land/x/aws_sdk@v3.32.0-1/client-rekognition/mod.ts";

export class RekognitionService {
  private client: RekognitionClient;

  constructor() {
    console.log('Initializing Rekognition service...');
    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not configured');
    }

    this.client = new RekognitionClient({
      region: "us-east-2",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async detectText(imageBuffer: ArrayBuffer) {
    console.log('Starting text detection...');
    const command = new DetectTextCommand({
      Image: {
        Bytes: new Uint8Array(imageBuffer),
      },
    });
    
    const response = await this.client.send(command);
    console.log('Text detection completed:', {
      textCount: response.TextDetections?.length || 0
    });
    return response;
  }

  async detectLabels(imageBuffer: ArrayBuffer) {
    console.log('Starting label detection...');
    const command = new DetectLabelsCommand({
      Image: {
        Bytes: new Uint8Array(imageBuffer),
      },
      MaxLabels: 10,
      MinConfidence: 70,
    });
    
    const response = await this.client.send(command);
    console.log('Label detection completed:', {
      labelCount: response.Labels?.length || 0
    });
    return response;
  }
}

