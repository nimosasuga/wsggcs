import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pools = new Map<string, Pool>();

export interface DBConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export function getPoolConfig(custom?: DBConfig): PoolOptions {
  return {
    host: custom?.host || process.env.DB_HOST || '127.0.0.1',
    port: custom?.port || Number(process.env.DB_PORT) || 3306,
    user: custom?.user || process.env.DB_USERNAME || 'root',
    password: custom?.password !== undefined ? custom.password : (process.env.DB_PASSWORD || ''),
    database: custom?.database || process.env.DB_DATABASE || 'u495297697_appsheet',
    waitForConnections: true,
    connectionLimit: 25,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: true, // Crucial: preserves exact ISO date strings without timezone shifts
  };
}

export function getPool(databaseName?: string): Pool {
  const db = databaseName || process.env.DB_DATABASE || 'u495297697_appsheet';
  if (!pools.has(db)) {
    const config = getPoolConfig({ database: db });
    const pool = mysql.createPool(config);
    pools.set(db, pool);
  }
  return pools.get(db)!;
}

export async function testConnection(custom?: DBConfig): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
  const start = Date.now();
  try {
    const p = getPool(custom?.database);
    const conn = await p.getConnection();
    await conn.ping();
    conn.release();
    const latencyMs = Date.now() - start;
    return { ok: true, latencyMs };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, message: err?.message || 'Connection failed' };
  }
}
