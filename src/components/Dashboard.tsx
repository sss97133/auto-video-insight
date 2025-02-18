
import React, { useEffect } from "react";
import { Camera, Video, Cloud, Settings, Power, PlayCircle, StopCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CameraModal from "./CameraModal";
import AlertsDisplay from "./AlertsDisplay";

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

  // Toggle camera status
  const toggleCameraStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('cameras')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Camera ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update camera status');
      console.error('Error updating camera status:', error);
    }
  };

  // Toggle recording
  const toggleRecording = async (id: string, isCurrentlyRecording: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('cameras')
        .update({ is_recording: !isCurrentlyRecording })
        .eq('id', id);

      if (updateError) throw updateError;

      if (!isCurrentlyRecording) {
        // Start new recording
        const { error: recordingError } = await supabase
          .from('video_recordings')
          .insert({
            camera_id: id,
            start_time: new Date().toISOString(),
            storage_path: `recordings/${id}/${new Date().getTime()}.mp4`,
            status: 'recording'
          });

        if (recordingError) throw recordingError;
        toast.success('Recording started');
      } else {
        // Update existing recording
        const { error: stopError } = await supabase
          .from('video_recordings')
          .update({
            end_time: new Date().toISOString(),
            status: 'completed'
          })
          .eq('camera_id', id)
          .eq('status', 'recording');

        if (stopError) throw stopError;
        toast.success('Recording stopped');
      }
    } catch (error) {
      toast.error('Failed to toggle recording');
      console.error('Error toggling recording:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <header className="mb-8">
        <div className="fade-in">
          <h1 className="text-3xl font-bold text-gray-900">Nuke Ltd.</h1>
          <p className="text-gray-600">Video Processing System</p>
        </div>
      </header>

      <main className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Grid Section */}
          <section className="lg:col-span-2 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Live Feeds</h2>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Camera size={18} />
                Add Camera
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                <p className="col-span-full text-center text-gray-600">Loading cameras...</p>
              ) : cameras && cameras.length > 0 ? (
                cameras.map((camera) => (
                  <Card key={camera.id} className="hover-scale glass-card p-4">
                    <div className="aspect-video bg-gray-800 rounded-lg mb-3">
                      {camera.streaming_url ? (
                        <video
                          className="w-full h-full rounded-lg object-cover"
                          src={camera.streaming_url}
                          autoPlay
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          <Video size={40} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{camera.name}</span>
                        <p className="text-xs text-gray-500">{camera.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleRecording(camera.id, camera.is_recording)}
                          className={camera.is_recording ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}
                        >
                          {camera.is_recording ? (
                            <StopCircle size={18} />
                          ) : (
                            <PlayCircle size={18} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleCameraStatus(camera.id, camera.status)}
                          className={camera.status === 'active' ? 'text-green-500 hover:text-green-600' : 'text-red-500 hover:text-red-600'}
                        >
                          <Power size={18} />
                        </Button>
                        <div className={`w-2 h-2 rounded-full ${camera.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-600">No cameras found</p>
              )}
            </div>
          </section>

          {/* Alerts Section */}
          <section className="fade-in">
            <AlertsDisplay />
          </section>
        </div>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 fade-in">
          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-nuke-50 rounded-lg">
                <Video className="text-nuke-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Streams</p>
                <h3 className="text-2xl font-bold">{cameras?.filter(c => c.status === 'active').length || 0}</h3>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Cloud className="text-blue-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <h3 className="text-2xl font-bold">1.2 TB</h3>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Settings className="text-purple-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recording</p>
                <h3 className="text-2xl font-bold">{cameras?.filter(c => c.is_recording).length || 0}</h3>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Camera className="text-green-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Cameras</p>
                <h3 className="text-2xl font-bold">{cameras?.length || 0}</h3>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <CameraModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
