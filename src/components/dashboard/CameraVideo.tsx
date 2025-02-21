
import React, { useEffect, useRef } from "react";
import { Video } from "lucide-react";
import { toast } from "sonner";

interface CameraVideoProps {
  streamingUrl: string | null;
  isActive: boolean;
}

const CameraVideo = ({ streamingUrl, isActive }: CameraVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const initializeVideo = async () => {
    if (!videoRef.current || !streamingUrl) return;

    try {
      // Reset video element
      videoRef.current.src = '';
      videoRef.current.load();

      // Set new source and play
      videoRef.current.src = streamingUrl;
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing video:", error);
          toast.error("Failed to start video stream");
        });
      }
    } catch (error) {
      console.error("Error initializing video:", error);
      toast.error("Failed to initialize video stream");
    }
  };

  useEffect(() => {
    if (isActive) {
      console.log("Initializing video with URL:", streamingUrl);
      initializeVideo();
    } else {
      // Stop video if camera is not active
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    }

    return () => {
      // Cleanup on unmount
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, [streamingUrl, isActive]);

  return (
    <div className="aspect-video bg-gray-800 rounded-lg mb-3 relative w-full h-[200px]">
      {streamingUrl ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full rounded-lg object-cover"
          autoPlay
          playsInline
          muted
          controls
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <Video size={40} />
        </div>
      )}
    </div>
  );
};

export default CameraVideo;
