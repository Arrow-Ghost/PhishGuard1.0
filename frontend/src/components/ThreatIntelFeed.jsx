import React, { useState, useEffect } from 'react';
import { Globe, AlertOctagon, ShieldAlert, Wifi } from 'lucide-react';

export default function ThreatIntelFeed() {
  const [intel, setIntel] = useState([]);

  useEffect(() => {
    fetch('/api/threat-intel')
      .then(res => res.json())
      .then(data => setIntel(data))
      .catch(console.error);
  }, []);

  return (
    <div className="glass-panel rounded-xl border border-cyber-border/40 p-5 flex flex-col h-[320px]">
      <div className="flex justify-between items-center mb-4 border-b border-cyber-border/30 pb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyber-primary" />
          <div>
            <h3 className="font-sans font-bold text-sm tracking-wide text-slate-100">Global Threat Intel</h3>
            <span className="text-[10px] text-slate-400">Live OSINT & NVD feed</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyber-primary/10 border border-cyber-primary/30">
          <Wifi className="w-3 h-3 text-cyber-primary animate-pulse" />
          <span className="text-[9px] font-mono font-bold tracking-widest text-cyber-primary uppercase">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {intel.map((event) => (
          <div key={event.id} className="p-3 rounded-lg bg-cyber-panel/50 border border-cyber-border/30 hover:border-cyber-primary/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono font-bold tracking-wider text-cyber-danger bg-cyber-danger/10 px-1.5 py-0.5 rounded">
                {event.type}
              </span>
              <span className="text-[9px] font-sans text-slate-500">
                {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h4 className="font-sans text-xs font-bold text-slate-200 mb-1">{event.title}</h4>
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Source: {event.source}</span>
            </div>
          </div>
        ))}
        {intel.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono uppercase">
            Loading Intelligence...
          </div>
        )}
      </div>
    </div>
  );
}
