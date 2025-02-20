
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
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(uploadData.path);

      if (!urlData.publicUrl) {
        console.error('Failed to get public URL');
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('Image public URL:', urlData.publicUrl);
      console.log('Starting license plate and vehicle detection...');

      // Process image with edge function
      const { data: detectionData, error: detectionError } = await supabase.functions
        .invoke('detect-license-plate', {
          body: { image_url: urlData.publicUrl }
        });

      if (detectionError) {
        console.error('Detection error:', detectionError);
        throw new Error(`Detection failed: ${detectionError.message}`);
      }

      if (!detectionData) {
        console.error('No detection data received');
        throw new Error('No data received from detection service');
      }

      console.log('Detection completed successfully:', detectionData);
      
      // Insert vehicle data into database
      const { error: insertError } = await supabase
        .from('vehicles')
        .insert([{
          license_plate: detectionData.license_plate,
          confidence: detectionData.confidence,
          vehicle_type: detectionData.vehicle_type,
          image_url: urlData.publicUrl,
          vehicle_details: detectionData.vehicle_details,
          bounding_box: detectionData.bounding_box,
          last_seen: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to save vehicle data: ${insertError.message}`);
      }

      toast.dismiss(loadingToast);
      toast.success(`Vehicle detected: ${detectionData.vehicle_type}`);

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
