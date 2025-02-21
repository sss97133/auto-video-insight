
# Auto Video Insight

A powerful video processing system for managing and analyzing IP camera feeds, built with React and Supabase.

## 🚀 Features

- **Multiple Camera Input Methods**:
  - Browser-based streaming (WebRTC)
  - Streaming software support (OBS Studio via RTMP)
  - Direct URL connections (IP cameras, RTSP/RTMP streams)
- **Real-time Video Processing**
- **Vehicle Detection & Analytics**
- **Audit Logging**
- **Interactive Dashboard**

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **State Management**: TanStack Query
- **Backend**: Supabase
- **Real-time Features**: Supabase Realtime

## 🏃‍♂️ Getting Started

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd auto-video-insight
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📖 Documentation

For detailed documentation about the project's architecture, components, and advanced features, please see [DOCUMENTATION.md](DOCUMENTATION.md).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
