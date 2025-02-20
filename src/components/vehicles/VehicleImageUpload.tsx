
import React, { useState } from "react";
import { Upload, Check, Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "../ui/card";

interface ProgressState {
  upload: 'pending' | 'processing' | 'complete' | 'error';
  recognition: 'pending' | 'processing' | 'complete' | 'error';
  saving: 'pending' | 'processing' | 'complete' | 'error';
}

const VehicleImageUpload = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>({
    upload: 'pending',
    recognition: 'pending',
    saving: 'pending'
  });

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

    // Reset states
    setProgress({
      upload: 'processing',
      recognition: 'pending',
      saving: 'pending'
    });

    // Preview selected image
    setSelectedImage(URL.createObjectURL(file));

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
        setProgress(prev => ({ ...prev, upload: 'error' }));
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProgress(prev => ({ ...prev, upload: 'complete', recognition: 'processing' }));
      console.log('Upload successful:', uploadData);

      // Get public URL for the uploaded file
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

      // Process image with edge function
      const { data: detectionData, error: detectionError } = await supabase.functions
        .invoke('detect-license-plate', {
          body: { image_url: urlData.publicUrl }
        });

      if (detectionError) {
        console.error('Detection error:', detectionError);
        setProgress(prev => ({ ...prev, recognition: 'error' }));
        throw new Error(`Detection failed: ${detectionError.message}`);
      }

      if (!detectionData) {
        console.error('No detection data received');
        setProgress(prev => ({ ...prev, recognition: 'error' }));
        throw new Error('No data received from detection service');
      }

      setProgress(prev => ({ ...prev, recognition: 'complete', saving: 'processing' }));
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
        setProgress(prev => ({ ...prev, saving: 'error' }));
        throw new Error(`Failed to save vehicle data: ${insertError.message}`);
      }

      setProgress(prev => ({ ...prev, saving: 'complete' }));
      toast.success(`Vehicle detected: ${detectionData.vehicle_type}`);

    } catch (error) {
      console.error('Process failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process image');
      // Note: We're not resetting the states anymore, so the error state remains visible
    }
  };

  const ProgressItem = ({ status, label }: { status: 'pending' | 'processing' | 'complete' | 'error', label: string }) => (
    <div className="flex items-center gap-2">
      {status === 'complete' ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : status === 'processing' ? (
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      ) : status === 'error' ? (
        <X className="h-5 w-5 text-red-500" />
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-gray-200" />
      )}
      <span className={
        status === 'complete' ? 'text-green-500' : 
        status === 'processing' ? 'text-blue-500' : 
        status === 'error' ? 'text-red-500' : 
        'text-gray-500'
      }>
        {label}
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
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

      {selectedImage && (
        <Card className="overflow-hidden">
          <CardContent className="p-4 space-y-4">
            <img 
              src={selectedImage} 
              alt="Selected vehicle" 
              className="w-full h-48 object-cover rounded-md"
            />
            <div className="space-y-2">
              <ProgressItem status={progress.upload} label="Uploading image" />
              <ProgressItem status={progress.recognition} label="Processing with AWS Rekognition" />
              <ProgressItem status={progress.saving} label="Saving results" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VehicleImageUpload;
