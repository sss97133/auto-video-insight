
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "../ui/card";
import EventsLineChart from "./EventsLineChart";
import { toast } from "sonner";

const AnalyticsDashboard = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .order('timestamp', { ascending: true });
      
      if (error) {
        toast.error('Failed to load analytics data');
        throw error;
      }
      
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Events Over Time</h3>
          <EventsLineChart data={analyticsData || []} />
        </Card>
      </div>
    </section>
  );
};

export default AnalyticsDashboard;
