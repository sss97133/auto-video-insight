
import React, { useEffect } from "react";
import { Button } from "../ui/button";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useStreamingControls } from "@/hooks/useStreamingControls";
import DeviceSelectors from "./DeviceSelectors";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BrowserStreamingProps {
  rtmpServerUrl: string;
  streamKey: string;
  name: string;
  setName: (name: string) => void;
  location: string;
  setLocation: (location: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  onClose: () => void;
}

const BrowserStreaming = ({
  rtmpServerUrl,
  streamKey,
  name,
  setName,
  location,
  setLocation,
  onSubmit,
  isSubmitting,
  onClose,
}: BrowserStreamingProps) => {
  const {
    devices,
    selectedDevices,
    setSelectedDevices,
    videoRef,
    mediaStreamRef,
  } = useMediaDevices();

  const { isConnectionTested, isConnecting, testConnection } = useStreamingControls({
    rtmpServerUrl,
    streamKey,
  });

  const startPreview = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedDevices.videoDeviceId },
        audio: { deviceId: selectedDevices.audioDeviceId },
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error starting preview:", error);
      toast.error("Failed to start camera preview");
    }
  };

  useEffect(() => {
    if (selectedDevices.videoDeviceId || selectedDevices.audioDeviceId) {
      startPreview();
    }
  }, [selectedDevices.videoDeviceId, selectedDevices.audioDeviceId]);

  const handleDeviceChange = (type: "video" | "audio", value: string) => {
    setSelectedDevices(prev => ({
      ...prev,
      [type === "video" ? "videoDeviceId" : "audioDeviceId"]: value,
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DeviceSelectors
        devices={devices}
        selectedDevices={selectedDevices}
        onDeviceChange={handleDeviceChange}
      />

      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
      </div>

      <div className="grid gap-4">
        {!isConnectionTested ? (
          <Button
            type="button"
            onClick={testConnection}
            disabled={isConnecting}
            className={cn(
              "w-full transition-colors",
              isConnecting && "animate-pulse"
            )}
          >
            {isConnecting ? "Testing Connection..." : "Test Connection"}
          </Button>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 p-2 bg-green-100 text-green-700 rounded-md">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Connection established successfully
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Adding Camera..." : "Add Camera"}
            </Button>
          </>
        )}
      </div>
    </form>
  );
};

export default BrowserStreaming;
