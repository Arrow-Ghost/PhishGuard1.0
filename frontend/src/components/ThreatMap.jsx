import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Network, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle,
  Flame,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';
import QuarantineWizard from './QuarantineWizard';

// --- Simple Physics Engine for Force-Directed Graph ---
const useForceGraph = (initialNodes, initialLinks, width, height) => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const animRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!initialNodes || initialNodes.length === 0) return;
    
    // Initialize node positions randomly near the center if they don't have one
    const initNodes = initialNodes.map(n => ({
      ...n,
      x: n.x ?? (width / 2 + (Math.random() - 0.5) * 100),
      y: n.y ?? (height / 2 + (Math.random() - 0.5) * 100),
      vx: 0,
      vy: 0,
      fx: n.type === 'root' ? width / 2 : null, // Fix root node to center
      fy: n.type === 'root' ? height / 2 : null,
    }));

    nodesRef.current = initNodes;
    linksRef.current = initialLinks;
    setNodes(initNodes);
    setLinks(initialLinks);

    const simulation = () => {
      const alpha = 0.1; // cooling factor
      const repulsion = 2000;
      const springLength = 120;
      const springStrength = 0.05;
      const centerForce = 0.01;

      let hasMovement = false;

      nodesRef.current.forEach(node => {
        if (node.fx !== null && node.fy !== null) {
          node.x = node.fx;
          node.y = node.fy;
          return;
        }

        let fx = 0, fy = 0;

        // Repulsion between all nodes
        nodesRef.current.forEach(other => {
          if (node.id === other.id) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        });

        // Center force
        const dx = (width / 2) - node.x;
        const dy = (height / 2) - node.y;
        fx += dx * centerForce;
        fy += dy * centerForce;

        node.vx = (node.vx + fx * alpha) * 0.9; // 0.9 is friction
        node.vy = (node.vy + fy * alpha) * 0.9;
      });

      // Attraction along links
      linksRef.current.forEach(link => {
        const source = nodesRef.current.find(n => n.id === link.source);
        const target = nodesRef.current.find(n => n.id === link.target);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - springLength) * springStrength;
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (source.fx === null) {
          source.vx += fx * alpha;
          source.vy += fy * alpha;
        }
        if (target.fx === null) {
          target.vx -= fx * alpha;
          target.vy -= fy * alpha;
        }
      });

      // Apply velocities
      nodesRef.current.forEach(node => {
        if (node.fx === null) {
          node.x += node.vx;
          node.y += node.vy;
          
          if (Math.abs(node.vx) > 0.01 || Math.abs(node.vy) > 0.01) {
            hasMovement = true;
          }
        }
      });

      if (hasMovement || isDragging.current) {
        setNodes([...nodesRef.current]);
      }

      animRef.current = requestAnimationFrame(simulation);
    };

    animRef.current = requestAnimationFrame(simulation);

    return () => cancelAnimationFrame(animRef.current);
  }, [initialNodes, initialLinks, width, height]);

  const updateNodeState = (nodeId, updates) => {
    nodesRef.current = nodesRef.current.map(n => n.id === nodeId ? { ...n, ...updates } : n);
    setNodes([...nodesRef.current]);
  };

  return { nodes: nodesRef.current, links: linksRef.current, updateNodeState };
};

export default function ThreatMap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialData, setInitialData] = useState({ nodes: [], links: [] });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  // Viewport state
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [quarantiningNode, setQuarantiningNode] = useState(null);
  const svgRef = useRef(null);
  
  const width = 800;
  const height = 600;

  useEffect(() => {
    fetch('/api/dependency-graph')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (data.error) throw new Error(data.error);
        setInitialData(data);
        if (data.nodes.length > 0) setSelectedNodeId(data.nodes[0].id);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load dependency graph. Backend might be unreachable.');
        setLoading(false);
      });
  }, []);

  const { nodes, links, updateNodeState } = useForceGraph(initialData.nodes, initialData.links, width, height);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Interaction handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    setTransform(prev => ({ ...prev, k: Math.max(0.2, Math.min(prev.k * delta, 4)) }));
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg') {
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => setTransform(prev => ({ ...prev, k: Math.min(prev.k * 1.2, 4) }));
  const handleZoomOut = () => setTransform(prev => ({ ...prev, k: Math.max(prev.k / 1.2, 0.2) }));
  const handleResetView = () => setTransform({ x: 0, y: 0, k: 1 });

  const getLinkColor = (targetNode) => {
    if (!targetNode) return 'stroke-cyber-success/40';
    if (targetNode.quarantined) return 'stroke-slate-700 stroke-dasharray-[4]';
    if (targetNode.riskScore >= 70) return 'stroke-cyber-danger/60';
    if (targetNode.riskScore >= 40) return 'stroke-cyber-warning/60';
    return 'stroke-cyber-success/40';
  };

  const handleQuarantine = (pkgId) => {
    const pkg = nodes.find(n => n.id === pkgId);
    if (!pkg) return;
    setQuarantiningNode(pkg);
  };

  const finalizeQuarantine = () => {
    if (!quarantiningNode) return;
    console.warn(`[AUDIT] Package ${quarantiningNode.name} has been successfully quarantined and neutralized.`);
    
    updateNodeState(quarantiningNode.id, { 
      quarantined: true, 
      riskScore: 0, 
      findings: 'Quarantined. Neutralized via active SOC rules.',
      category: 'safe'
    });
    
    setQuarantiningNode(null);
  };

  if (loading) return <div className="flex h-[calc(100vh-6rem)] items-center justify-center text-cyber-primary font-mono text-sm animate-pulse">Initializing Threat Vector Map...</div>;
  if (error) return <div className="flex h-[calc(100vh-6rem)] items-center justify-center text-cyber-danger font-mono text-sm">{error}</div>;

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6 select-none">
      {quarantiningNode && (
        <QuarantineWizard 
          pkg={quarantiningNode}
          onComplete={finalizeQuarantine}
          onCancel={() => setQuarantiningNode(null)}
        />
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 glass-panel rounded-xl border border-cyber-border/40 flex flex-col relative overflow-hidden">
        
        {/* Toolbar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
          <div className="flex items-center gap-2.5 bg-cyber-bg/80 backdrop-blur-sm p-3 rounded-xl border border-cyber-border/40 pointer-events-auto">
            <div className="p-2 bg-cyber-primary/10 rounded-lg border border-cyber-primary/20">
              <Network className="w-5 h-5 text-cyber-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base tracking-wider text-slate-100 uppercase">
                Dynamic Threat-Vector Map
              </h2>
              <p className="text-[10px] font-mono text-cyber-primary uppercase">
                Live Force-Directed Topology
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="flex items-center gap-1 bg-cyber-bg/80 backdrop-blur-sm border border-cyber-border/40 rounded-lg p-1">
              <button onClick={handleZoomIn} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={handleResetView} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors">
                <Maximize className="w-4 h-4" />
              </button>
              <button onClick={handleZoomOut} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors">
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5 bg-cyber-bg/80 backdrop-blur-sm border border-cyber-border/40 rounded-lg p-3 font-mono text-[9px] uppercase tracking-wider">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-cyber-success shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> SECURE
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-cyber-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> WARNING
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-cyber-danger shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span> CRITICAL
              </div>
            </div>
          </div>
        </div>

        {/* Graph Canvas */}
        <div className="flex-1 bg-cyber-bg/20 relative cursor-grab active:cursor-grabbing">
          <svg 
            ref={svgRef}
            className="w-full h-full"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <g transform={`translate(${transform.x + width/2}, ${transform.y + height/2}) scale(${transform.k}) translate(${-width/2}, ${-height/2})`}>
              
              {/* Links */}
              {links.map((link, idx) => {
                const srcNode = nodes.find(n => n.id === link.source);
                const tgtNode = nodes.find(n => n.id === link.target);
                if (!srcNode || !tgtNode) return null;
                
                const isQuarantined = tgtNode.quarantined;
                
                return (
                  <g key={`link-${idx}`}>
                    <line
                      x1={srcNode.x}
                      y1={srcNode.y}
                      x2={tgtNode.x}
                      y2={tgtNode.y}
                      className={`stroke-[1.5] transition-colors duration-500 ${getLinkColor(tgtNode)}`}
                    />
                    {!isQuarantined && tgtNode.riskScore >= 70 && (
                      <circle r="2" className="fill-cyber-danger">
                        <animateMotion
                          path={`M ${srcNode.x} ${srcNode.y} L ${tgtNode.x} ${tgtNode.y}`}
                          dur={`${Math.max(1, 4 - (tgtNode.riskScore / 25))}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isRoot = node.type === 'root';
                const isQuarantined = node.quarantined;
                const isCritical = node.riskScore >= 70 && !isQuarantined;
                const isWarning = node.riskScore >= 40 && node.riskScore < 70 && !isQuarantined;
                
                return (
                  <g 
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="cursor-pointer transition-transform duration-300 hover:scale-110 origin-center"
                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                  >
                    {/* Ripple effect for critical nodes */}
                    {isCritical && (
                      <circle cx={node.x} cy={node.y} r={node.r} className="fill-none stroke-cyber-danger/50 stroke-[2] animate-ping origin-center" />
                    )}

                    {/* Quarantined overlay */}
                    {isQuarantined && (
                      <circle cx={node.x} cy={node.y} r={node.r + 6} className="fill-none stroke-slate-500 stroke-[1.5] stroke-dasharray-[4]" />
                    )}

                    {/* Selected highlight */}
                    {isSelected && (
                      <circle cx={node.x} cy={node.y} r={node.r + 4} className={`fill-none stroke-[2] ${isRoot ? 'stroke-cyber-primary' : isCritical ? 'stroke-cyber-danger' : isWarning ? 'stroke-cyber-warning' : 'stroke-cyber-success'}`} />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r}
                      className={`stroke-[2.5] fill-[#0d1117] transition-colors duration-300 ${
                        isQuarantined ? 'stroke-slate-600 fill-slate-900/90' : 
                        isRoot ? 'stroke-cyber-primary shadow-glow-primary' : 
                        isCritical ? 'stroke-cyber-danger shadow-glow-danger' : 
                        isWarning ? 'stroke-cyber-warning shadow-glow-warning' : 'stroke-cyber-success'
                      }`}
                      style={{ filter: isCritical ? 'drop-shadow(0 0 10px rgba(244,63,94,0.5))' : isRoot ? 'drop-shadow(0 0 10px rgba(0,240,255,0.3))' : 'none' }}
                    />

                    {/* Icon */}
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      className="font-sans text-[12px] font-bold select-none pointer-events-none fill-slate-300"
                    >
                      {isRoot ? 'C' : isQuarantined ? '🔒' : isCritical ? '🛑' : isWarning ? '⚠️' : '✓'}
                    </text>

                    {/* Label */}
                    <text
                      x={node.x}
                      y={node.y + node.r + 14}
                      textAnchor="middle"
                      className={`font-mono text-[9px] font-bold select-none pointer-events-none tracking-wide ${isCritical ? 'fill-cyber-danger' : isWarning ? 'fill-cyber-warning' : 'fill-slate-400'}`}
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Side Inspector Panel */}
      {selectedNode && (
        <div className="w-80 glass-panel rounded-xl border border-cyber-border/40 p-5 flex flex-col shrink-0 animate-fadeIn">
          <div className="flex items-center gap-3 mb-5 border-b border-cyber-border/30 pb-4">
            {selectedNode.quarantined ? (
              <ShieldCheck className="w-6 h-6 text-slate-500" />
            ) : selectedNode.riskScore >= 70 ? (
              <ShieldAlert className="w-6 h-6 text-cyber-danger animate-pulse" />
            ) : selectedNode.type === 'root' ? (
              <Network className="w-6 h-6 text-cyber-primary" />
            ) : (
              <CheckCircle className="w-6 h-6 text-cyber-success" />
            )}
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm tracking-wider text-slate-100 uppercase truncate" title={selectedNode.name}>
                {selectedNode.name}
              </h3>
              <span className="text-[10px] font-mono text-cyber-muted uppercase block mt-0.5">
                v{selectedNode.version}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 font-mono text-xs pr-1 custom-scrollbar">
            
            {/* Risk Gauge */}
            {selectedNode.type !== 'root' && (
              <div>
                <div className="text-[10px] text-cyber-muted uppercase tracking-widest mb-1.5 flex justify-between">
                  <span>Risk Index</span>
                  <span className={`${selectedNode.riskScore >= 70 ? 'text-cyber-danger' : selectedNode.riskScore >= 40 ? 'text-cyber-warning' : 'text-cyber-success'}`}>
                    {selectedNode.quarantined ? '0' : selectedNode.riskScore}/100
                  </span>
                </div>
                <div className="h-2 bg-cyber-bg rounded-full overflow-hidden border border-cyber-border/30">
                  <div 
                    style={{ width: `${selectedNode.quarantined ? 0 : selectedNode.riskScore}%` }}
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      selectedNode.riskScore >= 70 ? 'bg-cyber-danger shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 
                      selectedNode.riskScore >= 40 ? 'bg-cyber-warning shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-cyber-success'
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-cyber-bg/50 border border-cyber-border/20 rounded-lg">
                <div className="text-[9px] text-slate-500 uppercase mb-1">Publisher</div>
                <div className="font-bold text-slate-300 truncate" title={selectedNode.author}>{selectedNode.author || 'Unknown'}</div>
              </div>
              <div className="p-3 bg-cyber-bg/50 border border-cyber-border/20 rounded-lg">
                <div className="text-[9px] text-slate-500 uppercase mb-1">License</div>
                <div className="font-bold text-slate-300">{selectedNode.license || 'Unknown'}</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-cyber-muted uppercase tracking-widest mb-1.5">Package Scope</div>
              <p className="text-[11px] leading-relaxed text-slate-400 p-3 bg-cyber-bg/30 border border-cyber-border/20 rounded-lg">
                {selectedNode.description || 'No description provided for this package.'}
              </p>
            </div>

            <div>
              <div className="text-[10px] text-cyber-muted uppercase tracking-widest mb-1.5">Security Audit Details</div>
              <div className={`p-3 rounded-lg border text-[11px] leading-relaxed transition-colors ${
                selectedNode.quarantined ? 'bg-slate-800/50 border-slate-600 text-slate-400' :
                selectedNode.riskScore >= 70 ? 'bg-cyber-danger/5 border-cyber-danger/30 text-cyber-danger' : 
                selectedNode.riskScore >= 40 ? 'bg-cyber-warning/5 border-cyber-warning/30 text-cyber-warning' : 'bg-cyber-success/5 border-cyber-success/30 text-cyber-success'
              }`}>
                {selectedNode.findings}
              </div>
            </div>

            {selectedNode.cves && selectedNode.cves.length > 0 && (
              <div>
                <div className="text-[10px] text-cyber-muted uppercase tracking-widest mb-1.5">Known Vulnerabilities (CVE)</div>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.cves.map((cve, idx) => (
                    <span key={idx} className="px-2 py-1 bg-cyber-danger/10 border border-cyber-danger/40 text-cyber-danger rounded text-[9px] font-bold tracking-wider">
                      {cve}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.recommendations && selectedNode.recommendations.length > 0 && !selectedNode.quarantined && (
              <div>
                <div className="text-[10px] text-cyber-muted uppercase tracking-widest mb-1.5">Actionable Recommendations</div>
                <ul className="space-y-2 p-3 bg-cyber-bg/30 border border-cyber-primary/20 rounded-lg">
                  {selectedNode.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[10px] text-slate-300">
                      <span className="text-cyber-primary mt-0.5">▶</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Quarantine Action */}
          {selectedNode.type !== 'root' && (
            <div className="mt-5 pt-4 border-t border-cyber-border/30 shrink-0">
              <button
                onClick={() => handleQuarantine(selectedNode.id)}
                disabled={selectedNode.quarantined}
                className={`w-full py-3 rounded-lg font-mono text-[11px] font-bold tracking-widest uppercase transition-all duration-300 border flex items-center justify-center gap-2 ${
                  selectedNode.quarantined
                    ? 'bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-cyber-danger/10 border-cyber-danger text-cyber-danger hover:bg-cyber-danger hover:text-white shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                }`}
              >
                {selectedNode.quarantined ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Package Neutralized
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 animate-pulse" /> Quarantine Package
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
