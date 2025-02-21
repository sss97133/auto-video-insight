
export interface CameraConfiguration {
  processor_type?: 'aws-rekognition' | 'custom' | 'none';
  updated_at?: string;
  settings?: {
    frameRate?: number;
    resolution?: string;
    detectionConfidence?: number;
  };
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  type: string;
  status: 'active' | 'inactive';
  streaming_url: string | null;
  is_recording: boolean;
  configuration: CameraConfiguration;
  created_at: string;
  updated_at: string;
}
