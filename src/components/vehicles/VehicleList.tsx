
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Car, Upload, PaintBucket, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "../ui/button";

const VehicleList = () => {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('last_seen', { ascending: false });
      
      if (error) {
        toast.error('Failed to load vehicles');
        throw error;
      }
      
      return data;
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Processing image...');

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(`${Date.now()}-${file.name}`, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload image to storage');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(uploadData.path);

      console.log('Image uploaded successfully, URL:', publicUrl);

      const { data: detectionData, error: detectionError } = await supabase.functions
        .invoke('detect-license-plate', {
          body: {
            image_url: publicUrl,
            camera_id: null // Manual upload
          }
        });

      if (detectionError) {
        console.error('Detection error:', detectionError);
        throw new Error('Failed to process image');
      }

      console.log('Detection completed:', detectionData);
      toast.dismiss(loadingToast);
      toast.success('Vehicle processed successfully');

    } catch (error) {
      console.error('Error processing image:', error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Failed to process image');
    }
  };

  const getQualityBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 0.8) return "default";
    if (score >= 0.6) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Vehicle Tracking</h2>
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
      </div>

      {isLoading ? (
        <div>Loading vehicles...</div>
      ) : vehicles && vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{vehicle.license_plate}</CardTitle>
                  <Badge variant={getQualityBadgeVariant(vehicle.confidence)}>
                    {Math.round(vehicle.confidence * 100)}% Match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {vehicle.make} {vehicle.model} {vehicle.year}
                    </span>
                  </div>

                  {/* Vehicle Type and Measurements */}
                  {(vehicle.vehicle_type || vehicle.measurements) && (
                    <div className="flex items-center gap-2">
                      <PaintBucket className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {vehicle.vehicle_type}
                        {vehicle.measurements && (
                          <span className="ml-1">
                            ({Math.round(vehicle.measurements.aspect_ratio * 100) / 100} ratio)
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Time on Premises */}
                  {vehicle.entry_timestamp && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Entry: {format(new Date(vehicle.entry_timestamp), 'MMM dd, HH:mm')}
                        {vehicle.exit_timestamp && (
                          <span className="ml-1">
                            (Duration: {formatDistanceToNow(new Date(vehicle.entry_timestamp), { addSuffix: true })})
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Damage Assessment */}
                  {vehicle.damage_detected && (
                    <Badge variant="destructive" className="mt-1">
                      Damage Detected ({Math.round(vehicle.damage_confidence * 100)}% confidence)
                    </Badge>
                  )}

                  {vehicle.last_seen && (
                    <div className="text-xs text-gray-500 mt-2">
                      Last seen: {format(new Date(vehicle.last_seen), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                  
                  {vehicle.image_url && (
                    <img 
                      src={vehicle.image_url} 
                      alt={`Vehicle ${vehicle.license_plate}`}
                      className="w-full h-32 object-cover rounded-md mt-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-4">
          <div className="text-center text-gray-500">No vehicles detected yet</div>
        </Card>
      )}
    </div>
  );
};

export default VehicleList;
