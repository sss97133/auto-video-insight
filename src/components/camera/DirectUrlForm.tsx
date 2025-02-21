
import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface DirectUrlFormProps {
  type: string;
  setType: (type: string) => void;
  streamingUrl: string;
  setStreamingUrl: (url: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
}

const DirectUrlForm = ({
  type,
  setType,
  streamingUrl,
  setStreamingUrl,
  isSubmitting,
}: DirectUrlFormProps) => {
  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default DirectUrlForm;
