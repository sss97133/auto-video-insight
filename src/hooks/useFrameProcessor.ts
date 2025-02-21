
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DetectedLabel } from '@/types/camera-video';

export const useFrameProcessor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef<boolean>(false);
  const frameProcessingInterval = useRef<number>();
  const [detectedLabels, setDetectedLabels] = useState<DetectedLabel[]>([]);

  const captureAndAnalyzeFrame = async (videoRef: React.RefObject<HTMLVideoElement>, isActive: boolean) => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });

    if (!blob) return;

    try {
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
  };

  const startFrameProcessing = (videoRef: React.RefObject<HTMLVideoElement>, isActive: boolean) => {
    if (!processingRef.current) {
      processingRef.current = true;
      frameProcessingInterval.current = window.setInterval(
        () => captureAndAnalyzeFrame(videoRef, isActive),
        1000
      );
    }
  };

  const stopFrameProcessing = () => {
    processingRef.current = false;
    if (frameProcessingInterval.current) {
      clearInterval(frameProcessingInterval.current);
      frameProcessingInterval.current = undefined;
    }
    setDetectedLabels([]);
  };

  return {
    canvasRef,
    detectedLabels,
    startFrameProcessing,
    stopFrameProcessing
  };
};
