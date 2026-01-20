#!/usr/bin/env node
/**
 * Stream Render Logs from Better Stack
 * 
 * This script polls Better Stack's SQL API to fetch logs from Render
 * and saves them to a local file for easy access.
 * 
 * Usage:
 *   node scripts/stream-render-logs.js
 *   
 * Environment variables required (in .env.local):
 *   - BETTERSTACK_SQL_HOST
 *   - BETTERSTACK_SQL_USERNAME
 *   - BETTERSTACK_SQL_PASSWORD
 *   - BETTERSTACK_SOURCE_ID
 *   - BETTERSTACK_TEAM_ID
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually (no dotenv dependency)
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  } catch (e) {
    // Ignore if file doesn't exist
  }
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));

// Configuration
const CONFIG = {
  host: process.env.BETTERSTACK_SQL_HOST || 'eu-nbg-2-connect.betterstackdata.com',
  username: process.env.BETTERSTACK_SQL_USERNAME,
  password: process.env.BETTERSTACK_SQL_PASSWORD,
  sourceId: process.env.BETTERSTACK_SOURCE_ID || '1683098',
  teamId: process.env.BETTERSTACK_TEAM_ID || 't496590',
  pollIntervalMs: 10000, // Poll every 10 seconds
  logFile: path.join(__dirname, '..', 'logs', 'render.log'),
  batchSize: 100,
};

// Track last seen timestamp to avoid duplicates
let lastSeenTimestamp = null;

/**
 * Fetch logs from Better Stack SQL API
 */
async function fetchLogs() {
  // Table names for hot (remote) and cold (S3) storage
  const hotTable = `${CONFIG.teamId}_render_logs_logs`;
  const coldTable = `${CONFIG.teamId}_render_logs_s3`;
  
  // Build query - fetch logs from both hot and cold storage using UNION ALL
  let query;
  if (lastSeenTimestamp) {
    query = `SELECT dt, raw FROM ( SELECT dt, raw FROM remote(${hotTable}) WHERE dt > '${lastSeenTimestamp}' UNION ALL SELECT dt, raw FROM s3Cluster(primary, ${coldTable}) WHERE _row_type = 1 AND dt > '${lastSeenTimestamp}' ) ORDER BY dt ASC LIMIT ${CONFIG.batchSize} FORMAT JSONEachRow`;
  } else {
    query = `SELECT dt, raw FROM ( SELECT dt, raw FROM remote(${hotTable}) UNION ALL SELECT dt, raw FROM s3Cluster(primary, ${coldTable}) WHERE _row_type = 1 ) ORDER BY dt DESC LIMIT ${CONFIG.batchSize} FORMAT JSONEachRow`;
  }

  const url = `https://${CONFIG.host}?output_format_pretty_row_numbers=0`;
  const auth = Buffer.from(`${CONFIG.username}:${CONFIG.password}`).toString('base64');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Basic ${auth}`,
      },
      body: query,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const text = await response.text();
    if (!text.trim()) {
      return [];
    }

    // Parse JSONEachRow format (newline-delimited JSON)
    const logs = text.trim().split('\n').map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.error('Failed to parse log line:', line);
        return null;
      }
    }).filter(Boolean);

    return logs;
  } catch (error) {
    console.error('Error fetching logs:', error.message);
    return [];
  }
}

/**
 * Append logs to local file
 */
function appendToFile(logs) {
  if (logs.length === 0) return;

  // Ensure logs directory exists
  const logDir = path.dirname(CONFIG.logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Format and append logs
  const lines = logs.map(log => {
    const timestamp = log.dt || new Date().toISOString();
    const raw = typeof log.raw === 'string' ? log.raw : JSON.stringify(log.raw);
    return `[${timestamp}] ${raw}`;
  }).join('\n') + '\n';

  fs.appendFileSync(CONFIG.logFile, lines);
  
  // Update last seen timestamp
  const lastLog = logs[logs.length - 1];
  if (lastLog && lastLog.dt) {
    lastSeenTimestamp = lastLog.dt;
  }
}

/**
 * Main polling loop
 */
async function pollLogs() {
  console.log('📡 Fetching logs from Better Stack...');
  
  const logs = await fetchLogs();
  
  if (logs.length > 0) {
    appendToFile(logs);
    console.log(`✅ Received ${logs.length} new log entries`);
    
    // Print last few logs to console
    logs.slice(-5).forEach(log => {
      const raw = typeof log.raw === 'string' ? log.raw : JSON.stringify(log.raw);
      const preview = raw.length > 100 ? raw.substring(0, 100) + '...' : raw;
      console.log(`   ${log.dt}: ${preview}`);
    });
  } else {
    console.log('   No new logs');
  }
}

/**
 * Start the log streaming
 */
async function main() {
  console.log('🚀 Starting Render Log Streamer');
  console.log(`   Source: ${CONFIG.teamId}_render_logs`);
  console.log(`   Log file: ${CONFIG.logFile}`);
  console.log(`   Poll interval: ${CONFIG.pollIntervalMs / 1000}s`);
  console.log('');
  console.log('Press Ctrl+C to stop\n');

  // Validate configuration
  if (!CONFIG.username || !CONFIG.password) {
    console.error('❌ Missing BETTERSTACK_SQL_USERNAME or BETTERSTACK_SQL_PASSWORD in .env.local');
    process.exit(1);
  }

  // Initial fetch
  await pollLogs();

  // Set up polling interval
  const intervalId = setInterval(pollLogs, CONFIG.pollIntervalMs);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping log streamer...');
    clearInterval(intervalId);
    console.log(`📁 Logs saved to: ${CONFIG.logFile}`);
    process.exit(0);
  });
}

main();
