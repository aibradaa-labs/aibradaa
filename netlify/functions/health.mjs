/**
 * Health Check Endpoint
 * Returns system status, database connectivity, and service health metrics
 */

import { successResponse, errorResponse, handleOptions } from './utils/response.mjs';
import { promises as fs } from 'fs';
import path from 'path';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const startTime = Date.now();
    const dbHealth = await checkDatabase();
    const cacheHealth = await checkCache();
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const responseTime = Date.now() - startTime;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime / 60) + 'm ' + Math.floor(uptime % 60) + 's',
      responseTime: responseTime + 'ms',
      services: { database: dbHealth, cache: cacheHealth, ai: { status: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured', provider: 'gemini' } },
      memory: { heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB', heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB' },
      environment: process.env.NODE_ENV || 'production',
      nodeVersion: process.version
    };

    return successResponse(health, 200);
  } catch (error) {
    console.error('Health check failed:', error);
    return errorResponse('Health check failed', 503, { error: error.message });
  }
}

async function checkDatabase() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'laptops.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const json = JSON.parse(data);
    return { status: 'healthy', totalLaptops: json.catalog?.totalLaptops || 0, lastChecked: new Date().toISOString() };
  } catch (error) {
    return { status: 'error', error: error.message, lastChecked: new Date().toISOString() };
  }
}

async function checkCache() {
  try {
    const cachePath = path.join(process.cwd(), '.cache');
    await fs.access(cachePath);
    return { status: 'healthy', location: '.cache', lastChecked: new Date().toISOString() };
  } catch (error) {
    return { status: 'warning', message: 'Cache directory not found', lastChecked: new Date().toISOString() };
  }
}
