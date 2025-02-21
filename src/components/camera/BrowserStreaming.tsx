
import React, { useEffect } from "react";
import { Button } from "../ui/button";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useStreamingControls } from "@/hooks/useStreamingControls";
import DeviceSelectors from "./DeviceSelectors";
import { toast } from "sonner";

interface BrowserStreamingProps {
  rtmpServerUrl: string;
  streamKey: string;
}

const BrowserStreaming = ({ rtmpServerUrl, streamKey }: BrowserStreamingProps) => {
  const {
    devices,
    selectedDevices,
    setSelectedDevices,
    videoRef,
    mediaStreamRef,
  } = useMediaDevices();

  const { isStreaming, startStreaming, stopStreaming } = useStreamingControls({
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
    <div className="space-y-4">
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

      <div className="flex justify-end space-x-2">
        <Button
          variant={isStreaming ? "destructive" : "default"}
          onClick={isStreaming ? stopStreaming : startStreaming}
        >
          {isStreaming ? "Stop Streaming" : "Start Streaming"}
        </Button>
      </div>
    </div>
  );
};

export default BrowserStreaming;
