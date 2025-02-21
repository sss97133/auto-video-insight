
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "./ui/tabs";
import StreamingSoftwareForm from "./camera/StreamingSoftwareForm";
import DirectUrlForm from "./camera/DirectUrlForm";
import BrowserStreaming from "./camera/BrowserStreaming";
import { useAddCamera } from "@/hooks/useAddCamera";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Camera Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter camera name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter camera location"
                required
              />
            </div>
          </div>

          <Tabs defaultValue="browser" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browser">Browser</TabsTrigger>
              <TabsTrigger value="software">Software</TabsTrigger>
              <TabsTrigger value="direct">Direct URL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="browser">
              <BrowserStreaming
                rtmpServerUrl={rtmpServerUrl}
                streamKey={streamKey}
                isSubmitting={isSubmitting}
                onClose={onClose}
              />
            </TabsContent>

            <TabsContent value="software">
              <StreamingSoftwareForm
                streamKey={streamKey}
                rtmpServerUrl={rtmpServerUrl}
                isSubmitting={isSubmitting}
                onClose={onClose}
              />
            </TabsContent>

            <TabsContent value="direct">
              <DirectUrlForm
                type={type}
                setType={setType}
                streamingUrl={streamingUrl}
                setStreamingUrl={setStreamingUrl}
                isSubmitting={isSubmitting}
                onClose={onClose}
              />
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CameraModal;
