
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Bell, Info, ShieldAlert, Car, Wrench, AlertCircle } from "lucide-react";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { Badge } from "./ui/badge";

const AlertsDisplay = () => {
  const queryClient = useQueryClient();

  // Set up realtime subscription for alerts
  React.useEffect(() => {
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
          toast.info("New alert received");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch alerts data
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          cameras (
            name,
            location
          ),
          vehicles (
            license_plate,
            make,
            model
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        toast.error('Failed to load alerts');
        throw error;
      }
      
      return data;
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'unauthorized_access':
        return <ShieldAlert className="h-5 w-5" />;
      case 'suspicious_vehicle':
        return <Car className="h-5 w-5" />;
      case 'maintenance_needed':
        return <Wrench className="h-5 w-5" />;
      case 'equipment_malfunction':
        return <AlertCircle className="h-5 w-5" />;
      case 'speed_violation':
      case 'parking_violation':
      case 'unsafe_movement':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const formatEventType = (eventType: string) => {
    if (!eventType) return '';
    return eventType
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Alerts</h3>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading alerts...</p>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={getSeverityColor(alert.severity)}>
                  {getEventTypeIcon(alert.event_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{alert.message}</p>
                      <div className="flex gap-2">
                        <Badge className={getSeverityBadgeColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {alert.event_type && (
                          <Badge variant="outline">
                            {formatEventType(alert.event_type)}
                          </Badge>
                        )}
                        {alert.confidence && (
                          <Badge variant="secondary">
                            {Math.round(alert.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {alert.cameras && (
                    <p className="text-xs text-gray-600">
                      Camera: {alert.cameras.name} ({alert.cameras.location})
                    </p>
                  )}
                  {alert.vehicles && (
                    <p className="text-xs text-gray-600">
                      Vehicle: {alert.vehicles.license_plate} 
                      {alert.vehicles.make && alert.vehicles.model && ` - ${alert.vehicles.make} ${alert.vehicles.model}`}
                    </p>
                  )}
                  {alert.event_metadata && Object.keys(alert.event_metadata).length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="font-medium">Additional Details:</p>
                      <ul className="list-disc list-inside">
                        {Object.entries(alert.event_metadata).map(([key, value]) => (
                          <li key={key} className="ml-2">
                            {key.split('_').join(' ')}: {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No alerts found</p>
      )}
    </div>
  );
};

export default AlertsDisplay;
