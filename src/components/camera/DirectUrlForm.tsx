
import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface DirectUrlFormProps {
  name: string;
  setName: (name: string) => void;
  location: string;
  setLocation: (location: string) => void;
  type: string;
  setType: (type: string) => void;
  streamingUrl: string;
  setStreamingUrl: (url: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

const DirectUrlForm = ({
  name,
  setName,
  location,
  setLocation,
  type,
  setType,
  streamingUrl,
  setStreamingUrl,
  isSubmitting,
  onSubmit,
  onClose,
}: DirectUrlFormProps) => {
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
  );
};

export default DirectUrlForm;
