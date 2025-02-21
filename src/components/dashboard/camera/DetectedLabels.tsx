
import React from 'react';
import { DetectedLabel } from '@/types/camera-video';

interface DetectedLabelsProps {
  labels: DetectedLabel[];
}

const DetectedLabels = ({ labels }: DetectedLabelsProps) => {
  if (labels.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
      <p className="font-semibold">Detected Objects:</p>
      <div className="flex flex-wrap gap-1">
        {labels.map((label, index) => (
          <span key={index} className="bg-blue-500 bg-opacity-50 px-2 py-1 rounded">
            {label.name} ({label.confidence.toFixed(0)}%)
          </span>
        ))}
      </div>
    </div>
  );
};

export default DetectedLabels;
