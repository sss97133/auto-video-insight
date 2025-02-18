
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Bell, Info } from "lucide-react";
import { Card } from "./ui/card";
import { toast } from "sonner";

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

  const getAlertIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'security':
        return <AlertTriangle className="h-5 w-5" />;
      case 'system':
        return <Info className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
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
                  {getAlertIcon(alert.alert_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{alert.message}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {alert.cameras && (
                    <p className="text-xs text-gray-600 mt-1">
                      Camera: {alert.cameras.name} ({alert.cameras.location})
                    </p>
                  )}
                  {alert.vehicles && (
                    <p className="text-xs text-gray-600">
                      Vehicle: {alert.vehicles.license_plate} 
                      {alert.vehicles.make && alert.vehicles.model && ` - ${alert.vehicles.make} ${alert.vehicles.model}`}
                    </p>
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
