import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VideoProcessorType } from "@/types/video-processor";

export const toggleCameraStatus = async (id: string, currentStatus: string) => {
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

export const toggleRecording = async (id: string, isCurrentlyRecording: boolean) => {
  try {
    const { error: updateError } = await supabase
      .from('cameras')
      .update({ is_recording: !isCurrentlyRecording })
      .eq('id', id);

    if (updateError) throw updateError;

    if (!isCurrentlyRecording) {
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

export const shareRecording = async (cameraId: string) => {
  try {
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

    const shareToken = crypto.randomUUID();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const { error: shareError } = await supabase
      .from('shared_videos')
      .insert({
        video_recording_id: recording.id,
        share_token: shareToken,
        expires_at: expiryDate.toISOString(),
        status: 'active',
        customer_email: 'pending'
      });

    if (shareError) throw shareError;

    const shareableLink = `${window.location.origin}/shared/${shareToken}`;
    
    await navigator.clipboard.writeText(shareableLink);
    toast.success('Share link copied to clipboard! The link will expire in 7 days.');
  } catch (error) {
    toast.error('Failed to share recording');
    console.error('Error sharing recording:', error);
  }
};

export const updateCameraProcessor = async (id: string, processorType: VideoProcessorType) => {
  try {
    const { error } = await supabase
      .from('cameras')
      .update({
        configuration: {
          processor_type: processorType,
          updated_at: new Date().toISOString(),
          settings: {
            frameRate: 30,
            resolution: '1080p',
            detectionConfidence: 0.7
          }
        }
      })
      .eq('id', id);

    if (error) throw error;

    toast.success(`Video processor updated to ${processorType}`);
  } catch (error) {
    toast.error('Failed to update video processor');
    console.error('Error updating video processor:', error);
  }
};
