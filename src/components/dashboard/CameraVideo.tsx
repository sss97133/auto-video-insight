
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
    if (!videoRef.current || !streamingUrl) {
      console.log("Video initialization skipped - missing ref or URL:", { 
        hasRef: !!videoRef.current, 
        streamingUrl 
      });
      return;
    }

    try {
      console.log("Starting video initialization for URL:", streamingUrl);
      
      // Reset video element first
      videoRef.current.src = '';
      videoRef.current.load();
      console.log("Video element reset");

      // Set new source
      videoRef.current.src = streamingUrl;
      console.log("New video source set:", streamingUrl);
      
      // Try to play
      console.log("Attempting to play video...");
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Video playback started successfully");
          })
          .catch(error => {
            console.error("Video playback failed:", {
              error,
              videoState: {
                readyState: videoRef.current?.readyState,
                networkState: videoRef.current?.networkState,
                error: videoRef.current?.error
              }
            });
            toast.error("Failed to start video stream");
          });
      }
    } catch (error) {
      console.error("Video initialization failed:", {
        error,
        streamingUrl,
        videoElementState: videoRef.current ? {
          readyState: videoRef.current.readyState,
          networkState: videoRef.current.networkState,
          error: videoRef.current.error
        } : 'No video element'
      });
      toast.error("Failed to initialize video stream");
    }
  };

  useEffect(() => {
    console.log("CameraVideo useEffect triggered:", {
      isActive,
      streamingUrl,
      hasVideoRef: !!videoRef.current
    });

    if (isActive) {
      initializeVideo();
    } else {
      // Stop video if camera is not active
      if (videoRef.current) {
        console.log("Stopping video playback - camera inactive");
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    }

    return () => {
      // Cleanup on unmount
      if (videoRef.current) {
        console.log("Cleaning up video element");
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, [streamingUrl, isActive]);

  console.log("CameraVideo render:", { streamingUrl, isActive });

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

