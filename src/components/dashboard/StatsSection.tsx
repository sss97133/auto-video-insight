
import React, { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Video, Cloud, Settings, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StatsSectionProps {
  cameras: any[] | undefined;
}

type VideoRecordingMetadata = {
  size: number;
  duration?: number;
  format?: string;
}

interface DatabaseRecording {
  metadata: VideoRecordingMetadata | null;
}

const StatsSection = ({ cameras }: StatsSectionProps) => {
  const [storageUsed, setStorageUsed] = useState<string>("0 MB");

  useEffect(() => {
    const fetchStorageUsage = async () => {
      try {
        const { data: recordings, error } = await supabase
          .from('video_recordings')
          .select('metadata');

        if (error) {
          throw error;
        }

        if (!recordings || recordings.length === 0) {
          console.log('No recordings found');
          return;
        }

        // Calculate total size from metadata with proper type checking
        const totalBytes = recordings.reduce((acc, recording: DatabaseRecording) => {
          const size = recording.metadata?.size ?? 0;
          return acc + size;
        }, 0);

        // Convert bytes to human readable format
        let size: string;
        if (totalBytes < 1024) {
          size = `${totalBytes} B`;
        } else if (totalBytes < 1024 * 1024) {
          size = `${(totalBytes / 1024).toFixed(1)} KB`;
        } else if (totalBytes < 1024 * 1024 * 1024) {
          size = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
        } else {
          size = `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        }

        setStorageUsed(size);
      } catch (error) {
        console.error('Error fetching storage usage:', error);
        toast.error('Failed to fetch storage usage');
        setStorageUsed("Error");
      }
    };

    fetchStorageUsage();
  }, []);

  return (
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
            <h3 className="text-2xl font-bold">{storageUsed}</h3>
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
  );
};

export default StatsSection;
