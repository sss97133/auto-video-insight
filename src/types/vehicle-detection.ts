
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
  parents?: string[];
  categories?: string[];
}

export interface VehicleConditionArea {
  name: string;
  condition_score: number;
  detected_issues: Array<{
    type: string;
    severity: number;
    confidence: number;
    details?: string;
  }>;
  bounding_box: BoundingBox;
}

export interface RestoreWorkAssessment {
  required_techniques: string[];
  estimated_work_hours: number;
  specialized_tools_needed: string[];
  material_requirements: Array<{
    type: string;
    quantity?: number;
    unit?: string;
  }>;
  skill_level_required: 'Beginner' | 'Intermediate' | 'Expert' | 'Master';
}

export interface HistoricalMarkers {
  period_correct_features: string[];
  modification_indicators: string[];
  originality_assessment: {
    score: number;
    notable_elements: string[];
  };
  manufacturing_details?: {
    factory_marks?: string[];
    serial_numbers?: string[];
    build_date_indicators?: string[];
  };
}

export interface VehicleDetectionResult {
  // Basic vehicle identification
  license_plate: string;
  confidence: number;
  vehicle_type: string;
  
  // Detailed vehicle information
  make_model_year?: {
    make: string;
    model: string;
    year?: number;
    confidence: number;
    sub_model?: string;
    trim_level?: string;
  };

  // Comprehensive condition assessment
  condition_assessment: {
    overall_score: number;
    areas_of_concern: VehicleConditionArea[];
    restoration_potential: number;
    authenticity_score: number;
  };

  // Historical and authenticity data
  historical_markers: HistoricalMarkers;

  // Restoration/repair assessment
  restoration_assessment?: RestoreWorkAssessment;

  // Raw detection data
  vehicle_details: {
    detected_text: DetectedText[];
    labels: DetectedLabel[];
    custom_labels: Array<{
      name: string;
      confidence: number;
      category: string;
      significance: string;
    }>;
  };

  // Spatial data
  bounding_box: BoundingBox | null;
  
  // Metadata
  analysis_timestamp: string;
  environmental_conditions?: {
    lighting: string;
    weather?: string;
    image_quality: number;
  };
}
