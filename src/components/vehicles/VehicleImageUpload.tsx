
import React from "react";
import { Upload } from "lucide-react";
import { Button } from "../ui/button";
import { useVehicleUpload } from "./upload/useVehicleUpload";
import { UploadProgress } from "./upload/UploadProgress";

const VehicleImageUpload = () => {
  const { selectedImage, progress, error, handleImageUpload } = useVehicleUpload();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          id="image-upload"
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById('image-upload')?.click()}
          className="flex items-center gap-2"
        >
          <Upload size={16} />
          Test with Image
        </Button>
      </div>

      {selectedImage && (
        <UploadProgress
          imageUrl={selectedImage}
          progress={progress}
          error={error}
        />
      )}
    </div>
  );
};

export default VehicleImageUpload;
