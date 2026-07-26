import React, { useState, useEffect } from 'react';
import { Radar, Crosshair } from 'lucide-react';

export default function AttackRadar({ logs }) {
  const [blips, setBlips] = useState([]);

  useEffect(() => {
    if (!logs || logs.length === 0) return;

    // Add a blip for the latest log
    const latest = logs[logs.length - 1];
    
    // Assign random coordinates relative to radar center
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 40 + 10; // 10% to 50% from center
    const x = 50 + Math.cos(angle) * distance;
    const y = 50 + Math.sin(angle) * distance;
    
    const newBlip = {
      id: latest.id,
      x,
      y,
      severity: latest.severity,
      timestamp: Date.now()
    };
    
    setBlips(prev => [...prev.slice(-14), newBlip]);
  }, [logs]);

  // Clean up old blips
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBlips(prev => prev.filter(b => now - b.timestamp < 10000)); // Blips last 10 seconds
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-xl border border-cyber-border/40 p-5 flex flex-col h-[320px] overflow-hidden relative">
      <div className="flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-cyber-primary" />
          <div>
            <h3 className="font-sans font-bold text-sm tracking-wide text-slate-100">Intrusion Radar</h3>
            <span className="text-[10px] text-slate-400">Live vector detection</span>
          </div>
        </div>
      </div>

      <div className="flex-1 mt-4 relative flex items-center justify-center pointer-events-none">
        
        {/* Radar Background */}
        <div className="w-full h-full max-w-[200px] max-h-[200px] rounded-full border border-cyber-primary/30 relative flex items-center justify-center">
          
          {/* Inner Rings */}
          <div className="absolute w-[66%] h-[66%] rounded-full border border-cyber-primary/20"></div>
          <div className="absolute w-[33%] h-[33%] rounded-full border border-cyber-primary/10"></div>
          
          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-cyber-primary/20"></div>
          <div className="absolute h-full w-[1px] bg-cyber-primary/20"></div>
          
          {/* Center target */}
          <Crosshair className="absolute w-4 h-4 text-cyber-primary/50" />

          {/* Radar Sweep */}
          <div 
            className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
            style={{
              background: 'conic-gradient(from 0deg, rgba(37, 99, 235, 0.4) 0deg, transparent 60deg)',
              animation: 'spin 3s linear infinite',
            }}
          />

          {/* Blips */}
          {blips.map(blip => (
            <div 
              key={blip.id}
              className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ping"
              style={{
                left: `${blip.x}%`,
                top: `${blip.y}%`,
                backgroundColor: blip.severity === 'critical' ? '#f43f5e' : blip.severity === 'warning' ? '#f59e0b' : '#10b981',
                boxShadow: `0 0 10px ${blip.severity === 'critical' ? '#f43f5e' : blip.severity === 'warning' ? '#f59e0b' : '#10b981'}`,
              }}
            ></div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
