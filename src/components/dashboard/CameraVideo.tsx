
import React, { useEffect, useRef, useState } from "react";
import { Webcam } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CameraVideoProps {
  streamingUrl: string | null;
  isActive: boolean;
}

interface DetectedLabel {
  name: string;
  confidence: number;
}

const CameraVideo = ({ streamingUrl, isActive }: CameraVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [detectedLabels, setDetectedLabels] = useState<DetectedLabel[]>([]);

  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !processingRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });

    if (!blob) return;

    try {
      // Call the detect-license-plate function (which also handles general object detection)
      const { data, error } = await supabase.functions.invoke('detect-license-plate', {
        body: {
          image: await blob.arrayBuffer(),
          detectObjects: true
        }
      });

      if (error) {
        console.error('Error analyzing frame:', error);
        return;
      }

      if (data?.Labels) {
        setDetectedLabels(data.Labels.map((label: any) => ({
          name: label.Name,
          confidence: label.Confidence
        })));
      }

    } catch (error) {
      console.error('Failed to analyze frame:', error);
    }

    // Schedule next frame if still processing
    if (processingRef.current) {
      requestAnimationFrame(captureAndAnalyzeFrame);
    }
  };

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
      
      setHasPermission(true);
      
      console.log("Webcam access granted, initializing video element");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Webcam stream started successfully");
              processingRef.current = true;
              captureAndAnalyzeFrame();
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
    processingRef.current = false;
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });
      videoRef.current.srcObject = null;
      setDetectedLabels([]);
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

    return () => {
      stopWebcam();
    };
  }, [isActive]);

  return (
    <div className="aspect-video bg-gray-800 rounded-lg mb-3 relative w-full h-[200px]">
      <canvas ref={canvasRef} className="hidden" />
      {isActive ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full rounded-lg object-cover"
            autoPlay
            playsInline
            muted
          />
          {detectedLabels.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
              <p className="font-semibold">Detected Objects:</p>
              <div className="flex flex-wrap gap-1">
                {detectedLabels.map((label, index) => (
                  <span key={index} className="bg-blue-500 bg-opacity-50 px-2 py-1 rounded">
                    {label.name} ({label.confidence.toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
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

