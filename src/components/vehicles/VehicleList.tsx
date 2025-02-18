
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Car } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Vehicle Tracking</h2>
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
