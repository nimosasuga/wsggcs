import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../db.js';
import { RowDataPacket } from 'mysql2';

export async function processlistRoutes(fastify: FastifyInstance) {
  // Get active processlist
  fastify.get('/api/processlist', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query<RowDataPacket[]>('SHOW FULL PROCESSLIST');
      
      const processes = rows.map((r: any) => ({
        id: r.Id,
        user: r.User,
        host: r.Host,
        db: r.db,
        command: r.Command,
        time: r.Time,
        state: r.State,
        info: r.Info,
      }));

      // Server stats
      const [statusRows] = await pool.query<RowDataPacket[]>("SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected', 'Threads_running', 'Uptime', 'Slow_queries')");
      const statusMap: Record<string, string> = {};
      statusRows.forEach((r: any) => {
        statusMap[r.Variable_name] = r.Value;
      });

      return reply.send({
        ok: true,
        processes,
        stats: {
          threadsConnected: Number(statusMap.Threads_connected || 0),
          threadsRunning: Number(statusMap.Threads_running || 0),
          uptimeSeconds: Number(statusMap.Uptime || 0),
          slowQueries: Number(statusMap.Slow_queries || 0),
        },
      });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });

  // Kill query or connection
  fastify.post('/api/processlist/kill', async (req: FastifyRequest<{ Body: { processId: number; type?: 'QUERY' | 'CONNECTION' } }>, reply: FastifyReply) => {
    const { processId, type = 'QUERY' } = req.body;
    if (!processId) {
      return reply.status(400).send({ ok: false, error: 'Process ID wajib diisi.' });
    }

    try {
      const pool = getPool();
      const command = type === 'CONNECTION' ? `KILL CONNECTION ${processId}` : `KILL QUERY ${processId}`;
      await pool.query(command);
      return reply.send({ ok: true, message: `Berhasil menjalankan ${command}` });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message });
    }
  });
}
