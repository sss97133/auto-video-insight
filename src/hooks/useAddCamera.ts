
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
    
    console.log("Form submission started with:", { name, location, type, streamingUrl });

    if (!name.trim() || !location.trim()) {
      console.log("Validation failed: missing name or location");
      toast.error("Please fill in all required fields");
      return;
    }

    if (type !== 'rtmp' && !validateStreamingUrl(streamingUrl)) {
      console.log("Validation failed: invalid streaming URL");
      toast.error("Please enter a valid streaming URL");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const cameraData = {
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
      };

      console.log("Attempting to insert camera with data:", cameraData);

      const { error, data } = await supabase
        .from('cameras')
        .insert([cameraData])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Camera added successfully:", data);
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
