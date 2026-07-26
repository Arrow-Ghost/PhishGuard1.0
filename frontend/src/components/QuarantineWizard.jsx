import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Trash2, CheckCircle, Flame } from 'lucide-react';

export default function QuarantineWizard({ pkg, onComplete, onCancel }) {
  const [step, setStep] = useState(0);

  const steps = [
    { title: 'Initiating Quarantine Protocol', icon: ShieldAlert, color: 'text-cyber-warning' },
    { title: 'Isolating Execution Context', icon: Lock, color: 'text-cyber-primary' },
    { title: 'Purging Network Handlers', icon: Trash2, color: 'text-cyber-danger' },
    { title: 'Threat Neutralized', icon: CheckCircle, color: 'text-cyber-success' }
  ];

  useEffect(() => {
    if (step < steps.length - 1) {
      const timer = setTimeout(() => {
        setStep(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete, steps.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="glass-panel w-full max-w-lg rounded-xl border border-cyber-danger/50 shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyber-danger/20">
          <div 
            className="h-full bg-cyber-danger transition-all duration-1000 ease-linear shadow-glow-danger"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full border-4 border-cyber-danger/30 flex items-center justify-center bg-cyber-danger/10 mb-6 relative">
            <Flame className="w-10 h-10 text-cyber-danger animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-t-cyber-danger border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>

          <h2 className="font-display font-bold tracking-widest text-lg text-slate-100 uppercase mb-2">
            Quarantining Node
          </h2>
          <p className="font-mono text-xs text-cyber-danger mb-8 bg-cyber-danger/10 px-3 py-1 rounded">
            Target: {pkg.name} (v{pkg.version})
          </p>

          <div className="w-full space-y-4">
            {steps.map((s, idx) => {
              const isActive = step === idx;
              const isPast = step > idx;
              const Icon = s.icon;
              
              return (
                <div key={idx} className={`flex items-center gap-4 transition-all duration-300 ${isActive ? 'opacity-100 scale-105 transform translate-x-2' : isPast ? 'opacity-50' : 'opacity-20'}`}>
                  <div className={`p-2 rounded-lg ${isActive ? `bg-slate-800 ${s.color}` : 'bg-slate-800 text-slate-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className={`font-mono text-xs font-bold uppercase tracking-wider ${isActive ? s.color : 'text-slate-400'}`}>
                      {s.title}
                    </div>
                    {isActive && <div className="text-[10px] text-slate-500 mt-0.5">Processing security audit trail...</div>}
                  </div>
                  {isPast && <CheckCircle className="w-4 h-4 text-cyber-success ml-auto" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
