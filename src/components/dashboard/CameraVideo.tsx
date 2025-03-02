
import React, { useEffect, useState } from "react";
import { Webcam } from "lucide-react";
import { CameraVideoProps } from "@/types/camera-video";
import { useWebcam } from "@/hooks/useWebcam";
import { useFrameProcessor } from "@/hooks/useFrameProcessor";
import DetectedLabels from "./camera/DetectedLabels";

const CameraVideo = ({ streamingUrl, isActive }: CameraVideoProps) => {
  const { videoRef, hasPermission, initializeWebcam, stopWebcam } = useWebcam();
  const { canvasRef, detectedLabels, startFrameProcessing, stopFrameProcessing } = useFrameProcessor();
  const [isWebcam, setIsWebcam] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("CameraVideo useEffect triggered:", {
      isActive,
      streamingUrl,
      isWebcam
    });

    let stream: MediaStream | null = null;
    setIsLoading(true);

    const setup = async () => {
      if (!isActive) {
        setIsLoading(false);
        return;
      }

      try {
        if (!streamingUrl) {
          // If no URL is provided, try to use webcam
          console.log("No streaming URL provided, initializing webcam");
          setIsWebcam(true);
          setError(null);
          
          stream = await initializeWebcam();
          
          if (stream && videoRef.current) {
            videoRef.current.onplaying = () => {
              console.log("Webcam stream started, beginning frame processing");
              startFrameProcessing(videoRef, isActive);
              setIsLoading(false);
            };
          }
        } else {
          // Handle external stream URL
          console.log("Initializing stream from URL:", streamingUrl);
          setIsWebcam(false);
          setError(null);
          
          if (videoRef.current) {
            videoRef.current.src = streamingUrl;
            
            videoRef.current.onplaying = () => {
              console.log("External stream started successfully");
              setIsLoading(false);
            };
            
            videoRef.current.onerror = (e) => {
              console.error("Error loading video stream:", e);
              setError("Failed to load video stream. Please check the URL and try again.");
              setIsLoading(false);
            };
            
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error("Error playing stream:", error);
                if (error.name === "NotSupportedError") {
                  setError("This video format is not supported by your browser.");
                } else if (error.name === "NotAllowedError") {
                  setError("Autoplay is disabled. Please enable autoplay for this site.");
                } else {
                  setError("Failed to play video stream. Please check the URL and try again.");
                }
                setIsLoading(false);
              });
            }
          }
        }
      } catch (error) {
        console.error("Setup error:", error);
        setError("Failed to initialize video stream");
        setIsLoading(false);
      }
    };

    setup();

    return () => {
      stopFrameProcessing();
      if (stream && isWebcam) {
        stopWebcam(stream);
      }
      if (videoRef.current) {
        videoRef.current.onplaying = null;
        videoRef.current.onerror = null;
        videoRef.current.pause();
        videoRef.current.src = "";
      }
    };
  }, [isActive, streamingUrl]);

  if (!isActive) {
    return (
      <div className="aspect-video bg-gray-800 rounded-lg mb-3 relative w-full h-[200px] flex items-center justify-center text-gray-400">
        <Webcam size={40} />
      </div>
    );
  }

  return (
    <div className="aspect-video bg-gray-800 rounded-lg mb-3 relative w-full h-[200px]">
      <canvas ref={canvasRef} className="hidden" />
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full rounded-lg object-cover"
        autoPlay
        playsInline
        muted
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 text-white">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
            <p>Loading stream...</p>
          </div>
        </div>
      )}
      
      {isWebcam && !isLoading && <DetectedLabels labels={detectedLabels} />}
      
      {hasPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 text-white text-center p-4">
          <p>Camera access denied. Please check your browser permissions.</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 text-white text-center p-4">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default CameraVideo;
