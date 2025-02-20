
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Car, PaintBucket, ArrowRight, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface VehicleMeasurements {
  aspect_ratio?: number;
  width?: number;
  height?: number;
}

interface VehicleCardProps {
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

const getQualityBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
  if (score >= 0.8) return "default";
  if (score >= 0.6) return "secondary";
  return "destructive";
};

const VehicleCard: React.FC<VehicleCardProps> = ({
  license_plate,
  confidence,
  make,
  model,
  year,
  vehicle_type,
  measurements,
  damage_detected,
  damage_confidence,
  entry_timestamp,
  exit_timestamp,
  last_seen,
  image_url,
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{license_plate}</CardTitle>
          <Badge variant={getQualityBadgeVariant(confidence)}>
            {Math.round(confidence * 100)}% Match
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {make} {model} {year}
            </span>
          </div>

          {(vehicle_type || measurements) && (
            <div className="flex items-center gap-2">
              <PaintBucket className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {vehicle_type}
                {measurements && 'aspect_ratio' in measurements && (
                  <span className="ml-1">
                    ({Math.round(measurements.aspect_ratio * 100) / 100} ratio)
                  </span>
                )}
              </span>
            </div>
          )}

          {entry_timestamp && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Entry: {format(new Date(entry_timestamp), 'MMM dd, HH:mm')}
                {exit_timestamp && (
                  <span className="ml-1">
                    (Duration: {formatDistanceToNow(new Date(entry_timestamp), { addSuffix: true })})
                  </span>
                )}
              </span>
            </div>
          )}

          {damage_detected && (
            <Badge variant="destructive" className="mt-1">
              Damage Detected ({Math.round((damage_confidence || 0) * 100)}% confidence)
            </Badge>
          )}

          {last_seen && (
            <div className="text-xs text-gray-500 mt-2">
              Last seen: {format(new Date(last_seen), 'MMM dd, yyyy HH:mm')}
            </div>
          )}
          
          {image_url && (
            <img 
              src={image_url} 
              alt={`Vehicle ${license_plate}`}
              className="w-full h-32 object-cover rounded-md mt-2"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;
