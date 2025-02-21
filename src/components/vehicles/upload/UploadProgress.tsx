
import React from "react";
import { Card, CardContent } from "../../ui/card";
import { ProgressItem } from "./ProgressItem";

interface ProgressState {
  upload: 'pending' | 'processing' | 'complete' | 'error';
  recognition: 'pending' | 'processing' | 'complete' | 'error';
  saving: 'pending' | 'processing' | 'complete' | 'error';
}

interface UploadProgressProps {
  imageUrl: string;
  progress: ProgressState;
  error: string | null;
}

export const UploadProgress = ({ imageUrl, progress, error }: UploadProgressProps) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4 space-y-4">
      <img 
        src={imageUrl} 
        alt="Selected vehicle" 
        className="w-full h-48 object-cover rounded-md"
      />
      <div className="space-y-2">
        <ProgressItem status={progress.upload} label="Uploading image" />
        <ProgressItem status={progress.recognition} label="Processing with AWS Rekognition" />
        <ProgressItem status={progress.saving} label="Saving results" />
        {error && (
          <div className="text-sm text-red-500 mt-2">
            Error: {error}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);
