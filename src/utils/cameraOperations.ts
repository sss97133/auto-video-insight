
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VideoProcessorType } from "@/types/video-processor";

export const deleteCamera = async (id: string) => {
  console.log('Attempting to delete camera:', id);
  try {
    const { error } = await supabase
      .from('cameras')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting camera:', error);
      toast.error(`Failed to remove camera: ${error.message}`);
      throw error;
    }

    console.log('Camera deleted successfully');
    toast.success('Camera removed successfully');
  } catch (error) {
    console.error('Failed to delete camera:', error);
    if (error instanceof Error) {
      toast.error(`Failed to remove camera: ${error.message}`);
    } else {
      toast.error('Failed to remove camera: Unknown error');
    }
  }
};

export const toggleCameraStatus = async (id: string, currentStatus: string) => {
  console.log('Attempting to toggle camera status:', { id, currentStatus });
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    const { error } = await supabase
      .from('cameras')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error in toggleCameraStatus:', error);
      toast.error(`Failed to update camera status: ${error.message}`);
      throw error;
    }

    console.log('Camera status updated successfully:', newStatus);
    toast.success(`Camera ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
  } catch (error) {
    console.error('Failed to update camera status:', error);
    if (error instanceof Error) {
      toast.error(`Failed to update camera status: ${error.message}`);
    } else {
      toast.error('Failed to update camera status: Unknown error');
    }
  }
};

export const toggleRecording = async (id: string, isCurrentlyRecording: boolean) => {
  console.log('Attempting to toggle recording:', { id, isCurrentlyRecording });
  try {
    const { error: updateError } = await supabase
      .from('cameras')
      .update({ is_recording: !isCurrentlyRecording })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating camera recording state:', updateError);
      toast.error(`Failed to toggle recording: ${updateError.message}`);
      throw updateError;
    }

    if (!isCurrentlyRecording) {
      const storagePath = `recordings/${id}/${new Date().getTime()}.mp4`;
      console.log('Creating new recording entry with path:', storagePath);
      
      const { error: recordingError } = await supabase
        .from('video_recordings')
        .insert({
          camera_id: id,
          start_time: new Date().toISOString(),
          storage_path: storagePath,
          status: 'recording'
        });

      if (recordingError) {
        console.error('Error creating recording entry:', recordingError);
        toast.error(`Failed to start recording: ${recordingError.message}`);
        throw recordingError;
      }
      toast.success('Recording started');
    } else {
      console.log('Stopping recording for camera:', id);
      const { error: stopError } = await supabase
        .from('video_recordings')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed'
        })
        .eq('camera_id', id)
        .eq('status', 'recording');

      if (stopError) {
        console.error('Error stopping recording:', stopError);
        toast.error(`Failed to stop recording: ${stopError.message}`);
        throw stopError;
      }
      toast.success('Recording stopped');
    }
  } catch (error) {
    console.error('Failed to toggle recording:', error);
    if (error instanceof Error) {
      toast.error(`Failed to toggle recording: ${error.message}`);
    } else {
      toast.error('Failed to toggle recording: Unknown error');
    }
  }
};

export const shareRecording = async (cameraId: string) => {
  console.log('Attempting to share recording for camera:', cameraId);
  try {
    const { data: recording, error: fetchError } = await supabase
      .from('video_recordings')
      .select('*')
      .eq('camera_id', cameraId)
      .eq('status', 'completed')
      .order('end_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching recording:', fetchError);
      toast.error(`Failed to fetch recording: ${fetchError.message}`);
      throw fetchError;
    }

    if (!recording) {
      console.log('No completed recordings found for camera:', cameraId);
      toast.error('No completed recordings found for this camera');
      return;
    }

    console.log('Found recording to share:', recording);
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

    if (shareError) {
      console.error('Error creating share entry:', shareError);
      toast.error(`Failed to create share entry: ${shareError.message}`);
      throw shareError;
    }

    const shareableLink = `${window.location.origin}/shared/${shareToken}`;
    console.log('Created shareable link:', shareableLink);
    
    await navigator.clipboard.writeText(shareableLink);
    toast.success('Share link copied to clipboard! The link will expire in 7 days.');
  } catch (error) {
    console.error('Failed to share recording:', error);
    if (error instanceof Error) {
      toast.error(`Failed to share recording: ${error.message}`);
    } else {
      toast.error('Failed to share recording: Unknown error');
    }
  }
};

export const updateCameraProcessor = async (id: string, processorType: VideoProcessorType) => {
  console.log('Updating camera processor:', { id, processorType });
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

    if (error) {
      console.error('Error updating processor:', error);
      toast.error(`Failed to update video processor: ${error.message}`);
      throw error;
    }

    console.log('Camera processor updated successfully');
    toast.success(`Video processor updated to ${processorType}`);
  } catch (error) {
    console.error('Failed to update video processor:', error);
    if (error instanceof Error) {
      toast.error(`Failed to update video processor: ${error.message}`);
    } else {
      toast.error('Failed to update video processor: Unknown error');
    }
  }
};
