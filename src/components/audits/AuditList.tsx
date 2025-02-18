
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const AuditList = () => {
  const { data: audits, isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select(`
          *,
          vehicle:vehicles(license_plate, make, model)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'in_progress':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Audits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recent Audits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {audits?.map((audit) => (
            <div
              key={audit.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="font-semibold">
                  {audit.vehicle?.make} {audit.vehicle?.model}
                </h3>
                <p className="text-sm text-gray-600">
                  License: {audit.vehicle?.license_plate}
                </p>
                <p className="text-sm text-gray-500">
                  Created: {format(new Date(audit.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(audit.status)}>
                  {audit.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditList;
