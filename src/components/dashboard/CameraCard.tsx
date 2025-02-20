
import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Video, Power, PlayCircle, StopCircle, Share2 } from "lucide-react";
import { toggleCameraStatus, toggleRecording, shareRecording } from "@/utils/cameraOperations";

interface CameraCardProps {
  camera: any;
}

const CameraCard = ({ camera }: CameraCardProps) => {
  return (
    <Card className="hover-scale glass-card p-4">
      <div className="aspect-video bg-gray-800 rounded-lg mb-3">
        {camera.streaming_url ? (
          <video
            className="w-full h-full rounded-lg object-cover"
            src={camera.streaming_url}
            autoPlay
            muted
            playsInline
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <Video size={40} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">{camera.name}</span>
          <p className="text-xs text-gray-500">{camera.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleRecording(camera.id, camera.is_recording)}
            className={camera.is_recording ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}
          >
            {camera.is_recording ? (
              <StopCircle size={18} />
            ) : (
              <PlayCircle size={18} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => shareRecording(camera.id)}
            className="text-blue-500 hover:text-blue-600"
          >
            <Share2 size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleCameraStatus(camera.id, camera.status)}
            className={camera.status === 'active' ? 'text-green-500 hover:text-green-600' : 'text-red-500 hover:text-red-600'}
          >
            <Power size={18} />
          </Button>
          <div className={`w-2 h-2 rounded-full ${camera.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
      </div>
    </Card>
  );
};

export default CameraCard;
