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

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CameraModal({ isOpen, onClose }: CameraModalProps) {
  const [type, setType] = useState("ip");
  const [streamingUrl, setStreamingUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Your submit logic here
      onClose();
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
