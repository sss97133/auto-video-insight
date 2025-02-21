
import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface StreamingSoftwareFormProps {
  streamKey: string;
  rtmpServerUrl: string;
  isSubmitting: boolean;
  onClose: () => void;
}

const StreamingSoftwareForm = ({
  streamKey,
  rtmpServerUrl,
  isSubmitting,
}: StreamingSoftwareFormProps) => {
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default StreamingSoftwareForm;
