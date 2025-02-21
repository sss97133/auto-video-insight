
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CameraModal = ({ isOpen, onClose }: CameraModalProps) => {
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [type, setType] = React.useState("ip");
  const [streamingUrl, setStreamingUrl] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('cameras')
        .insert([
          { 
            name,
            location,
            type,
            status: 'active',
            configuration: {},
            streaming_url: streamingUrl
          }
        ]);

      if (error) throw error;

      toast.success("Camera added successfully");
      onClose();
      setName("");
      setLocation("");
      setType("ip");
      setStreamingUrl("");
    } catch (error) {
      toast.error("Failed to add camera");
      console.error("Error adding camera:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Camera</DialogTitle>
        </DialogHeader>
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
                <SelectItem value="usb">USB Camera</SelectItem>
                <SelectItem value="rtsp">RTSP Stream</SelectItem>
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
            <Button type="submit">Add Camera</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CameraModal;
