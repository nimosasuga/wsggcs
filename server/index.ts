import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { testConnection } from './db.js';
import { authRoutes, extractUser } from './auth.js';
import { schemaRoutes } from './routes/schema.js';
import { queryRoutes } from './routes/query.js';
import { crudRoutes } from './routes/crud.js';
import { processlistRoutes } from './routes/processlist.js';
import { exportRoutes } from './routes/export.js';
import { importRoutes } from './routes/import.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'warn',
  },
  bodyLimit: 50 * 1024 * 1024, // 50MB for CSV import
});

await app.register(cors, {
  origin: true,
  credentials: true,
});

// Authentication hook for protected API routes
app.addHook('onRequest', async (req, reply) => {
  const url = req.raw.url || '';
  // Public endpoints
  if (
    !url.startsWith('/api') ||
    url.startsWith('/api/auth/login') ||
    url.startsWith('/api/health')
  ) {
    return;
  }

  // Token check for protected API endpoints
  const user = extractUser(req);
  if (!user) {
    return reply.status(401).send({
      ok: false,
      unauthorized: true,
      error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.',
    });
  }
});

// Health check and connection ping
app.get('/api/health', async () => {
  const conn = await testConnection();
  return {
    status: 'online',
    system: 'Grand Control (GC) Database Studio',
    subdomain: process.env.APP_DOMAIN || 'gc.cargo.washeng.online',
    database: {
      ok: conn.ok,
      latencyMs: conn.latencyMs,
      target: `${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`,
      database: process.env.DB_DATABASE || 'u495297697_appsheet',
      error: conn.message,
    },
    uptime: process.uptime(),
  };
});

// Register API Route Modules
await app.register(authRoutes);
await app.register(schemaRoutes);
await app.register(queryRoutes);
await app.register(crudRoutes);
await app.register(processlistRoutes);
await app.register(exportRoutes);
await app.register(importRoutes);

// In production, serve the built Vite SPA from /dist
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  await app.register(fastifyStatic, {
    root: distPath,
    prefix: '/',
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile('index.html');
  });
}

const PORT = Number(process.env.PORT) || 3001;
const HOST = '0.0.0.0';

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`\n======================================================`);
  console.log(`🚀 Grand Control (GC) Database Studio`);
  console.log(`🌐 Subdomain: https://${process.env.APP_DOMAIN || 'gc.cargo.washeng.online'}`);
  console.log(`📡 Local Server listening on http://${HOST}:${PORT}`);
  console.log(`🎯 Target Database: ${process.env.DB_DATABASE || 'u495297697_appsheet'} @ ${process.env.DB_HOST || '127.0.0.1'}`);
  console.log(`🔑 Protected by Auth User: ${process.env.AUTH_USER || 'washeng'}`);
  console.log(`======================================================\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
