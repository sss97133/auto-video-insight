
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "./ui/tabs";
import StreamingSoftwareForm from "./camera/StreamingSoftwareForm";
import DirectUrlForm from "./camera/DirectUrlForm";
import { useAddCamera } from "@/hooks/useAddCamera";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CameraModal = ({ isOpen, onClose }: CameraModalProps) => {
  const {
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
  } = useAddCamera({
    onSuccess: onClose
  });

  const rtmpServerUrl = import.meta.env.VITE_RTMP_SERVER_URL || "rtmp://your-rtmp-server-url/live";

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
