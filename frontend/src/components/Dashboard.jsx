import React from 'react';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Activity, 
  RefreshCcw,
  Video,
  Info
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import './Dashboard.css';

// Mock Data Generator (could be moved to a utility or improved with real backend data points)
const generateVelocityData = (peak) => Array.from({ length: 20 }).map((_, i) => {
  let speed;
  if(i < 5) speed = 0;
  else if(i === 5) speed = peak;
  else speed = Math.max(0, peak - ((i - 5) * 25) + (Math.random() * 20 - 10));
  
  return { frame: i, speed: Math.round(speed) };
});

export function Dashboard({ onReset, data }) {
  // Use data from backend if available, otherwise fallback to defaults
  const results = data?.results || { peak_velocity: 340, average_speed: 215, impact_angle: -12, impact_frame_sec: 0.16 };
  const metadata = data?.metadata || { fps: 60, resolution: '1920x1080', duration_sec: 2.5 };
  
  // Use real trajectory data from backend for the chart
  const velocityData = data?.trajectory?.map(t => ({
    frame: t.frame,
    speed: t.v
  })) || generateVelocityData(results.peak_velocity);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>Analysis Results</h2>
          <p className="subtitle">{data?.filename ? `Processed: ${data.filename}` : 'Video successfully processed'}</p>
        </div>
        <button className="btn-secondary flex-center" onClick={onReset}>
          <RefreshCcw size={16} style={{ marginRight: '8px' }} />
          Analyze New Video
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
            <Zap size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Peak Velocity</span>
            <div className="metric-value">{results.peak_velocity} <span className="metric-unit">km/h</span></div>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
            <Activity size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Average Speed</span>
            <div className="metric-value">{results.average_speed} <span className="metric-unit">km/h</span></div>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
            <Target size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Steepness Angle</span>
            <div className="metric-value">{results.impact_angle}° <span className="metric-unit">deg</span></div>
          </div>
        </div>
        
        <div className="metric-card glass-panel">
          <div className="metric-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>
            <TrendingUp size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Impact Time</span>
            <div className="metric-value">{results.impact_frame_sec} <span className="metric-unit">sec</span></div>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="chart-panel glass-panel">
          <h3 className="panel-title">Velocity Timeline</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis 
                  dataKey="frame" 
                  stroke="var(--text-secondary)" 
                  tick={{fill: 'var(--text-secondary)'}} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  tick={{fill: 'var(--text-secondary)'}}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                  itemStyle={{ color: 'var(--accent-primary)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="speed" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSpeed)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="side-panel-stack">
          <div className="video-panel glass-panel">
            <h3 className="panel-title">Tracked Video</h3>
            <div className="video-placeholder">
              <Video size={40} color="var(--text-secondary)" opacity={0.5} />
              <p>AI Tracked Clip</p>
              <div className="video-badge">AI Tracked</div>
            </div>
          </div>

          <div className="metadata-panel glass-panel">
            <h3 className="panel-title"><Info size={16} /> Metadata</h3>
            <div className="metadata-list">
              <div className="meta-item"><span>FPS:</span> <strong>{metadata.fps}</strong></div>
              <div className="meta-item"><span>Resolution:</span> <strong>{metadata.resolution}</strong></div>
              <div className="meta-item"><span>Duration:</span> <strong>{metadata.duration_sec}s</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
