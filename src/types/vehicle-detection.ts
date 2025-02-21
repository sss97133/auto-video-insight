
export interface BoundingBox {
  Width?: number;
  Height?: number;
  Left?: number;
  Top?: number;
}

export interface DetectedText {
  text: string;
  type: 'LINE' | 'WORD';
  confidence: number;
}

export interface DetectedLabel {
  name: string;
  confidence: number;
}

export interface VehicleDetectionResult {
  license_plate: string;
  confidence: number;
  vehicle_type: string;
  vehicle_details: {
    detected_text: DetectedText[];
    labels: DetectedLabel[];
  };
  bounding_box: BoundingBox | null;
}
