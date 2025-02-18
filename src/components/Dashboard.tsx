
import React from "react";
import { Camera, Video, Cloud, Settings } from "lucide-react";
import { Card } from "./ui/card";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <header className="mb-8">
        <div className="fade-in">
          <h1 className="text-3xl font-bold text-gray-900">Nuke Ltd.</h1>
          <p className="text-gray-600">Video Processing System</p>
        </div>
      </header>

      <main className="space-y-6">
        {/* Camera Grid Section */}
        <section className="fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Live Feeds</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-nuke-600 text-white rounded-lg hover:bg-nuke-700 transition-colors">
              <Camera size={18} />
              Add Camera
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((camera) => (
              <Card key={camera} className="hover-scale glass-card p-4">
                <div className="aspect-video bg-gray-800 rounded-lg mb-3">
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <Video size={40} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Camera {camera}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Live</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 fade-in">
          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-nuke-50 rounded-lg">
                <Video className="text-nuke-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Streams</p>
                <h3 className="text-2xl font-bold">12</h3>
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
                <p className="text-sm text-gray-600">Processing</p>
                <h3 className="text-2xl font-bold">3</h3>
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
                <h3 className="text-2xl font-bold">24</h3>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
