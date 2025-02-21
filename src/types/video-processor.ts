
export type VideoProcessorType = 'aws-rekognition' | 'custom' | 'none';

export interface VideoProcessorConfig {
  type: VideoProcessorType;
  enabled: boolean;
  settings?: {
    frameRate?: number;
    resolution?: string;
    detectionConfidence?: number;
  };
}
