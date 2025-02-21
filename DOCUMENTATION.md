
# Auto Video Insight Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [Data Flow](#data-flow)
4. [Features Documentation](#features-documentation)
5. [API Integration](#api-integration)
6. [Deployment Guidelines](#deployment-guidelines)

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
