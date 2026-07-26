import React, { useState, useEffect } from 'react';
import { Map, Activity } from 'lucide-react';

export default function GlobalAttackMap() {
  const [attacks, setAttacks] = useState([]);

  useEffect(() => {
    // Generate random attacks periodically
    const interval = setInterval(() => {
      const newAttack = {
        id: Date.now(),
        sx: Math.random() * 800,
        sy: Math.random() * 400,
        tx: 400, // Target is roughly center (our infrastructure)
        ty: 200,
        color: Math.random() > 0.5 ? '#f43f5e' : '#f59e0b',
        duration: Math.random() * 2 + 1
      };
      setAttacks(prev => [...prev.slice(-20), newAttack]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-xl border border-cyber-border/40 p-5 flex flex-col h-[400px] overflow-hidden relative select-none">
      <div className="flex justify-between items-center mb-4 z-10 relative shrink-0">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-cyber-primary" />
          <div>
            <h3 className="font-sans font-bold text-sm tracking-wide text-slate-100">Global Threat Vector Map</h3>
            <span className="text-[10px] text-slate-400">Live geospatial origin tracking</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-cyber-bg/50 border border-cyber-border/30 rounded">
          <Activity className="w-3 h-3 text-cyber-danger animate-pulse" />
          <span className="text-[9px] font-mono text-slate-300 uppercase">Monitoring Live Nodes</span>
        </div>
      </div>

      <div className="flex-1 relative bg-[#080a10] rounded-lg border border-cyber-border/20 overflow-hidden">
        {/* Simple SVG World Map abstraction */}
        <svg viewBox="0 0 800 400" className="w-full h-full absolute inset-0 z-0 opacity-20">
          <path d="M 100 100 Q 150 80 200 120 T 300 150 T 400 100 T 500 180 T 600 120 T 700 160 Q 750 200 700 250 T 550 300 T 450 250 T 350 320 T 250 280 T 150 300 Q 100 250 100 100 Z" fill="#2563eb" />
          <path d="M 450 50 Q 500 30 550 70 T 650 60 T 750 90 Q 780 150 700 120 T 600 100 T 500 120 Z" fill="#2563eb" />
          <path d="M 50 200 Q 80 180 120 220 T 200 210 T 250 250 Q 200 350 150 320 T 80 280 Z" fill="#2563eb" />
          <path d="M 350 20 Q 400 10 450 40 T 500 20 T 550 50 Q 500 90 450 70 Z" fill="#2563eb" />
          
          {/* Grid lines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 100} y1={0} x2={i * 100} y2={400} stroke="#1e293b" strokeWidth="1" />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <line key={`h-${i}`} x1={0} y1={i * 100} x2={800} y2={i * 100} stroke="#1e293b" strokeWidth="1" />
          ))}
        </svg>

        {/* Attack Trajectories */}
        <svg viewBox="0 0 800 400" className="w-full h-full absolute inset-0 z-10 pointer-events-none">
          {/* Target Host */}
          <circle cx={400} cy={200} r={4} fill="#2563eb" className="animate-pulse" />
          <circle cx={400} cy={200} r={12} fill="none" stroke="#2563eb" strokeWidth="1" className="opacity-50" />
          <circle cx={400} cy={200} r={24} fill="none" stroke="#2563eb" strokeWidth="0.5" className="opacity-20 animate-ping" />

          {attacks.map(attack => (
            <g key={attack.id}>
              {/* Origin Point */}
              <circle cx={attack.sx} cy={attack.sy} r={3} fill={attack.color} />
              <circle cx={attack.sx} cy={attack.sy} r={10} fill="none" stroke={attack.color} strokeWidth="1" className="animate-ping opacity-50" />
              
              {/* Curve Trajectory */}
              <path
                d={`M ${attack.sx} ${attack.sy} Q ${attack.sx + (400 - attack.sx)/2} ${attack.sy - 100} 400 200`}
                fill="none"
                stroke={attack.color}
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="opacity-40"
              />
              
              {/* Moving packet */}
              <circle r="3" fill="#fff" style={{ filter: `drop-shadow(0 0 4px ${attack.color})` }}>
                <animateMotion 
                  path={`M ${attack.sx} ${attack.sy} Q ${attack.sx + (400 - attack.sx)/2} ${attack.sy - 100} 400 200`}
                  dur={`${attack.duration}s`} 
                  fill="remove"
                />
              </circle>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
