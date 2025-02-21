
import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Video, Power, PlayCircle, StopCircle, Share2, Settings } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toggleCameraStatus, toggleRecording, shareRecording, updateCameraProcessor } from "@/utils/cameraOperations";
import { VideoProcessorType } from "@/types/video-processor";

interface CameraCardProps {
  camera: any;
}

const CameraCard = ({ camera }: CameraCardProps) => {
  const handleProcessorChange = async (value: VideoProcessorType) => {
    await updateCameraProcessor(camera.id, value);
  };

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
      <div className="space-y-2">
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
        
        <div className="flex items-center gap-2 mt-2">
          <Settings size={16} className="text-gray-500" />
          <Select
            defaultValue={camera.configuration?.processor_type || 'none'}
            onValueChange={handleProcessorChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select processor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Processing</SelectItem>
              <SelectItem value="aws-rekognition">AWS Rekognition</SelectItem>
              <SelectItem value="custom">Custom Processor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};

export default CameraCard;
