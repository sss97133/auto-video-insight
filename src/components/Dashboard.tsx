
import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CameraModal from "./CameraModal";
import AlertsDisplay from "./AlertsDisplay";
import CameraGrid from "./dashboard/CameraGrid";
import StatsSection from "./dashboard/StatsSection";
import AnalyticsDashboard from "./analytics/AnalyticsDashboard";
import VehicleList from "./vehicles/VehicleList";
import AuditList from "./audits/AuditList";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const queryClient = useQueryClient();

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

  // Fetch cameras data with error handling for non-clonable objects
  const { data: cameras, isLoading } = useQuery({
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

        // Ensure we're only returning plain objects that can be cloned
        return data?.map(camera => ({
          ...camera,
          configuration: camera.configuration || {},
          created_at: camera.created_at ? new Date(camera.created_at).toISOString() : null,
          updated_at: camera.updated_at ? new Date(camera.updated_at).toISOString() : null
        })) || [];
      } catch (error) {
        console.error('Error fetching cameras:', error);
        toast.error('Failed to load cameras');
        throw error;
      }
    },
    retry: 1,
    staleTime: 1000 * 60, // 1 minute
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <header className="mb-8">
        <div className="fade-in">
          <h1 className="text-3xl font-bold text-gray-900">Nuke Ltd.</h1>
          <p className="text-gray-600">Video Processing System</p>
        </div>
      </header>

      <main className="space-y-6">
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
      </main>

      <CameraModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;

