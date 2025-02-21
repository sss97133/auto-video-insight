
import React, { useEffect } from "react";
import { Webcam } from "lucide-react";
import { CameraVideoProps } from "@/types/camera-video";
import { useWebcam } from "@/hooks/useWebcam";
import { useFrameProcessor } from "@/hooks/useFrameProcessor";
import DetectedLabels from "./camera/DetectedLabels";

const CameraVideo = ({ streamingUrl, isActive }: CameraVideoProps) => {
  const { videoRef, hasPermission, initializeWebcam, stopWebcam } = useWebcam();
  const { canvasRef, detectedLabels, startFrameProcessing, stopFrameProcessing } = useFrameProcessor();

  useEffect(() => {
    console.log("CameraVideo useEffect triggered:", {
      isActive,
      hasVideoRef: !!videoRef.current,
      hasPermission
    });

    let stream: MediaStream | null = null;

    const setup = async () => {
      if (isActive) {
        stream = await initializeWebcam();
        if (stream && videoRef.current) {
          videoRef.current.onplaying = () => {
            console.log("Video stream started, beginning frame processing");
            startFrameProcessing(videoRef, isActive);
          };
        }
      }
    };

    setup();

    return () => {
      stopFrameProcessing();
      if (stream) {
        stopWebcam(stream);
      }
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
          <DetectedLabels labels={detectedLabels} />
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
