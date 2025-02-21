
import { useState } from "react";
import { toast } from "sonner";

interface UseStreamingControlsProps {
  rtmpServerUrl: string;
  streamKey: string;
}

export const useStreamingControls = ({ rtmpServerUrl, streamKey }: UseStreamingControlsProps) => {
  const [isConnectionTested, setIsConnectionTested] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const testConnection = async () => {
    try {
      setIsConnecting(true);
      // Simulate connection test with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsConnectionTested(true);
      toast.success("Connection test successful!");
      console.log("Test connection to:", `${rtmpServerUrl}/${streamKey}`);
    } catch (error) {
      console.error("Error testing connection:", error);
      toast.error("Failed to test connection");
      setIsConnectionTested(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const resetConnection = () => {
    setIsConnectionTested(false);
  };

  return {
    isConnectionTested,
    isConnecting,
    testConnection,
    resetConnection,
  };
};
