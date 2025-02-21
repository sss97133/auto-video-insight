
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export const useWebcam = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const initializeWebcam = async () => {
    if (!videoRef.current) {
      console.log("Video initialization skipped - missing ref");
      return;
    }

    try {
      console.log("Requesting webcam access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      setHasPermission(true);
      
      console.log("Webcam access granted, initializing video element");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Webcam playback failed:", error);
            toast.error("Failed to start webcam stream");
          });
        }
        return stream;
      }
    } catch (error) {
      console.error("Failed to initialize webcam:", error);
      setHasPermission(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          toast.error("Camera access denied. Please grant camera permissions to use this feature.");
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          toast.error("No camera device found. Please connect a camera and try again.");
        } else {
          toast.error("Failed to access webcam. Please check your camera settings.");
        }
      }
      return null;
    }
  };

  const stopWebcam = (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      console.log("Webcam stream stopped and cleaned up");
    }
  };

  return {
    videoRef,
    hasPermission,
    initializeWebcam,
    stopWebcam
  };
};
