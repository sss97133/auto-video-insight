
import React from "react";
import { Button } from "../ui/button";
import { Power, PlayCircle, StopCircle, Share2, Settings, Trash2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { VideoProcessorType } from "@/types/video-processor";
import { toast } from "sonner";
import { toggleCameraStatus, toggleRecording, shareRecording, updateCameraProcessor, deleteCamera } from "@/utils/cameraOperations";

interface CameraControlsProps {
  cameraId: string;
  status: string;
  isRecording: boolean;
  processorType: VideoProcessorType | 'none';
}

const CameraControls = ({ cameraId, status, isRecording, processorType }: CameraControlsProps) => {
  const handleProcessorChange = async (value: VideoProcessorType) => {
    try {
      await updateCameraProcessor(cameraId, value);
      toast.success("Processor updated successfully");
    } catch (error) {
      console.error("Error updating processor:", error);
      toast.error("Failed to update processor");
    }
  };

  const handleStatusToggle = async () => {
    try {
      await toggleCameraStatus(cameraId, status);
      toast.success(`Camera ${status === 'active' ? 'deactivated' : 'activated'}`);
    } catch (error) {
      console.error("Error toggling camera status:", error);
      toast.error("Failed to toggle camera status");
    }
  };

  const handleRecordingToggle = async () => {
    try {
      await toggleRecording(cameraId, isRecording);
      toast.success(isRecording ? "Recording stopped" : "Recording started");
    } catch (error) {
      console.error("Error toggling recording:", error);
      toast.error("Failed to toggle recording");
    }
  };

  const handleShare = async () => {
    try {
      await shareRecording(cameraId);
      toast.success("Recording shared successfully");
    } catch (error) {
      console.error("Error sharing recording:", error);
      toast.error("Failed to share recording");
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to remove this camera?')) {
      try {
        await deleteCamera(cameraId);
      } catch (error) {
        console.error("Error deleting camera:", error);
        toast.error("Failed to delete camera");
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRecordingToggle}
          className={isRecording ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}
        >
          {isRecording ? (
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
          className={status === 'active' ? 'text-green-500 hover:text-green-600' : 'text-red-500 hover:text-red-600'}
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
        <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
      
      <div className="flex items-center gap-2 mt-2">
        <Settings size={16} className="text-gray-500 flex-shrink-0" />
        <Select
          defaultValue={processorType || 'none'}
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
    </>
  );
};

export default CameraControls;
