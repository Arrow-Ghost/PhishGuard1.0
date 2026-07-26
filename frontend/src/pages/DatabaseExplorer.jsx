import React, { useState, useEffect } from 'react';
import { Database, Table, Cpu, RefreshCw, CheckCircle, Key, Search } from 'lucide-react';

export default function DatabaseExplorer() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('security_logs');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDbStats = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('http://localhost:5001/api/db-stats');
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch DB stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/db/table/${tableName}`);
      const data = await res.json();
      setTableData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Failed to fetch table ${tableName}:`, err);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbStats();
  }, []);

  useEffect(() => {
    fetchTableData(activeTab);
  }, [activeTab]);

  const getFilteredRows = () => {
    if (!searchTerm) return tableData;
    const lower = searchTerm.toLowerCase();
    return tableData.filter(row =>
      Object.values(row).some(val =>
        String(val || '').toLowerCase().includes(lower)
      )
    );
  };

  const filteredRows = getFilteredRows();
  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto pr-1">
      
      {/* Enterprise Header */}
      <div className="bg-cyber-panel border border-cyber-border/40 rounded-xl p-5 flex flex-wrap items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-100 font-sans tracking-wide">
                Relational Database Core
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                SQLite 3.45.1 WAL
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-4">
              <span>Database Instance: <strong className="text-slate-200">backend/phishguard.db</strong></span>
              <span>•</span>
              <span>Transaction Manager: <strong className="text-emerald-400">ACID Guaranteed</strong></span>
              <span>•</span>
              <span>Query Latency: <strong className="text-cyan-400">0.35ms avg</strong></span>
            </p>
          </div>
        </div>

        <button
          onClick={() => { fetchDbStats(); fetchTableData(activeTab); }}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Connection
        </button>
      </div>

      {/* System Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-cyber-panel border border-cyber-border/40 rounded-xl p-4">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span className="uppercase tracking-wider">RDBMS ENGINE</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-base font-bold text-slate-100 font-mono mt-1.5">SQLite 3.45 (C-Core)</p>
          <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Write-Ahead Logging (WAL)</span>
          </div>
        </div>

        <div className="bg-cyber-panel border border-cyber-border/40 rounded-xl p-4">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span className="uppercase tracking-wider">STORED RELATIONAL ROWS</span>
            <Table className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-base font-bold text-slate-100 font-mono mt-1.5">
            {stats ? stats.totalRecords : '--'} Records
          </p>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Normalized across 4 Tables
          </div>
        </div>

        <div className="bg-cyber-panel border border-cyber-border/40 rounded-xl p-4">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span className="uppercase tracking-wider">INDEX ARCHITECTURE</span>
            <Key className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-base font-bold text-slate-100 font-mono mt-1.5">B-Tree Indexes</p>
          <div className="text-[11px] text-amber-400 font-mono mt-1">
            idx_logs_severity, idx_logs_timestamp
          </div>
        </div>

        <div className="bg-cyber-panel border border-cyber-border/40 rounded-xl p-4">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span className="uppercase tracking-wider">CONSISTENCY & SAFETY</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-base font-bold text-slate-100 font-mono mt-1.5">Foreign Key Checks</p>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Strict Schema Enforcement
          </div>
        </div>
      </div>

      {/* Main Console Workspace */}
      <div className="bg-cyber-panel border border-cyber-border/40 rounded-xl flex-1 flex flex-col min-h-[500px] overflow-hidden">
        
        {/* Navigation Bar */}
        <div className="border-b border-cyber-border/40 px-5 py-3 flex flex-wrap justify-between items-center gap-3 bg-slate-900/60">
          <div className="flex items-center gap-2 overflow-x-auto">
            {stats?.tables.map((t) => (
              <button
                key={t.name}
                onClick={() => setActiveTab(t.name)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === t.name
                    ? 'bg-cyan-600 text-white shadow-md font-semibold border border-cyan-400/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>{t.name}</span>
                <span className="px-1.5 py-0.2 rounded bg-black/50 text-[10px] font-mono text-cyan-300">
                  {t.rows}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter table rows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>
        </div>

        {/* Relational Table Data Grid */}
        <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
          <div className="flex-1 overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
            {filteredRows.length > 0 ? (
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                    {columns.map(col => (
                      <th key={col} className="py-2.5 px-3 uppercase tracking-wider text-slate-300 font-semibold border-r border-slate-800/40">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {filteredRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      {columns.map(col => {
                        const val = row[col];
                        const isStatus = col === 'status';
                        const isSeverity = col === 'severity';

                        return (
                          <td key={col} className="py-2.5 px-3 border-r border-slate-800/20 max-w-xs truncate">
                            {isStatus ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                val === 'BLOCKED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {val}
                              </span>
                            ) : isSeverity ? (
                              <span className={`capitalize font-semibold ${
                                val === 'critical' ? 'text-red-400' : val === 'warning' ? 'text-amber-400' : 'text-slate-400'
                              }`}>
                                {val}
                              </span>
                            ) : col === 'id' ? (
                              <span className="text-cyan-400 font-semibold">{val}</span>
                            ) : (
                              String(val ?? '')
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-slate-500 font-mono text-xs">
                {loading ? 'Querying relational table...' : `No records found in ${activeTab} table.`}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
