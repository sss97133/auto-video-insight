
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UseAddCameraParams {
  onSuccess?: () => void;
}

export const useAddCamera = ({ onSuccess }: UseAddCameraParams = {}) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("rtmp");
  const [streamingUrl, setStreamingUrl] = useState("");
  const [streamKey] = useState(() => crypto.randomUUID());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStreamingUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !location.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (type !== 'rtmp' && !validateStreamingUrl(streamingUrl)) {
      toast.error("Please enter a valid streaming URL");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('cameras')
        .insert([
          { 
            name: name.trim(),
            location: location.trim(),
            type,
            status: 'inactive',
            configuration: {
              stream_key: streamKey,
              rtmp_url: import.meta.env.VITE_RTMP_SERVER_URL || "rtmp://your-rtmp-server-url/live"
            },
            streaming_url: type === 'rtmp' 
              ? `${import.meta.env.VITE_RTMP_SERVER_URL || "rtmp://your-rtmp-server-url/live"}/${streamKey}` 
              : streamingUrl
          }
        ]);

      if (error) throw error;

      toast.success("Camera added successfully");
      onSuccess?.();
      setName("");
      setLocation("");
      setType("rtmp");
      setStreamingUrl("");
    } catch (error) {
      console.error("Error adding camera:", error);
      toast.error("Failed to add camera");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    name,
    setName,
    location,
    setLocation,
    type,
    setType,
    streamingUrl,
    setStreamingUrl,
    streamKey,
    isSubmitting,
    handleSubmit
  };
};
