
import { useState } from "react";
import { toast } from "sonner";

interface UseStreamingControlsProps {
  rtmpServerUrl: string;
  streamKey: string;
}

export const useStreamingControls = ({ rtmpServerUrl, streamKey }: UseStreamingControlsProps) => {
  const [isStreaming, setIsStreaming] = useState(false);

  const startStreaming = async () => {
    try {
      setIsStreaming(true);
      toast.success("Streaming started! (Demo only)");
      console.log("Streaming to:", `${rtmpServerUrl}/${streamKey}`);
    } catch (error) {
      console.error("Error starting stream:", error);
      toast.error("Failed to start streaming");
    }
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    toast.success("Streaming stopped");
  };

  return {
    isStreaming,
    startStreaming,
    stopStreaming,
  };
};
