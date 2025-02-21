
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface UseMediaDevicesReturn {
  devices: {
    videoDevices: MediaDevice[];
    audioDevices: MediaDevice[];
  };
  selectedDevices: {
    videoDeviceId: string;
    audioDeviceId: string;
  };
  setSelectedDevices: React.Dispatch<React.SetStateAction<{
    videoDeviceId: string;
    audioDeviceId: string;
  }>>;
  videoRef: React.RefObject<HTMLVideoElement>;
  mediaStreamRef: React.MutableRefObject<MediaStream | null>;
}

export const useMediaDevices = (): UseMediaDevicesReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
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

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    devices,
    selectedDevices,
    setSelectedDevices,
    videoRef,
    mediaStreamRef,
  };
};
