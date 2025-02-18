
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

  // Fetch cameras data
  const { data: cameras, isLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cameras')
        .select('*');
      
      if (error) {
        toast.error('Failed to load cameras');
        throw error;
      }
      
      return data;
    },
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

        <VehicleList />

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
