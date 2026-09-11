import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../db.js';
import { extractUser } from '../auth.js';
import { isDatabaseAllowed } from '../guard.js';
import { RowDataPacket } from 'mysql2';

export async function schemaRoutes(fastify: FastifyInstance) {
  // 1. Get all databases (Filtered to Washeng scope only)
  fastify.get('/api/databases', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query<RowDataPacket[]>('SHOW DATABASES');
      const databases = rows
        .map((r: any) => r.Database)
        .filter((db: string) => isDatabaseAllowed(db));
      return reply.send({ ok: true, databases });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });

  // 1b. Create new database (Admin Washeng only)
  fastify.post('/api/databases/create', async (req: FastifyRequest<{ Body: { name?: string; charset?: string; collation?: string } }>, reply: FastifyReply) => {
    const user = extractUser(req);
    if (!user || user.role !== 'super-admin') {
      return reply.status(403).send({
        ok: false,
        error: 'Akses ditolak. Hanya admin Washeng yang diizinkan untuk membuat database baru.',
      });
    }

    const { name, charset = 'utf8mb4', collation = 'utf8mb4_unicode_ci' } = req.body || {};

    if (!name || typeof name !== 'string') {
      return reply.status(400).send({ ok: false, error: 'Nama database wajib diisi.' });
    }

    const dbName = name.trim();

    // Validate database name format (MySQL rules & safety)
    if (dbName.length < 1 || dbName.length > 64) {
      return reply.status(400).send({ ok: false, error: 'Nama database harus antara 1 dan 64 karakter.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
      return reply.status(400).send({ ok: false, error: 'Nama database hanya boleh memuat huruf, angka, dan garis bawah (_).' });
    }

    const systemDbs = ['information_schema', 'performance_schema', 'mysql', 'sys'];
    if (systemDbs.includes(dbName.toLowerCase())) {
      return reply.status(400).send({ ok: false, error: `Nama "${dbName}" adalah nama sistem yang dilindungi.` });
    }

    // Allowed charsets and collations
    const allowedCharsets = ['utf8mb4', 'utf8', 'latin1', 'ascii'];
    const selectedCharset = allowedCharsets.includes(charset) ? charset : 'utf8mb4';
    const validCollation = /^[a-zA-Z0-9_]+$/.test(collation) ? collation : 'utf8mb4_unicode_ci';

    try {
      const pool = getPool();

      // Check if database already exists
      const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE LOWER(SCHEMA_NAME) = LOWER(?)',
        [dbName]
      );

      if (existing.length > 0) {
        return reply.status(400).send({ ok: false, error: `Database "${dbName}" sudah ada di server.` });
      }

      // Execute create database DDL
      const sql = `CREATE DATABASE \`${dbName}\` CHARACTER SET ${selectedCharset} COLLATE ${validCollation}`;
      await pool.query(sql);

      return reply.send({
        ok: true,
        message: `Database \`${dbName}\` berhasil dibuat.`,
        database: dbName,
      });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.message || 'Gagal membuat database baru.' });
    }
  });

  // 2. Get ALL tables in database with status (All 109 tables via SHOW TABLE STATUS)
  fastify.get('/api/tables', async (req: FastifyRequest<{ Querystring: { database?: string } }>, reply: FastifyReply) => {
    try {
      const dbName = req.query.database || process.env.DB_DATABASE || 'u495297697_appsheet';
      if (!isDatabaseAllowed(dbName)) {
        return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
      }
      const pool = getPool(dbName);

      let tables: any[] = [];

      try {
        // Native phpMyAdmin method: SHOW TABLE STATUS gives all tables reliably
        const [statusRows] = await pool.query<RowDataPacket[]>(`SHOW TABLE STATUS FROM \`${dbName}\``);
        tables = statusRows.map((r: any) => ({
          name: r.Name || r.tableName,
          engine: r.Engine || 'InnoDB',
          rows: Number(r.Rows ?? 0),
          dataSize: Number(r.Data_length ?? 0),
          indexSize: Number(r.Index_length ?? 0),
          totalSize: (Number(r.Data_length ?? 0)) + (Number(r.Index_length ?? 0)),
          autoIncrement: r.Auto_increment,
          collation: r.Collation || 'utf8mb4_unicode_ci',
          comment: r.Comment || '',
          updatedAt: r.Update_time || r.Create_time,
        }));
      } catch (e) {
        // Fallback to information_schema if SHOW TABLE STATUS fails
        const sql = `
          SELECT 
            TABLE_NAME as tableName,
            ENGINE as engine,
            TABLE_ROWS as tableRows,
            DATA_LENGTH as dataLength,
            INDEX_LENGTH as indexLength,
            AUTO_INCREMENT as autoIncrement,
            TABLE_COLLATION as collation,
            TABLE_COMMENT as comment,
            CREATE_TIME as createTime,
            UPDATE_TIME as updateTime
          FROM information_schema.TABLES
          WHERE LOWER(TABLE_SCHEMA) = LOWER(?)
          ORDER BY TABLE_NAME ASC
        `;
        const [rows] = await pool.query<RowDataPacket[]>(sql, [dbName]);
        tables = rows.map((r: any) => ({
          name: r.tableName,
          engine: r.engine || 'InnoDB',
          rows: Number(r.tableRows) || 0,
          dataSize: Number(r.dataLength) || 0,
          indexSize: Number(r.indexLength) || 0,
          totalSize: (Number(r.dataLength) || 0) + (Number(r.indexLength) || 0),
          autoIncrement: r.autoIncrement,
          collation: r.collation,
          comment: r.comment || '',
          updatedAt: r.updateTime,
        }));
      }

      return reply.send({ ok: true, database: dbName, tables });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });

  // 3. Get table structure (columns, types, nullability, keys, and primary key)
  fastify.get('/api/tables/:table/structure', async (req: FastifyRequest<{ Params: { table: string }; Querystring: { database?: string } }>, reply: FastifyReply) => {
    try {
      const { table } = req.params;
      const dbName = req.query.database || process.env.DB_DATABASE || 'u495297697_appsheet';
      if (!isDatabaseAllowed(dbName)) {
        return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
      }
      const pool = getPool(dbName);

      // Fetch column details
      const colSql = `
        SELECT 
          COLUMN_NAME as name,
          COLUMN_TYPE as type,
          DATA_TYPE as dataType,
          IS_NULLABLE as isNullable,
          COLUMN_KEY as columnKey,
          COLUMN_DEFAULT as defaultValue,
          EXTRA as extra,
          COLLATION_NAME as collation,
          COLUMN_COMMENT as comment
        FROM information_schema.COLUMNS
        WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION ASC
      `;
      const [colRows] = await pool.query<RowDataPacket[]>(colSql, [dbName, table]);

      // Fetch indexes
      const idxSql = `SHOW INDEX FROM \`${dbName}\`.\`${table}\``;
      const [idxRows] = await pool.query<RowDataPacket[]>(idxSql);

      const indexesMap: Record<string, any> = {};
      const primaryKeys: string[] = [];

      idxRows.forEach((r: any) => {
        const keyName = r.Key_name;
        if (keyName === 'PRIMARY') {
          primaryKeys.push(r.Column_name);
        }
        if (!indexesMap[keyName]) {
          indexesMap[keyName] = {
            name: keyName,
            isUnique: r.Non_unique === 0,
            isPrimary: keyName === 'PRIMARY',
            columns: [],
            indexType: r.Index_type,
          };
        }
        indexesMap[keyName].columns.push(r.Column_name);
      });

      return reply.send({
        ok: true,
        database: dbName,
        table,
        primaryKeys,
        columns: colRows.map((c: any) => ({
          name: c.name,
          type: c.type,
          dataType: c.dataType,
          nullable: c.isNullable === 'YES',
          key: c.columnKey,
          isPrimary: c.columnKey === 'PRI',
          isAutoIncrement: (c.extra || '').toLowerCase().includes('auto_increment'),
          default: c.defaultValue,
          extra: c.extra,
          collation: c.collation,
          comment: c.comment,
        })),
        indexes: Object.values(indexesMap),
      });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });

  // 4. Optimize table
  fastify.post('/api/tables/:table/optimize', async (req: FastifyRequest<{ Params: { table: string }; Querystring: { database?: string } }>, reply: FastifyReply) => {
    try {
      const { table } = req.params;
      const dbName = req.query.database || process.env.DB_DATABASE || 'u495297697_appsheet';
      const pool = getPool(dbName);
      const [rows] = await pool.query(`OPTIMIZE TABLE \`${dbName}\`.\`${table}\``);
      return reply.send({ ok: true, result: rows });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });
}
