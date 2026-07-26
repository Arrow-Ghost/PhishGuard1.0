import React, { useState } from 'react';
import { Search, Download, ShieldAlert, Clock, Code, FileText, Database, Share2, ZoomIn, SearchX } from 'lucide-react';

export default function Forensics() {
  const [activeReport, setActiveReport] = useState('INC-2024-001');

  const incidents = [
    {
      id: 'INC-2024-001',
      date: '2024-02-11 14:32:05 UTC',
      type: 'Typosquatting Mimicry',
      severity: 'CRITICAL',
      package: 'crypt-miner-helper v1.0.4',
      status: 'Quarantined',
      vector: 'Hidden secondary threads running CPU mining operations.',
      callStack: `Error: CPU bound exceeded
    at Worker.initialize (node_modules/crypt-miner-helper/dist/worker.js:45:12)
    at Module._compile (internal/modules/cjs/loader.js:1085:14)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1114:10)
    at Module.load (internal/modules/cjs/loader.js:950:32)`
    },
    {
      id: 'INC-2024-002',
      date: '2024-02-05 09:15:22 UTC',
      type: 'Data Exfiltration Attempt',
      severity: 'CRITICAL',
      package: 'mal-helper-utils v0.9.1',
      status: 'Blocked',
      vector: 'Interceptor blocked POST payload towards eval-server.cc.',
      callStack: `Error: Network Interceptor Block
    at Object.fetch (node_modules/mal-helper-utils/lib/telemetry.js:112:5)
    at sendPayload (node_modules/mal-helper-utils/lib/index.js:44:19)
    at flushQueue (node_modules/mal-helper-utils/lib/index.js:88:9)`
    }
  ];

  const report = incidents.find(i => i.id === activeReport);

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6 select-none">
      
      {/* Incident List */}
      <div className="w-80 glass-panel rounded-xl border border-cyber-border/40 flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-cyber-border/30 bg-cyber-panel/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search Incident ID..." 
              className="w-full bg-cyber-bg/50 border border-cyber-border/40 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyber-primary/50"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {incidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => setActiveReport(inc.id)}
              className={`w-full text-left p-4 border-b border-cyber-border/20 transition-all hover:bg-slate-800/50 ${activeReport === inc.id ? 'bg-slate-800 border-l-2 border-l-cyber-primary' : 'border-l-2 border-l-transparent'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-xs font-bold text-slate-200">{inc.id}</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${inc.severity === 'CRITICAL' ? 'bg-cyber-danger/20 text-cyber-danger' : 'bg-cyber-warning/20 text-cyber-warning'}`}>
                  {inc.severity}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mb-1 truncate">{inc.type}</div>
              <div className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {inc.date}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Forensic Report Details */}
      <div className="flex-1 glass-panel rounded-xl border border-cyber-border/40 p-6 flex flex-col overflow-y-auto">
        {report ? (
          <>
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyber-danger/10 rounded-xl border border-cyber-danger/20">
                  <ShieldAlert className="w-6 h-6 text-cyber-danger" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl tracking-wide text-slate-100 uppercase">
                    Incident Forensic Report
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-1">
                    <span className="text-cyber-primary">{report.id}</span>
                    <span>•</span>
                    <span>{report.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors text-xs font-mono text-slate-300">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyber-primary/30 bg-cyber-primary/10 hover:bg-cyber-primary/20 transition-colors text-xs font-mono text-cyber-primary">
                  <Download className="w-3.5 h-3.5" /> Export PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
              <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border/30">
                <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Threat Vector</div>
                <div className="font-bold text-sm text-slate-200">{report.type}</div>
              </div>
              <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border/30">
                <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Malicious Origin</div>
                <div className="font-bold font-mono text-sm text-cyber-warning">{report.package}</div>
              </div>
              <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border/30">
                <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">System Mitigation Status</div>
                <div className="font-bold text-sm text-cyber-success">{report.status}</div>
              </div>
              <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border/30">
                <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Impact Analysis</div>
                <div className="font-bold text-sm text-slate-300">Confined to Sandbox</div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-widest mb-3 border-b border-cyber-border/30 pb-2">
                <FileText className="w-4 h-4 text-cyber-primary" /> Incident Summary
              </h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {report.vector} The zero-trust interceptor successfully detected the anomalous behavior originating from the supply chain node. Immediate isolation protocols were enacted, preventing any escalation or persistent access.
              </p>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-widest mb-3 border-b border-cyber-border/30 pb-2 shrink-0">
                <Code className="w-4 h-4 text-cyber-purple" /> Captured Call Stack Trace
              </h3>
              <div className="flex-1 bg-[#0d1117] border border-slate-700/50 rounded-lg p-4 overflow-y-auto relative">
                <pre className="font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {report.callStack}
                </pre>
                <div className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
                  <ZoomIn className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <SearchX className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-mono text-sm">Select an incident report to view forensics.</p>
          </div>
        )}
      </div>

    </div>
  );
}
