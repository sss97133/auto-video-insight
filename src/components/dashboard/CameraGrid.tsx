
import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Video, Power, PlayCircle, StopCircle, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CameraGridProps {
  cameras: any[] | undefined;
  isLoading: boolean;
  onAddCamera: () => void;
}

const CameraGrid = ({ cameras, isLoading, onAddCamera }: CameraGridProps) => {
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

  const toggleRecording = async (id: string, isCurrentlyRecording: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('cameras')
        .update({ is_recording: !isCurrentlyRecording })
        .eq('id', id);

      if (updateError) throw updateError;

      if (!isCurrentlyRecording) {
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
    <section className="lg:col-span-2 fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Live Feeds</h2>
        <Button 
          onClick={onAddCamera}
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
  );
};

export default CameraGrid;

