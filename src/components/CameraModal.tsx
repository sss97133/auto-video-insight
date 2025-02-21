
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "./ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Copy } from "lucide-react";

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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

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
            status: 'inactive', // Start cameras as inactive by default
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
          
          <TabsContent value="software" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
              
              <div className="space-y-2">
                <Label>RTMP URL</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={rtmpServerUrl}
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyToClipboard(rtmpServerUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Stream Key</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="password"
                    value={streamKey}
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyToClipboard(streamKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Use these credentials in your streaming software (like OBS Studio)
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Camera"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="direct" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="type">Camera Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select camera type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ip">IP Camera</SelectItem>
                    <SelectItem value="rtsp">RTSP Stream</SelectItem>
                    <SelectItem value="rtmp">RTMP Stream</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="streamingUrl">Streaming URL</Label>
                <Input
                  id="streamingUrl"
                  value={streamingUrl}
                  onChange={(e) => setStreamingUrl(e.target.value)}
                  placeholder="Enter streaming URL (e.g., rtsp:// or http://)"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Camera"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CameraModal;
