
import React from "react";
import { Button } from "../ui/button";
import { Camera } from "lucide-react";
import CameraCard from "./CameraCard";

interface CameraGridProps {
  cameras: any[] | undefined;
  isLoading: boolean;
  onAddCamera: () => void;
}

const CameraGrid = ({ cameras, isLoading, onAddCamera }: CameraGridProps) => {
  return (
    <section className="lg:col-span-2 fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Live Feeds</h2>
        <Button 
          onClick={onAddCamera}
          className="flex items-center gap-2"
        >
          <Camera size={18} />
          Add Camera
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <p className="col-span-full text-center text-gray-600">Loading cameras...</p>
        ) : cameras && cameras.length > 0 ? (
          cameras.map((camera) => (
            <CameraCard key={camera.id} camera={camera} />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-600">No cameras found</p>
        )}
      </div>
    </section>
  );
};

export default CameraGrid;
