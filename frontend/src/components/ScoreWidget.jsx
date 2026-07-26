import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function ScoreWidget({ logs }) {
  const [scoreData, setScoreData] = useState(null);

  useEffect(() => {
    // Fetch score dynamically
    const fetchScore = () => {
      fetch('/api/security-score')
        .then(res => res.json())
        .then(data => setScoreData(data))
        .catch(err => console.error("Score fetch failed", err));
    };

    fetchScore();
    // Re-fetch score whenever logs update
  }, [logs]);

  if (!scoreData) {
    return <div className="animate-pulse bg-cyber-panel border border-cyber-border/40 rounded-xl h-48 w-full"></div>;
  }

  const { score, trend, factors } = scoreData;
  const isGood = score >= 75;
  const isWarning = score >= 40 && score < 75;
  
  const chartData = trend.map((val, idx) => ({ time: idx, val }));

  return (
    <div className="glass-panel rounded-xl border border-cyber-border/40 p-5 flex flex-col justify-between h-[320px] relative overflow-hidden">
      <div className="flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2">
          {isGood ? <ShieldCheck className="w-5 h-5 text-cyber-success" /> : <ShieldAlert className={`w-5 h-5 ${isWarning ? 'text-cyber-warning' : 'text-cyber-danger'}`} />}
          <div>
            <h3 className="font-sans font-bold text-sm tracking-wide text-slate-100">
              Global Security Score
            </h3>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Live posture assessment
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-4xl font-display font-black tracking-tighter ${isGood ? 'text-cyber-success glow-text-success' : isWarning ? 'text-cyber-warning glow-text-warning' : 'text-cyber-danger glow-text-danger'}`}>
            {score}
          </div>
          <div className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase -mt-1">
            out of 100
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 z-10 relative">
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono uppercase tracking-widest text-cyber-success font-bold block mb-2">Positive Factors</span>
          {factors.positive.map((factor, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-300">
              <CheckCircle className="w-3 h-3 text-cyber-success shrink-0 mt-0.5" />
              <span className="leading-tight">{factor}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono uppercase tracking-widest text-cyber-danger font-bold block mb-2">Risk Factors</span>
          {factors.negative.length > 0 ? factors.negative.map((factor, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-300">
              <AlertTriangle className="w-3 h-3 text-cyber-danger shrink-0 mt-0.5" />
              <span className="leading-tight">{factor}</span>
            </div>
          )) : (
            <div className="text-[10px] text-slate-500 italic">No critical risks detected.</div>
          )}
        </div>
      </div>

      {/* Sparkline background graphic */}
      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20 z-0 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isGood ? '#10b981' : isWarning ? '#f59e0b' : '#f43f5e'} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={isGood ? '#10b981' : isWarning ? '#f59e0b' : '#f43f5e'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="val" stroke={isGood ? '#10b981' : isWarning ? '#f59e0b' : '#f43f5e'} strokeWidth="2" fillOpacity={1} fill="url(#scoreColor)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
