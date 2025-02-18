
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Car, Upload, PaintBucket, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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

    try {
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) throw new Error('Failed to get public URL');

      // Call the license plate detection function
      const response = await supabase.functions.invoke('detect-license-plate', {
        body: {
          image_url: urlData.publicUrl,
          camera_id: null // Manual upload
        }
      });

      if (response.error) throw new Error(response.error);

      toast.success('Vehicle detection completed');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
    }
  };

  const getQualityBadgeVariant = (score: number) => {
    if (score >= 0.8) return "success";
    if (score >= 0.6) return "warning";
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
                  <Badge variant={vehicle.confidence > 0.8 ? "default" : "secondary"}>
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

                  {/* Vehicle Type and Color */}
                  {(vehicle.vehicle_type || vehicle.color) && (
                    <div className="flex items-center gap-2">
                      <PaintBucket className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {[vehicle.color, vehicle.vehicle_type].filter(Boolean).join(' ')}
                      </span>
                    </div>
                  )}

                  {/* Vehicle Features */}
                  {(vehicle.has_sunroof || vehicle.has_spoiler) && (
                    <div className="flex gap-2">
                      {vehicle.has_sunroof && (
                        <Badge variant="outline">Sunroof</Badge>
                      )}
                      {vehicle.has_spoiler && (
                        <Badge variant="outline">Spoiler</Badge>
                      )}
                    </div>
                  )}

                  {/* Orientation and Quality Score */}
                  {(vehicle.orientation || vehicle.quality_score) && (
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {vehicle.orientation}
                      </span>
                      {vehicle.quality_score && (
                        <Badge variant={getQualityBadgeVariant(vehicle.quality_score)}>
                          Quality: {Math.round(vehicle.quality_score * 100)}%
                        </Badge>
                      )}
                    </div>
                  )}

                  {vehicle.last_seen && (
                    <div className="text-xs text-gray-500">
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
