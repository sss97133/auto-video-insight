
import React, { useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Video, Power, PlayCircle, StopCircle, Share2, Settings, Trash2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toggleCameraStatus, toggleRecording, shareRecording, updateCameraProcessor, deleteCamera } from "@/utils/cameraOperations";
import { VideoProcessorType } from "@/types/video-processor";
import { toast } from "sonner";

interface CameraCardProps {
  camera: any;
}

const CameraCard = ({ camera }: CameraCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const handleProcessorChange = async (value: VideoProcessorType) => {
    try {
      await updateCameraProcessor(camera.id, value);
      toast.success("Processor updated successfully");
    } catch (error) {
      console.error("Error updating processor:", error);
      toast.error("Failed to update processor");
    }
  };

  const handleStatusToggle = async () => {
    try {
      await toggleCameraStatus(camera.id, camera.status);
      toast.success(`Camera ${camera.status === 'active' ? 'deactivated' : 'activated'}`);
    } catch (error) {
      console.error("Error toggling camera status:", error);
      toast.error("Failed to toggle camera status");
    }
  };

  const handleRecordingToggle = async () => {
    try {
      await toggleRecording(camera.id, camera.is_recording);
      toast.success(camera.is_recording ? "Recording stopped" : "Recording started");
    } catch (error) {
      console.error("Error toggling recording:", error);
      toast.error("Failed to toggle recording");
    }
  };

  const handleShare = async () => {
    try {
      await shareRecording(camera.id);
      toast.success("Recording shared successfully");
    } catch (error) {
      console.error("Error sharing recording:", error);
      toast.error("Failed to share recording");
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to remove this camera?')) {
      try {
        await deleteCamera(camera.id);
      } catch (error) {
        console.error("Error deleting camera:", error);
        toast.error("Failed to delete camera");
      }
    }
  };

  const initializeVideo = async () => {
    if (!videoRef.current || !camera.streaming_url) return;

    try {
      // Reset video element
      videoRef.current.src = '';
      videoRef.current.load();

      // Set new source and play
      videoRef.current.src = camera.streaming_url;
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing video:", error);
          toast.error("Failed to start video stream");
        });
      }
    } catch (error) {
      console.error("Error initializing video:", error);
      toast.error("Failed to initialize video stream");
    }
  };

  useEffect(() => {
    if (camera.status === 'active') {
      console.log("Initializing video with URL:", camera.streaming_url);
      initializeVideo();
    } else {
      // Stop video if camera is not active
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    }

    return () => {
      // Cleanup on unmount
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, [camera.streaming_url, camera.status]);

  return (
    <Card className="hover-scale glass-card p-4 overflow-hidden">
      <div className="aspect-video bg-gray-800 rounded-lg mb-3 relative w-full h-[200px]">
        {camera.streaming_url ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full rounded-lg object-cover"
            autoPlay
            playsInline
            muted
            controls
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <Video size={40} />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium block truncate">{camera.name}</span>
            <p className="text-xs text-gray-500 truncate">{camera.location}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRecordingToggle}
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
              onClick={handleShare}
              className="text-blue-500 hover:text-blue-600"
            >
              <Share2 size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStatusToggle}
              className={camera.status === 'active' ? 'text-green-500 hover:text-green-600' : 'text-red-500 hover:text-red-600'}
            >
              <Power size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 size={18} />
            </Button>
            <div className={`w-2 h-2 rounded-full ${camera.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Settings size={16} className="text-gray-500 flex-shrink-0" />
          <Select
            defaultValue={camera.configuration?.processor_type || 'none'}
            onValueChange={handleProcessorChange}
          >
            <SelectTrigger className="w-[180px] flex-shrink-0">
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

