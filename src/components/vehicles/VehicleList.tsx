
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "../ui/card";
import { toast } from "sonner";
import VehicleCard from "./VehicleCard";
import VehicleImageUpload from "./VehicleImageUpload";

interface VehicleMeasurements {
  aspect_ratio?: number;
  width?: number;
  height?: number;
}

interface Vehicle {
  id: string;
  license_plate: string;
  confidence: number;
  make?: string;
  model?: string;
  year?: number;
  vehicle_type?: string;
  measurements?: VehicleMeasurements;
  damage_detected?: boolean;
  damage_confidence?: number;
  entry_timestamp?: string;
  exit_timestamp?: string;
  last_seen?: string;
  image_url?: string;
}

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
      
      return data as Vehicle[];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Vehicle Tracking</h2>
        <VehicleImageUpload />
      </div>

      {isLoading ? (
        <div>Loading vehicles...</div>
      ) : vehicles && vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} {...vehicle} />
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
