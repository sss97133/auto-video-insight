
import React from "react";
import { Upload } from "lucide-react";
import { Button } from "../ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VehicleImageUpload = () => {
  const sanitizeFileName = (fileName: string) => {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error('No file selected');
      return;
    }

    const loadingToast = toast.loading('Processing image...');

    try {
      // Sanitize and create filename
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}-${sanitizedName}`;
      
      console.log('Starting upload for file:', fileName);

      // Upload image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(uploadData.path);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('Starting license plate detection...');

      // Process image with edge function, sending only the URL as a string
      const { data, error: detectionError } = await supabase.functions
        .invoke('detect-license-plate', {
          body: JSON.stringify({ image_url: urlData.publicUrl })
        });

      if (detectionError) {
        throw new Error(`Detection failed: ${detectionError.message}`);
      }

      if (!data) {
        throw new Error('No data received from detection service');
      }

      console.log('Detection completed successfully:', data);
      toast.dismiss(loadingToast);
      toast.success('Vehicle processed successfully');

    } catch (error) {
      console.error('Process failed:', error);
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
