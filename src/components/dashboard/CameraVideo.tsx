
import React, { useEffect, useRef } from "react";
import { Webcam } from "lucide-react";
import { toast } from "sonner";

interface CameraVideoProps {
  streamingUrl: string | null;
  isActive: boolean;
}

const CameraVideo = ({ streamingUrl, isActive }: CameraVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

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
      
      console.log("Webcam access granted, initializing video element");
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
    } catch (error) {
      console.error("Failed to initialize webcam:", error);
      toast.error("Failed to access webcam. Please ensure you have granted camera permissions.");
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      console.log("Webcam stream stopped");
    }
  };

  useEffect(() => {
    console.log("CameraVideo useEffect triggered:", {
      isActive,
      hasVideoRef: !!videoRef.current
    });

    if (isActive) {
      initializeWebcam();
    } else {
      stopWebcam();
    }

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
    </div>
  );
};

export default CameraVideo;

