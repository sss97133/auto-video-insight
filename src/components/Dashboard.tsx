
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera } from "@/types/camera";
import CameraModal from "./CameraModal";
import AlertsDisplay from "./AlertsDisplay";
import CameraGrid from "./dashboard/CameraGrid";
import StatsSection from "./dashboard/StatsSection";
import AnalyticsDashboard from "./analytics/AnalyticsDashboard";
import VehicleList from "./vehicles/VehicleList";
import AuditList from "./audits/AuditList";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  // Ensure component is mounted before rendering resize-sensitive components
  useLayoutEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Set up realtime subscription for camera updates
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cameras'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cameras'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch cameras data with error handling
  const { data: cameras, isLoading } = useQuery<Camera[]>({
    queryKey: ['cameras'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('cameras')
          .select('*')
          .throwOnError();
        
        if (error) {
          console.error('Supabase error:', error);
          toast.error('Failed to load cameras');
          throw error;
        }

        return (data || []).map(camera => {
          const config = camera.configuration as Record<string, any> | null;
          const settings = config?.settings as Record<string, any> | undefined;

          return {
            id: camera.id,
            name: camera.name,
            location: camera.location,
            type: camera.type,
            status: (camera.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
            streaming_url: camera.streaming_url,
            is_recording: Boolean(camera.is_recording),
            configuration: {
              processor_type: ((config?.processor_type as string) || 'none') as 'aws-rekognition' | 'custom' | 'none',
              updated_at: config?.updated_at as string | undefined,
              settings: {
                frameRate: settings?.frameRate as number | undefined,
                resolution: settings?.resolution as string | undefined,
                detectionConfidence: settings?.detectionConfidence as number | undefined
              }
            },
            created_at: camera.created_at ? new Date(camera.created_at).toISOString() : new Date().toISOString(),
            updated_at: camera.updated_at ? new Date(camera.updated_at).toISOString() : new Date().toISOString()
          };
        });
      } catch (error) {
        console.error('Error fetching cameras:', error);
        toast.error('Failed to load cameras');
        throw error;
      }
    }
  });

  if (!mounted) {
    return null; // Prevent flash of content before hydration
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <header className="mb-8">
        <div className="fade-in">
          <h1 className="text-3xl font-bold text-gray-900">Nuke Ltd.</h1>
          <p className="text-gray-600">Video Processing System</p>
        </div>
      </header>

      <main className="space-y-6">
        {mounted && (
          <>
            <StatsSection cameras={cameras} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CameraGrid 
                  cameras={cameras}
                  isLoading={isLoading}
                  onAddCamera={() => setIsModalOpen(true)}
                />
              </div>
              <section className="fade-in">
                <AlertsDisplay />
              </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VehicleList />
              <AuditList />
            </div>

            <AnalyticsDashboard />
          </>
        )}
      </main>

      <CameraModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;

