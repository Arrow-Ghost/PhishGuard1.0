import React, { useState } from 'react';
import { History, GitCommit, GitBranch, GitMerge } from 'lucide-react';

export default function DependencyEvolutionTimeline() {
  const [selectedPkg, setSelectedPkg] = useState('lodash');

  const historyData = {
    'lodash': [
      { id: 1, date: '2023-01-15', version: '4.17.19', event: 'Initial Addition', risk: 'safe' },
      { id: 2, date: '2023-05-10', version: '4.17.19', event: 'Transitive Dep Increase', risk: 'warning' },
      { id: 3, date: '2023-08-22', version: '4.17.20', event: 'CVE-2020-8203 Published', risk: 'critical' },
      { id: 4, date: '2023-09-01', version: '4.17.20', event: 'Quarantined via Policy', risk: 'critical' },
      { id: 5, date: '2023-11-15', version: '4.17.21', event: 'Patched & Restored', risk: 'safe' },
    ],
    'axios': [
      { id: 1, date: '2022-11-01', version: '1.4.0', event: 'Added by Developer', risk: 'safe' },
      { id: 2, date: '2023-03-12', version: '1.5.1', event: 'Minor Upgrade', risk: 'safe' },
      { id: 3, date: '2024-01-20', version: '1.6.7', event: 'Security Patch Upgrade', risk: 'safe' }
    ]
  };

  const timeline = historyData[selectedPkg] || [];

  return (
    <div className="glass-panel rounded-xl border border-cyber-border/40 p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6 border-b border-cyber-border/30 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyber-primary" />
          <div>
            <h3 className="font-sans font-bold text-sm tracking-wide text-slate-100">Dependency Evolution Timeline</h3>
            <span className="text-[10px] text-slate-400">Temporal risk tracking across version history</span>
          </div>
        </div>
        
        <select 
          className="bg-cyber-bg/50 border border-cyber-border/40 rounded px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyber-primary/50"
          value={selectedPkg}
          onChange={e => setSelectedPkg(e.target.value)}
        >
          <option value="lodash">lodash</option>
          <option value="axios">axios</option>
        </select>
      </div>

      <div className="flex-1 relative pl-6 overflow-x-auto pb-4 custom-scrollbar flex items-center">
        {/* Horizontal Line */}
        <div className="absolute top-1/2 left-6 right-6 h-1 bg-cyber-border/30 rounded-full -translate-y-1/2 z-0"></div>

        <div className="flex gap-16 relative z-10 w-max px-8">
          {timeline.map((item, idx) => (
            <div key={item.id} className="relative flex flex-col items-center justify-center min-w-[120px] group">
              
              {/* Event Content (Top) */}
              <div className={`absolute bottom-8 flex flex-col items-center transition-all duration-300 ${idx % 2 === 0 ? '-translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100' : ''}`}>
                {idx % 2 !== 0 && (
                  <div className="bg-cyber-bg/80 border border-cyber-border/50 rounded p-2 text-center w-32 backdrop-blur-sm shadow-xl">
                    <span className="text-[9px] font-mono text-slate-400 block mb-0.5">{item.date}</span>
                    <span className="text-[10px] font-sans font-bold text-slate-200 block leading-tight">{item.event}</span>
                    <span className="text-[9px] font-mono text-cyber-primary mt-1 block">v{item.version}</span>
                  </div>
                )}
              </div>

              {/* Node */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-cyber-panel z-10 transition-transform group-hover:scale-125 ${
                item.risk === 'critical' ? 'border-cyber-danger shadow-glow-danger text-cyber-danger' : 
                item.risk === 'warning' ? 'border-cyber-warning shadow-glow-warning text-cyber-warning' : 
                'border-cyber-success shadow-glow-success text-cyber-success'
              }`}>
                {idx === 0 ? <GitBranch className="w-3 h-3" /> : idx === timeline.length - 1 ? <GitMerge className="w-3 h-3" /> : <GitCommit className="w-3 h-3" />}
              </div>

              {/* Event Content (Bottom) */}
              <div className={`absolute top-8 flex flex-col items-center transition-all duration-300 ${idx % 2 !== 0 ? 'translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100' : ''}`}>
                {idx % 2 === 0 && (
                  <div className="bg-cyber-bg/80 border border-cyber-border/50 rounded p-2 text-center w-32 backdrop-blur-sm shadow-xl">
                    <span className="text-[9px] font-mono text-slate-400 block mb-0.5">{item.date}</span>
                    <span className="text-[10px] font-sans font-bold text-slate-200 block leading-tight">{item.event}</span>
                    <span className="text-[9px] font-mono text-cyber-primary mt-1 block">v{item.version}</span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
