
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProgressState {
  upload: 'pending' | 'processing' | 'complete' | 'error';
  recognition: 'pending' | 'processing' | 'complete' | 'error';
  saving: 'pending' | 'processing' | 'complete' | 'error';
}

export const useVehicleUpload = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>({
    upload: 'pending',
    recognition: 'pending',
    saving: 'pending'
  });
  const [error, setError] = useState<string | null>(null);

  const sanitizeFileName = (fileName: string) => {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  };

  const handleImageUpload = async (file: File) => {
    if (!file) {
      toast.error('No file selected');
      return;
    }

    setProgress({
      upload: 'processing',
      recognition: 'pending',
      saving: 'pending'
    });
    setError(null);
    setSelectedImage(URL.createObjectURL(file));

    try {
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}-${sanitizedName}`;
      
      console.log('Starting upload for file:', {
        originalName: file.name,
        sanitizedName,
        fileName,
        size: file.size,
        type: file.type
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', {
          error: uploadError,
          message: uploadError.message
        });
        setProgress(prev => ({ ...prev, upload: 'error' }));
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProgress(prev => ({ ...prev, upload: 'complete', recognition: 'processing' }));
      console.log('Upload successful:', {
        path: uploadData?.path,
        fullPath: uploadData?.fullPath,
      });

      const { data: urlData } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(uploadData.path);

      if (!urlData.publicUrl) {
        console.error('Failed to get public URL');
        setProgress(prev => ({ ...prev, recognition: 'error' }));
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('Image public URL:', urlData.publicUrl);
      console.log('Starting license plate and vehicle detection...');

      const response = await supabase.functions.invoke('detect-license-plate', {
        body: { image_url: urlData.publicUrl }
      });

      console.log('Edge function response:', {
        error: response.error,
        data: response.data,
      });

      if (response.error) {
        console.error('Edge function error:', {
          error: response.error,
          message: response.error.message || 'Unknown error'
        });
        setProgress(prev => ({ ...prev, recognition: 'error' }));
        throw new Error(`Detection failed: ${response.error.message || 'Unknown error'}`);
      }

      const detectionData = response.data;
      if (!detectionData) {
        console.error('No detection data received from edge function');
        setProgress(prev => ({ ...prev, recognition: 'error' }));
        throw new Error('No data received from detection service');
      }

      console.log('Detection data:', detectionData);
      setProgress(prev => ({ ...prev, recognition: 'complete', saving: 'processing' }));
      
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
        console.error('Database insert error:', {
          error: insertError,
          message: insertError.message
        });
        setProgress(prev => ({ ...prev, saving: 'error' }));
        throw new Error(`Failed to save vehicle data: ${insertError.message}`);
      }

      setProgress(prev => ({ ...prev, saving: 'complete' }));
      toast.success(`Vehicle detected: ${detectionData.vehicle_type}`);

    } catch (error) {
      console.error('Process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return {
    selectedImage,
    progress,
    error,
    handleImageUpload
  };
};
