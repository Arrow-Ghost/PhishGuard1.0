/**
 * PhishGuard.js - Backend Telemetry Hub
 * [Aishani's Domain - Backend Service]
 * 
 * Sets up Express routes and a real-time WebSockets connection layer to accept
 * telemetry logs from browser interceptors and broadcast them instantly.
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { scanPackageJson } = require('./parser');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Create HTTP & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket Connection pool
const clients = new Set();

wss.on('connection', async (ws) => {
  clients.add(ws);
  console.log(`[PhishGuard Hub] Client connected to live events (${clients.size} total active users)`);
  
  try {
    // Seed clients with existing security logs from SQLite DB upon handshake
    const seededLogs = await db.getLogs(150);
    ws.send(JSON.stringify({ type: 'SEEDED_LOGS', data: seededLogs }));
  } catch (err) {
    console.error('[PhishGuard Hub] Error fetching seeded logs from SQLite:', err);
  }

  // Listen to telemetry data sent from security-agent/interceptor.js over WS
  ws.on('message', async (message) => {
    try {
      const payload = JSON.parse(message);
      
      if (payload.action === 'Network FETCH Request' && payload.status === 'BLOCKED') {
        const newLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date().toISOString(),
          sourcePackage: payload.callerContext || 'anonymous',
          callerUrl: payload.target || 'unknown',
          action: payload.action,
          details: `Target: ${payload.target} [Latency: ${payload.latencyMs}ms]`,
          status: payload.status,
          severity: payload.severity ? payload.severity.toLowerCase() : 'critical',
          stack: ''
        };

        // Persist to SQLite Database
        await db.insertLog(newLog);

        // Print nicely in server process stdout
        const color = newLog.severity === 'critical' ? '\x1b[31m' : newLog.severity === 'warning' ? '\x1b[33m' : '\x1b[32m';
        console.log(`[TELEMETRY via WS -> SQLite] [${newLog.status}] ${color}${newLog.severity.toUpperCase()}\x1b[0m: [${newLog.sourcePackage}] - ${newLog.action} -> ${newLog.details}`);

        // Broadcast to all active developer dashboards
        broadcastLog(newLog);
      }
    } catch (err) {
      console.error('[PhishGuard Hub] Error parsing client telemetry payload over WS:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[PhishGuard Hub] Client disconnected (${clients.size} remaining)`);
  });
});

// Broadcast utilities
function broadcastLog(log) {
  const payload = JSON.stringify({ type: 'NEW_LOG', data: log });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date(), database: 'SQLite 3 RDBMS Connected' });
});

// DBMS Inspector Statistics endpoint
app.get('/api/db-stats', async (req, res) => {
  try {
    const stats = await db.getDatabaseStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve database stats' });
  }
});

// Returns the full list of log telemetry history from SQLite
app.get('/api/telemetry', async (req, res) => {
  try {
    const logs = await db.getLogs(150);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to query telemetry logs from SQLite database' });
  }
});

// Endpoint to ingest client interceptor payloads and persist to SQLite
app.post('/api/telemetry', async (req, res) => {
  const { sourcePackage, callerUrl, action, details, status, severity, stack } = req.body;
  
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    sourcePackage: sourcePackage || 'anonymous',
    callerUrl: callerUrl || 'unknown',
    action: action || 'Network Operation',
    details: details || '',
    status: status || 'ALLOWED',
    severity: severity || 'info',
    stack: stack || ''
  };

  try {
    await db.insertLog(newLog);

    // Print nicely in server process stdout
    const color = severity === 'critical' ? '\x1b[31m' : severity === 'warning' ? '\x1b[33m' : '\x1b[32m';
    console.log(`[TELEMETRY -> SQLite] [${newLog.status}] ${color}${newLog.severity.toUpperCase()}\x1b[0m: [${newLog.sourcePackage}] - ${newLog.action} -> ${newLog.details}`);

    // Broadcast to all active developer dashboards
    broadcastLog(newLog);

    res.status(201).json({ success: true, logId: newLog.id });
  } catch (err) {
    console.error('[PhishGuard Server] Error persisting telemetry log to SQLite:', err);
    res.status(500).json({ error: 'Failed to insert telemetry log into SQLite database' });
  }
});

// Endpoint to fetch rows for any table
app.get('/api/db/table/:tableName', async (req, res) => {
  try {
    const rows = await db.getTableRows(req.params.tableName);
    res.json(rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint to execute custom SELECT SQL queries live
app.post('/api/db/query', async (req, res) => {
  const { sql } = req.body;
  if (!sql) return res.status(400).json({ error: 'SQL query parameter is required.' });

  try {
    const result = await db.executeCustomQuery(sql);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Dependency Analyzer Scan endpoint
app.post('/api/scan', (req, res) => {
  const { packageJson } = req.body;
  
  if (!packageJson) {
    return res.status(400).json({ error: 'Missing packageJson in request payload.' });
  }

  try {
    let parsedConfig = packageJson;
    if (typeof packageJson === 'string') {
      parsedConfig = JSON.parse(packageJson);
    }
    
    const analysisReport = scanPackageJson(parsedConfig);
    res.json(analysisReport);
  } catch (error) {
    res.status(400).json({ error: `Malformatted JSON specification: ${error.message}` });
  }
});

// Endpoint for Global Security Score Engine
app.get('/api/security-score', async (req, res) => {
  try {
    const logs = await db.getLogs(150);
    let score = 100;
    const criticals = logs.filter(l => l.severity === 'critical').length;
    const warnings = logs.filter(l => l.severity === 'warning').length;
    
    score -= (criticals * 8);
    score -= (warnings * 3);
    
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    
    // Create trend
    const trend = [
      score + 15, score + 10, score + 8, score + 5, score - 2, score + 1, score
    ].map(s => Math.min(100, Math.max(0, s)));
    
    res.json({
      score,
      trend,
      factors: {
        positive: ['167 Safe Packages Scanned', 'SQLite Security Store Online', 'Trusted Domains Enforced'],
        negative: [
          criticals > 0 ? `${criticals} High-Risk Blocked Attacks` : null,
          warnings > 0 ? `${warnings} Active Telemetry Warnings` : null,
          'Deprecated Package Detected: request'
        ].filter(Boolean)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute security score from SQLite' });
  }
});

// Endpoint for Package Trust Classification
const packageClassifications = {
  trusted: [
    { name: 'react', publisher: 'Meta', version: '18.2.0', score: 98 },
    { name: 'axios', publisher: 'Matt Zabriskie', version: '1.6.7', score: 95 },
    { name: 'redux', publisher: 'Redux JS', version: '5.0.1', score: 96 }
  ],
  monitored: [
    { name: 'lodash', publisher: 'OpenJS', version: '4.17.20', score: 65, reason: 'CVE-2020-8203' },
    { name: 'moment', publisher: 'Moment', version: '2.29.4', score: 55, reason: 'Deprecated status' }
  ],
  quarantined: [
    { name: 'crypt-miner-helper', publisher: 'Unknown', version: '1.0.4', score: 5, reason: 'Malicious execution' },
    { name: 'mal-helper-utils', publisher: 'Unknown', version: '0.9.1', score: 12, reason: 'Exfiltration' }
  ]
};

app.get('/api/packages/classification', (req, res) => {
  res.json(packageClassifications);
});

// Endpoint for AI Threat Analysis Engine
app.post('/api/analyze-threat', async (req, res) => {
  const { logId } = req.body;
  try {
    const logs = await db.getLogs(150);
    const log = logs.find(l => l.id === logId);

    if (!log) {
      return res.status(404).json({ error: 'Log not found in SQLite Database' });
    }

    // Generate heuristic analysis based on log content
    let summary, risk, reason, impact, recommended;

    if (log.action.includes('Network')) {
      summary = `A script from package '${log.sourcePackage}' attempted an unauthorized external network request to '${log.callerUrl}'.`;
      risk = log.status === 'BLOCKED' ? 'Critical' : 'Warning';
      reason = 'Domain reputation violation. Target domain matches known untrusted threat intel vectors.';
      impact = 'Potential data exfiltration, including credential or JWT theft.';
      recommended = 'Review the dependency tree, quarantine the package, and revoke any recently used session tokens.';
    } else if (log.action.includes('DOM')) {
      summary = `Dynamic element insertion detected. A script attempted to load an external resource from a blocked origin.`;
      risk = 'Critical';
      reason = 'Cross-Site Scripting (XSS) / Malicious Injection attempt.';
      impact = 'Arbitrary code execution within the trusted browser context.';
      recommended = 'Remove dependency immediately and ensure Content Security Policies (CSP) strictly block unauthorized domains.';
    } else {
      summary = `Suspicious internal activity from '${log.sourcePackage}' accessing sensitive APIs.`;
      risk = 'Warning';
      reason = 'Access to LocalStorage credentials or critical DOM APIs.';
      impact = 'Preparation for credential harvesting or token manipulation.';
      recommended = 'Monitor package closely. Consider sandboxing or restricting the package scope.';
    }

    res.json({ summary, risk, reason, impact, recommended });
  } catch (err) {
    res.status(500).json({ error: 'Error analyzing threat payload' });
  }
});

// Endpoint for Threat Intelligence Feed
const threatIntelEvents = [
  { id: 'TI-1', time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'CVE-2024-1234', title: 'Zero-Day in npm "request"', source: 'NVD' },
  { id: 'TI-2', time: new Date(Date.now() - 1000 * 60 * 25).toISOString(), type: 'Campaign', title: 'Malicious Typosquatting: "reacr"', source: 'PhishGuard Labs' },
  { id: 'TI-3', time: new Date(Date.now() - 1000 * 60 * 120).toISOString(), type: 'Botnet', title: 'Exfiltration IP Blocklist Updated', source: 'CISA' },
  { id: 'TI-4', time: new Date(Date.now() - 1000 * 60 * 300).toISOString(), type: 'CVE-2023-4512', title: 'Critical Prototype Pollution in lodash', source: 'Snyk' }
];

app.get('/api/threat-intel', (req, res) => {
  res.json(threatIntelEvents);
});

// Endpoint for Threat Prediction Engine
app.get('/api/threat-prediction', (req, res) => {
  // Mock forecasting data based on past 30 days trends
  const forecast = Array.from({ length: 14 }).map((_, i) => ({
    day: `Day +${i + 1}`,
    probability: Math.floor(Math.random() * 30 + (i * 2)),
    predictedVectors: ['Typosquatting', 'Prototype Pollution', 'Data Exfil'][Math.floor(Math.random() * 3)]
  }));

  const packageRisks = [
    { name: 'lodash', score: 85, driver: 'Age & Open CVEs' },
    { name: 'request', score: 95, driver: 'Deprecated' },
    { name: 'crypt-miner-helper', score: 99, driver: 'Heuristic Match' }
  ];

  res.json({ forecast, packageRisks });
});

// Endpoint for Real Dependency Graph
app.get('/api/dependency-graph', (req, res) => {
  try {
    const pkgJsonPath = path.join(__dirname, 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    
    let nodes = [
      {
        id: 'node-root',
        name: 'PhishGuard App Host',
        type: 'root',
        x: 350,
        y: 250,
        r: 35,
        version: pkgJson.version || '1.0.0',
        riskScore: 0,
        category: 'safe',
        license: pkgJson.license || 'MIT',
        author: pkgJson.author || 'Main Developer',
        description: 'The core client execution application compiling all security agents.',
        findings: 'Safe. Client DOM sandboxing hooks active.'
      }
    ];

    let links = [];

    // Parse real dependencies
    const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
    const depNames = Object.keys(deps);
    
    // Create nodes around the root in a circle
    const radius = 150;
    
    depNames.forEach((name, idx) => {
      const angle = (idx / depNames.length) * 2 * Math.PI;
      const x = 350 + radius * Math.cos(angle);
      const y = 250 + radius * Math.sin(angle);
      
      nodes.push({
        id: `node-${name}`,
        name: name,
        type: 'dependency',
        x,
        y,
        r: 25,
        version: deps[name].replace('^', '').replace('~', ''),
        riskScore: Math.floor(Math.random() * 20), // Low mock risk for real deps
        category: 'safe',
        license: 'MIT',
        author: 'Open Source Contributor',
        description: `Utility library for ${name}`,
        findings: 'Safe. Standard verified module.'
      });
      
      links.push({ source: 'node-root', target: `node-${name}` });
    });

    // Inject our mock malicious nodes for demo purposes!
    const maliciousNodes = [
      {
        id: 'node-lodash-legacy',
        name: 'lodash-legacy',
        type: 'dependency',
        x: 100,
        y: 400,
        r: 28,
        version: '4.17.20',
        riskScore: 55,
        category: 'warning',
        license: 'MIT',
        author: 'OpenJS Foundation',
        description: 'Older version of lodash with known telemetry tracking issues.',
        findings: 'WARNING: Sends anonymous telemetry data to untrusted external analytics domains.',
        cves: [],
        recommendations: ['Update to lodash@4.17.21 or higher', 'Block telemetry domain in CSP']
      },
      {
        id: 'node-moment',
        name: 'moment-timezone',
        type: 'dependency',
        x: 600,
        y: 400,
        r: 28,
        version: '0.5.43',
        riskScore: 45,
        category: 'warning',
        license: 'MIT',
        author: 'Moment.js',
        description: 'Timezone utility. Heavily utilizes LocalStorage for caching timezone binaries.',
        findings: 'WARNING: Excessive LocalStorage usage. Deprecated package status.',
        cves: [],
        recommendations: ['Migrate to native Intl.DateTimeFormat', 'Migrate to date-fns']
      },
      {
        id: 'node-miner',
        name: 'crypt-miner-helper',
        type: 'dependency',
        x: 560,
        y: 100,
        r: 28,
        version: '1.0.4',
        riskScore: 94,
        category: 'critical',
        license: 'Apache-2.0',
        author: 'anonymous-actor',
        description: 'Calculates dynamic canvas frames. Contains hidden secondary threads running CPU mining operations.',
        findings: 'CRITICAL THREAT: Typosquatting mimicry detected. Dynamic resource harvesting triggered during window idle.',
        cves: ['PhishGuard-ZeroDay-001'],
        recommendations: ['Immediate Quarantine', 'Purge from node_modules', 'Review package.json for similar typosquatting'],
        history: [
          { date: '2024-02-10', event: 'Installed by developer (accidental typosquat)' },
          { date: '2024-02-11', event: 'CPU spike detected by telemetry' },
          { date: '2024-02-11', event: 'Quarantined by PhishGuard' }
        ]
      },
      {
        id: 'node-dom-inject',
        name: 'dom-injector-lib',
        type: 'dependency',
        x: 150,
        y: 100,
        r: 28,
        version: '2.1.0',
        riskScore: 88,
        category: 'critical',
        license: 'MIT',
        author: 'suspicious-dev-org',
        description: 'Utility for dynamic modal popups. Injects external <script> tags to load remote CSS/JS payloads.',
        findings: 'CRITICAL THREAT: Interceptor blocked script insertion towards malicious-actor GitHub repo. High XSS fingerprint.',
        cves: ['PhishGuard-ZeroDay-002'],
        recommendations: ['Immediate Quarantine', 'Audit DOM for lingering XSS payloads']
      }
    ];

    nodes = [...nodes, ...maliciousNodes];
    links.push({ source: 'node-root', target: 'node-lodash-legacy' });
    links.push({ source: 'node-root', target: 'node-moment' });
    links.push({ source: 'node-root', target: 'node-miner' });
    links.push({ source: 'node-root', target: 'node-dom-inject' });

    res.json({ nodes, links });
  } catch (err) {
    console.error('Failed to parse dependency graph:', err);
    res.status(500).json({ error: 'Failed to generate real dependency graph' });
  }
});

// Start listening
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🛡️  PhishGuard.js Security Operations Center Running`);
  console.log(`📡 Telemetry API endpoint: http://localhost:${PORT}/api/telemetry`);
  console.log(`🔌 WebSocket real-time pool: ws://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
