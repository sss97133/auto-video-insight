
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
  const [connectionError, setConnectionError] = useState(false);
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
      .subscribe((status) => {
        console.log('Supabase channel status:', status);
        if (status !== 'SUBSCRIBED') {
          console.warn('Supabase real-time subscription not established');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch cameras data with improved error handling
  const { data: cameras, isLoading, error } = useQuery<Camera[]>({
    queryKey: ['cameras'],
    queryFn: async () => {
      try {
        console.log('Attempting to fetch cameras from Supabase...');
        const { data, error } = await supabase
          .from('cameras')
          .select('*');
        
        if (error) {
          console.error('Supabase query error:', error);
          toast.error(`Failed to load cameras: ${error.message}`);
          setConnectionError(true);
          throw error;
        }

        console.log('Cameras fetched successfully:', data?.length || 0, 'cameras found');
        setConnectionError(false);
        
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
        setConnectionError(true);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 2000,
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
        {connectionError && (
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 rounded">
            <div className="flex items-center">
              <div className="py-1">
                <svg className="h-6 w-6 text-orange-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-bold">Connection Issue</p>
                <p className="text-sm">Unable to connect to the database. Please check your network connection and try again.</p>
              </div>
            </div>
          </div>
        )}

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
