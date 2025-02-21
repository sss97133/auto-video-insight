
import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface StreamingSoftwareFormProps {
  name: string;
  setName: (name: string) => void;
  location: string;
  setLocation: (location: string) => void;
  streamKey: string;
  rtmpServerUrl: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

const StreamingSoftwareForm = ({
  name,
  setName,
  location,
  setLocation,
  streamKey,
  rtmpServerUrl,
  isSubmitting,
  onSubmit,
  onClose,
}: StreamingSoftwareFormProps) => {
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
  );
};

export default StreamingSoftwareForm;
