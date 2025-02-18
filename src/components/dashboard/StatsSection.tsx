
import React from "react";
import { Card } from "../ui/card";
import { Video, Cloud, Settings, Camera } from "lucide-react";

interface StatsSectionProps {
  cameras: any[] | undefined;
}

const StatsSection = ({ cameras }: StatsSectionProps) => {
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
  );
};

export default StatsSection;

