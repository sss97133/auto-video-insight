
import React, { useEffect, useRef, useState } from "react";
import { Webcam } from "lucide-react";
import { toast } from "sonner";

interface CameraVideoProps {
  streamingUrl: string | null;
  isActive: boolean;
}

const CameraVideo = ({ streamingUrl, isActive }: CameraVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const initializeWebcam = async () => {
    if (!videoRef.current) {
      console.log("Video initialization skipped - missing ref");
      return;
    }

    // Clear any existing stream first
    stopWebcam();

    try {
      console.log("Requesting webcam access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      // Set permission state
      setHasPermission(true);
      
      console.log("Webcam access granted, initializing video element");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Webcam stream started successfully");
            })
            .catch(error => {
              console.error("Webcam playback failed:", error);
              toast.error("Failed to start webcam stream");
            });
        }
      }
    } catch (error) {
      console.error("Failed to initialize webcam:", error);
      setHasPermission(false);
      
      // Check for specific permission errors
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          toast.error("Camera access denied. Please grant camera permissions to use this feature.");
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          toast.error("No camera device found. Please connect a camera and try again.");
        } else {
          toast.error("Failed to access webcam. Please check your camera settings.");
        }
      }
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });
      videoRef.current.srcObject = null;
      console.log("Webcam stream stopped and cleaned up");
    }
  };

  useEffect(() => {
    console.log("CameraVideo useEffect triggered:", {
      isActive,
      hasVideoRef: !!videoRef.current,
      hasPermission
    });

    if (isActive) {
      initializeWebcam();
    } else {
      stopWebcam();
    }

    // Cleanup on unmount or when camera becomes inactive
    return () => {
      stopWebcam();
    };
  }, [isActive]);

  return (
    <div className="aspect-video bg-gray-800 rounded-lg mb-3 relative w-full h-[200px]">
      {isActive ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full rounded-lg object-cover"
          autoPlay
          playsInline
          muted
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <Webcam size={40} />
        </div>
      )}
      {hasPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 text-white text-center p-4">
          <p>Camera access denied. Please check your browser permissions.</p>
        </div>
      )}
    </div>
  );
};

export default CameraVideo;
