
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { toast } from "sonner";

interface MediaDevice {
  deviceId: string;
  label: string;
}

const BrowserStreaming = ({ 
  rtmpServerUrl,
  streamKey,
}: {
  rtmpServerUrl: string;
  streamKey: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [devices, setDevices] = useState<{
    videoDevices: MediaDevice[];
    audioDevices: MediaDevice[];
  }>({
    videoDevices: [],
    audioDevices: [],
  });
  const [selectedDevices, setSelectedDevices] = useState({
    videoDeviceId: "",
    audioDeviceId: "",
  });

  useEffect(() => {
    const loadDevices = async () => {
      try {
        // Request permission to access devices
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Immediately use this stream for preview
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          mediaStreamRef.current = stream;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        const audioDevices = devices.filter(device => device.kind === "audioinput");
        
        setDevices({
          videoDevices: videoDevices.map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`,
          })),
          audioDevices: audioDevices.map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
          })),
        });

        // Set default devices
        if (videoDevices.length > 0) {
          setSelectedDevices(prev => ({
            ...prev,
            videoDeviceId: videoDevices[0].deviceId,
          }));
        }
        if (audioDevices.length > 0) {
          setSelectedDevices(prev => ({
            ...prev,
            audioDeviceId: audioDevices[0].deviceId,
          }));
        }
      } catch (error) {
        console.error("Error loading devices:", error);
        toast.error("Failed to access camera/microphone");
      }
    };

    loadDevices();

    // Cleanup
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  const stopPreview = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startStreaming = async () => {
    try {
      // In a real implementation, you would:
      // 1. Set up a WebSocket connection to your streaming server
      // 2. Convert the MediaStream to the appropriate format
      // 3. Send the stream data to your RTMP server
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

  // Listen for device selection changes
  useEffect(() => {
    if (selectedDevices.videoDeviceId || selectedDevices.audioDeviceId) {
      startPreview();
    }
  }, [selectedDevices.videoDeviceId, selectedDevices.audioDeviceId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Camera</Label>
          <Select
            value={selectedDevices.videoDeviceId}
            onValueChange={(value) => {
              setSelectedDevices(prev => ({ ...prev, videoDeviceId: value }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {devices.videoDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Microphone</Label>
          <Select
            value={selectedDevices.audioDeviceId}
            onValueChange={(value) => {
              setSelectedDevices(prev => ({ ...prev, audioDeviceId: value }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select microphone" />
            </SelectTrigger>
            <SelectContent>
              {devices.audioDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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

