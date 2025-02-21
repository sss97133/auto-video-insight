
import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";

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
  const handleUrlChange = (url: string) => {
    // Convert Twitch URLs to embed format if needed
    if (url.includes('twitch.tv')) {
      try {
        const twitchUrl = new URL(url);
        const channelName = twitchUrl.pathname.split('/').filter(Boolean)[0];
        if (channelName) {
          const embedUrl = `https://player.twitch.tv/?channel=${channelName}&parent=${window.location.hostname}`;
          console.log("Converting Twitch URL to embed URL:", embedUrl);
          setStreamingUrl(embedUrl);
          return;
        }
      } catch (error) {
        console.error("Error parsing Twitch URL:", error);
        toast.error("Invalid Twitch URL format");
      }
    }
    setStreamingUrl(url);
  };

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
            <SelectItem value="twitch">Twitch Stream</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="streamingUrl">Streaming URL</Label>
        <Input
          id="streamingUrl"
          value={streamingUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={type === 'twitch' ? "Enter Twitch channel URL (e.g., https://twitch.tv/channelname)" : "Enter streaming URL"}
          required
        />
        {type === 'twitch' && (
          <p className="text-sm text-gray-500 mt-1">
            Enter your Twitch channel URL and it will be automatically converted to the correct embed format
          </p>
        )}
      </div>
    </div>
  );
};

export default DirectUrlForm;
