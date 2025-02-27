
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DirectUrlForm from "./camera/DirectUrlForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CameraModal({ isOpen, onClose }: CameraModalProps) {
  const [type, setType] = useState("ip");
  const [streamingUrl, setStreamingUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!streamingUrl) {
      toast.error("Please enter a streaming URL");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Adding new camera with URL:", streamingUrl);
      
      const { error } = await supabase.from('cameras').insert({
        type: type,
        streaming_url: streamingUrl,
        status: 'active',
        name: `Camera ${new Date().getTime()}`,
        location: 'Default Location',
        is_recording: false,
        configuration: {
          processor_type: 'none',
          settings: {
            frameRate: 30,
            resolution: '1080p',
          }
        }
      });

      if (error) {
        console.error("Error adding camera:", error);
        throw error;
      }

      toast.success("Camera added successfully");
      onClose();
    } catch (error) {
      console.error("Failed to add camera:", error);
      toast.error("Failed to add camera");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Camera</DialogTitle>
          <DialogDescription>
            Configure your camera stream settings. Choose your camera type and enter the streaming URL.
          </DialogDescription>
        </DialogHeader>
        <DirectUrlForm
          type={type}
          setType={setType}
          streamingUrl={streamingUrl}
          setStreamingUrl={setStreamingUrl}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Add Camera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
