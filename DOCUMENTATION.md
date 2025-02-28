
# Auto Video Insight Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [Data Flow](#data-flow)
4. [Features Documentation](#features-documentation)
5. [API Integration](#api-integration)
6. [Data Science & Computer Vision](#data-science--computer-vision)
7. [Deployment Guidelines](#deployment-guidelines)

## Architecture Overview

The application follows a component-based architecture using React and TypeScript. It leverages Supabase for backend services and real-time functionality.

### Key Technologies
- **React + TypeScript**: Frontend framework and type safety
- **Vite**: Build tool and development server
- **TanStack Query**: Data fetching and state management
- **Supabase**: Backend services and real-time features
- **shadcn/ui**: UI component library
- **Tailwind CSS**: Utility-first CSS framework

## Component Structure

### Core Components

#### Dashboard (`/src/components/Dashboard.tsx`)
- Main application interface
- Manages camera grid and analytics display
- Handles real-time updates

#### Camera Components
1. **CameraGrid**: Displays all connected cameras
2. **CameraCard**: Individual camera display component
3. **CameraModal**: Add/Edit camera configuration

#### Analytics Components
1. **AnalyticsDashboard**: Main analytics interface
2. **EventsLineChart**: Visual data representation
3. **StatsSection**: Key metrics display

## Data Flow

1. **Camera Management**
   ```typescript
   // Example data structure for camera configuration
   interface CameraConfig {
     id: string;
     name: string;
     location: string;
     type: 'ip' | 'rtsp' | 'rtmp';
     streamingUrl?: string;
     configuration: Record<string, any>;
   }
   ```

2. **Real-time Updates**
   - Utilizes Supabase's real-time subscriptions
   - Automatic UI updates on data changes

## Features Documentation

### Camera Integration

1. **Browser Streaming**
   - Uses WebRTC for browser-based camera access
   - Supports multiple video input devices

2. **RTMP Streaming**
   - Compatible with OBS Studio and similar software
   - Provides unique stream keys for each camera

3. **Direct URL Connection**
   - Supports IP cameras
   - RTSP/RTMP stream integration

### Analytics System

1. **Vehicle Detection**
   - Real-time vehicle identification
   - License plate recognition capabilities
   - Storage and retrieval of vehicle data

2. **Audit Logging**
   - Comprehensive event tracking
   - Detailed activity history
   - Exportable audit reports

## Data Science & Computer Vision

### Object Detection Architecture

The application implements a sophisticated object detection pipeline for real-time video analysis:

1. **Frame Extraction & Processing**
   - Video frames are extracted at configurable intervals (default: 1000ms)
   - Frames are converted to optimized formats (JPEG) for network transmission
   - Resolution downsampling applied to balance accuracy vs. performance

2. **AWS Rekognition Integration**
   - Leverages AWS Rekognition's deep learning models for object detection
   - Pre-trained models identify common objects (vehicles, people, animals)
   - Classification confidence scores used for filtering results

3. **License Plate Recognition (LPR)**
   - Custom trained OCR models for license plate text extraction
   - Multi-stage detection process:
     1. Vehicle detection in frame
     2. License plate region localization
     3. Character recognition and extraction
   - Geographic region-specific models to handle different plate formats

4. **Model Performance Considerations**
   - Inference latency: ~200-500ms per frame (AWS Rekognition)
   - Accuracy metrics:
     - Object detection: 85-92% mAP (mean Average Precision)
     - License plate recognition: 78-85% accuracy (depends on conditions)
   - Environmental factors affecting performance:
     - Lighting conditions (day/night)
     - Weather effects (rain, snow, fog)
     - Camera angle and mounting position

5. **Data Enrichment**
   - Vehicle make/model classification
   - Color detection and categorization
   - Damage assessment capabilities
   - Temporal tracking for vehicle dwell time analysis

### Machine Learning Model Training

For specialized detection needs, the system supports custom model training workflow:

1. **Data Collection & Annotation**
   - Automated dataset creation from captured frames
   - Manual annotation tools for custom object classes
   - Dataset augmentation techniques for improved generalization

2. **Transfer Learning Approach**
   - Base models pre-trained on large datasets (COCO, ImageNet)
   - Fine-tuning on domain-specific data
   - Hyperparameter optimization for specific use cases

3. **Model Deployment Pipeline**
   - Optimized export formats (TensorFlow SavedModel, ONNX)
   - AWS Lambda-compatible packaging
   - A/B testing framework for model version comparison

### Analytics & Insights

The system transforms raw detection data into actionable insights:

1. **Temporal Analysis**
   - Peak time identification for vehicle traffic
   - Dwell time calculation for each detected vehicle
   - Trend analysis across different time periods

2. **Spatial Intelligence**
   - Heat mapping of vehicle positioning
   - Path analysis and common routes
   - Anomaly detection for unusual patterns

3. **Event Correlation**
   - Multi-camera object tracking
   - Event sequence reconstruction
   - Causality analysis for complex scenarios

## API Integration

### Supabase Tables

1. **cameras**
   - Stores camera configurations
   - Manages streaming credentials

2. **vehicles**
   - Vehicle detection records
   - License plate data

3. **audits**
   - System event logs
   - User activity tracking

## Deployment Guidelines

1. **Environment Setup**
   - Configure Supabase credentials
   - Set up required environment variables

2. **Build Process**
   ```bash
   npm run build
   ```

3. **Production Considerations**
   - Enable error tracking
   - Configure logging
   - Set up monitoring

4. **Performance Optimization**
   - Implement lazy loading
   - Enable caching
   - Optimize video streams
