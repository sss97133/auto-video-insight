
export interface DetectedLabel {
  name: string;
  confidence: number;
}

export interface CameraVideoProps {
  streamingUrl: string | null;
  isActive: boolean;
}
