
import React, { useRef, useEffect } from 'react';
import { CameraVideoProps } from '@/types/camera-video';

const CameraVideo = ({ streamingUrl, isActive }: CameraVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!streamingUrl || !isActive) return;

    console.log("Attempting to play stream from URL:", streamingUrl);
    
    if (videoRef.current) {
      videoRef.current.src = streamingUrl;
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing video:", error);
        });
      }
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
    };
  }, [streamingUrl, isActive]);

  if (!streamingUrl || !isActive) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
        Stream not available
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        autoPlay
        muted
        controls
      />
    </div>
  );
};

export default CameraVideo;
