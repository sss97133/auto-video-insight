
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "./ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import StreamingSoftwareForm from "./camera/StreamingSoftwareForm";
import DirectUrlForm from "./camera/DirectUrlForm";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CameraModal = ({ isOpen, onClose }: CameraModalProps) => {
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [type, setType] = React.useState("rtmp");
  const [streamingUrl, setStreamingUrl] = React.useState("");
  const [streamKey] = React.useState(() => crypto.randomUUID());
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
              rtmp_url: process.env.VITE_RTMP_SERVER_URL || "rtmp://your-rtmp-server-url/live"
            },
            streaming_url: type === 'rtmp' 
              ? `${process.env.VITE_RTMP_SERVER_URL || "rtmp://your-rtmp-server-url/live"}/${streamKey}` 
              : streamingUrl
          }
        ]);

      if (error) throw error;

      toast.success("Camera added successfully");
      onClose();
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

  const rtmpServerUrl = process.env.VITE_RTMP_SERVER_URL || "rtmp://your-rtmp-server-url/live";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Camera</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="software" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="software">Streaming Software</TabsTrigger>
            <TabsTrigger value="direct">Direct URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="software">
            <StreamingSoftwareForm
              name={name}
              setName={setName}
              location={location}
              setLocation={setLocation}
              streamKey={streamKey}
              rtmpServerUrl={rtmpServerUrl}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onClose={onClose}
            />
          </TabsContent>

          <TabsContent value="direct">
            <DirectUrlForm
              name={name}
              setName={setName}
              location={location}
              setLocation={setLocation}
              type={type}
              setType={setType}
              streamingUrl={streamingUrl}
              setStreamingUrl={setStreamingUrl}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onClose={onClose}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CameraModal;
