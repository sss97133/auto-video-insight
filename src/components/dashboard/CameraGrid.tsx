
import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Video, Power, PlayCircle, StopCircle, Camera, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
      // Update camera recording status
      const { error: updateError } = await supabase
        .from('cameras')
        .update({ is_recording: !isCurrentlyRecording })
        .eq('id', id);

      if (updateError) throw updateError;

      if (!isCurrentlyRecording) {
        // Start new recording
        const storagePath = `recordings/${id}/${new Date().getTime()}.mp4`;
        const { error: recordingError } = await supabase
          .from('video_recordings')
          .insert({
            camera_id: id,
            start_time: new Date().toISOString(),
            storage_path: storagePath,
            status: 'recording'
          });

        if (recordingError) throw recordingError;
        toast.success('Recording started');
      } else {
        // Stop current recording
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

  const shareRecording = async (cameraId: string) => {
    try {
      // Get the latest completed recording for this camera
      const { data: recording, error: fetchError } = await supabase
        .from('video_recordings')
        .select('*')
        .eq('camera_id', cameraId)
        .eq('status', 'completed')
        .order('end_time', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      if (!recording) {
        toast.error('No completed recordings found for this camera');
        return;
      }

      // Generate a unique share token
      const shareToken = crypto.randomUUID();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Set expiry to 7 days from now

      // Create share record
      const { error: shareError } = await supabase
        .from('shared_videos')
        .insert({
          video_recording_id: recording.id,
          share_token: shareToken,
          expires_at: expiryDate.toISOString(),
          status: 'active',
          customer_email: 'pending' // This would typically be set when sharing with a specific customer
        });

      if (shareError) throw shareError;

      // Generate shareable link
      const shareableLink = `${window.location.origin}/shared/${shareToken}`;
      
      // Copy link to clipboard
      await navigator.clipboard.writeText(shareableLink);
      toast.success('Share link copied to clipboard! The link will expire in 7 days.');

    } catch (error) {
      toast.error('Failed to share recording');
      console.error('Error sharing recording:', error);
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
                    onClick={() => shareRecording(camera.id)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <Share2 size={18} />
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

