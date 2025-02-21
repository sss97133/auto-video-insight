
import React from "react";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface DeviceSelectorsProps {
  devices: {
    videoDevices: MediaDevice[];
    audioDevices: MediaDevice[];
  };
  selectedDevices: {
    videoDeviceId: string;
    audioDeviceId: string;
  };
  onDeviceChange: (type: "video" | "audio", value: string) => void;
}

const DeviceSelectors = ({ devices, selectedDevices, onDeviceChange }: DeviceSelectorsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Camera</Label>
        <Select
          value={selectedDevices.videoDeviceId}
          onValueChange={(value) => onDeviceChange("video", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select camera" />
          </SelectTrigger>
          <SelectContent>
            {devices.videoDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Microphone</Label>
        <Select
          value={selectedDevices.audioDeviceId}
          onValueChange={(value) => onDeviceChange("audio", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select microphone" />
          </SelectTrigger>
          <SelectContent>
            {devices.audioDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default DeviceSelectors;
