
import React from "react";
import { Upload } from "lucide-react";
import { Button } from "../ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VehicleImageUpload = () => {
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error('No file selected');
      return;
    }

    const loadingToast = toast.loading('Processing image...');

    try {
      // Upload image
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(`${Date.now()}-${file.name}`, file);

      if (uploadError) {
        throw new Error('Failed to upload image to storage');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(uploadData.path);

      // Process image with edge function
      const { data: detectionData, error: detectionError } = await supabase.functions
        .invoke('detect-license-plate', {
          body: {
            image_url: publicUrl,
            camera_id: null // Manual upload
          }
        });

      if (detectionError) {
        throw new Error('Failed to process image');
      }

      toast.dismiss(loadingToast);
      toast.success('Vehicle processed successfully');

    } catch (error) {
      console.error('Error:', error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Failed to process image');
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
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
  );
};

export default VehicleImageUpload;

