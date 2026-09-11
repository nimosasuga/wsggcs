import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../db.js';
import { isDatabaseAllowed } from '../guard.js';

interface ImportPayload {
  table: string;
  columns: string[];
  rows: (string | number | null)[][];
  mode?: 'INSERT' | 'REPLACE' | 'IGNORE';
  database?: string;
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let commentType = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || '';

    // Handle comments
    if (!inString && !inComment) {
      if (char === '-' && nextChar === '-') {
        inComment = true;
        commentType = '--';
        i++;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inComment = true;
        commentType = '/*';
        i++;
        continue;
      }
      if (char === '#') {
        inComment = true;
        commentType = '#';
        continue;
      }
    }

    if (inComment) {
      if (commentType === '--' || commentType === '#') {
        if (char === '\n' || char === '\r') {
          inComment = false;
        }
      } else if (commentType === '/*') {
        if (char === '*' && nextChar === '/') {
          inComment = false;
          i++;
        }
      }
      continue;
    }

    // Handle strings
    if (!inString && (char === "'" || char === '"' || char === '`')) {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    } else if (inString && char === stringChar) {
      let backslashCount = 0;
      let j = i - 1;
      while (j >= 0 && sql[j] === '\\') {
        backslashCount++;
        j--;
      }
      if (backslashCount % 2 === 0) {
        inString = false;
      }
      current += char;
      continue;
    }

    if (!inString && char === ';') {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

export async function importRoutes(fastify: FastifyInstance) {
  // 1. Import Table CSV / JSON Array Rows
  fastify.post('/api/import/:table', async (req: FastifyRequest<{ Params: { table: string }; Body: ImportPayload; Querystring: { database?: string } }>, reply: FastifyReply) => {
    const { table } = req.params;
    const { columns, rows, mode = 'INSERT', database } = req.body || {};
    const dbName = database || req.query?.database || process.env.DB_DATABASE || 'u495297697_appsheet';

    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }

    if (!columns || columns.length === 0 || !rows || rows.length === 0) {
      return reply.status(400).send({ ok: false, error: 'Data baris atau kolom kosong.' });
    }

    const pool = getPool(dbName);
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      let verb = 'INSERT INTO';
      if (mode === 'REPLACE') verb = 'REPLACE INTO';
      if (mode === 'IGNORE') verb = 'INSERT IGNORE INTO';

      const colList = columns.map((c) => `\`${c}\``).join(', ');
      const placeholders = `(${columns.map(() => '?').join(', ')})`;

      // Batch insert in chunks of 250
      const chunkSize = 250;
      let insertedCount = 0;

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const valuesList = chunk.map(() => placeholders).join(', ');
        const flatValues = chunk.flat();

        const sql = `${verb} \`${dbName}\`.\`${table}\` (${colList}) VALUES ${valuesList}`;
        await conn.query(sql, flatValues);
        insertedCount += chunk.length;
      }

      await conn.commit();
      conn.release();

      return reply.send({
        ok: true,
        message: `Berhasil mengimpor ${insertedCount} baris ke tabel ${table}.`,
        insertedCount,
      });
    } catch (err: any) {
      await conn.rollback();
      conn.release();
      return reply.status(400).send({
        ok: false,
        error: `Import gagal dan dibatalkan (Rollback): ${err.message}`,
      });
    }
  });

  // 2. Import SQL File / Query Script (phpMyAdmin Style)
  fastify.post('/api/import-sql', async (req: FastifyRequest<{ Body: { sql: string; database?: string } }>, reply: FastifyReply) => {
    const { sql, database } = req.body || {};
    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';

    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }

    if (!sql || !sql.trim()) {
      return reply.status(400).send({ ok: false, error: 'Konten atau file SQL kosong.' });
    }

    const pool = getPool(dbName);
    const conn = await pool.getConnection();

    try {
      await conn.query(`USE \`${dbName}\``);
      await conn.query(`SET FOREIGN_KEY_CHECKS=0`);

      const statements = splitSqlStatements(sql);
      let executedCount = 0;

      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed.length > 0) {
          await conn.query(trimmed);
          executedCount++;
        }
      }

      await conn.query(`SET FOREIGN_KEY_CHECKS=1`);
      conn.release();

      return reply.send({
        ok: true,
        message: `Berhasil mengeksekusi ${executedCount} query SQL ke database ${dbName}.`,
        executedCount,
      });
    } catch (err: any) {
      conn.release();
      return reply.status(400).send({
        ok: false,
        error: `Gagal mengeksekusi SQL: ${err.message}`,
      });
    }
  });
}
