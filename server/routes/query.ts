import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../db.js';
import { analyzeSqlSafety } from '../guard.js';

interface QueryBody {
  sql: string;
  confirmed?: boolean;
  limit?: number;
  offset?: number;
}

export async function queryRoutes(fastify: FastifyInstance) {
  // Execute SQL statement
  fastify.post('/api/query', async (req: FastifyRequest<{ Body: QueryBody }>, reply: FastifyReply) => {
    const { sql, confirmed } = req.body;

    if (!sql || !sql.trim()) {
      return reply.status(400).send({ ok: false, error: 'SQL query tidak boleh kosong.' });
    }

    // Safety guard check
    const safety = analyzeSqlSafety(sql);
    if (safety.isDestructive && !confirmed) {
      return reply.status(400).send({
        ok: false,
        safetyWarning: true,
        safety,
        error: safety.reason || 'Query terdeteksi berisiko tinggi. Konfirmasi diperlukan.',
      });
    }

    const pool = getPool();
    const startTime = process.hrtime.bigint();

    try {
      // Execute query
      const [results, fields] = await pool.query(sql);
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      // If SELECT or SHOW (returns array of rows)
      if (Array.isArray(results)) {
        const columns = Array.isArray(fields)
          ? fields.map((f: any) => ({
              name: f.name,
              type: f.type,
              orgName: f.orgName,
              table: f.table,
            }))
          : results.length > 0
          ? Object.keys(results[0]).map((k) => ({ name: k }))
          : [];

        return reply.send({
          ok: true,
          isSelect: true,
          rowCount: results.length,
          columns,
          rows: results,
          durationMs: Math.round(durationMs * 100) / 100,
        });
      }

      // If INSERT, UPDATE, DELETE, ALTER, CREATE (returns ResultSetHeader / OkPacket)
      const header: any = results;
      return reply.send({
        ok: true,
        isSelect: false,
        affectedRows: header?.affectedRows || 0,
        insertId: header?.insertId || 0,
        changedRows: header?.changedRows || 0,
        warningStatus: header?.warningStatus || 0,
        message: header?.message || 'Query berhasil dieksekusi.',
        durationMs: Math.round(durationMs * 100) / 100,
      });
    } catch (err: any) {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      return reply.status(400).send({
        ok: false,
        error: err.message || 'Gagal mengeksekusi SQL.',
        code: err.code,
        sqlState: err.sqlState,
        durationMs: Math.round(durationMs * 100) / 100,
      });
    }
  });

  // Explain Query Analyzer
  fastify.post('/api/query/explain', async (req: FastifyRequest<{ Body: { sql: string } }>, reply: FastifyReply) => {
    const { sql } = req.body;
    if (!sql) return reply.status(400).send({ ok: false, error: 'SQL query kosong.' });

    const pool = getPool();
    try {
      const [rows] = await pool.query(`EXPLAIN ${sql}`);
      return reply.send({ ok: true, explain: rows });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message });
    }
  });
}
