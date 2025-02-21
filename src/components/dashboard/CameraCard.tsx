
import React from "react";
import { Card } from "../ui/card";
import CameraVideo from "./CameraVideo";
import CameraControls from "./CameraControls";
import { Camera } from "@/types/camera";

interface CameraCardProps {
  camera: Camera;
}

const CameraCard = ({ camera }: CameraCardProps) => {
  return (
    <Card className="hover-scale glass-card p-4 overflow-hidden">
      <CameraVideo 
        streamingUrl={camera.streaming_url} 
        isActive={camera.status === 'active'} 
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium block truncate">{camera.name}</span>
            <p className="text-xs text-gray-500 truncate">{camera.location}</p>
          </div>
          <CameraControls 
            cameraId={camera.id}
            status={camera.status}
            isRecording={camera.is_recording}
            processorType={camera.configuration?.processor_type || 'none'}
          />
        </div>
      </div>
    </Card>
  );
};

export default CameraCard;
