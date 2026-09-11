import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../db.js';
import { isDatabaseAllowed } from '../guard.js';
import { RowDataPacket } from 'mysql2';

function formatIsoValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = val.getFullYear();
    const m = pad(val.getMonth() + 1);
    const d = pad(val.getDate());
    const h = pad(val.getHours());
    const min = pad(val.getMinutes());
    const s = pad(val.getSeconds());
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }
  return String(val);
}

function escapeCsvCell(val: any, delimiter: string = ';'): string {
  const formatted = formatIsoValue(val);
  if (formatted.includes('"') || formatted.includes(delimiter) || formatted.includes(',') || formatted.includes('\n') || formatted.includes('\r')) {
    return `"${formatted.replace(/"/g, '""')}"`;
  }
  return formatted;
}

export async function exportRoutes(fastify: FastifyInstance) {
  // Export Table Data (CSV / JSON / SQL)
  fastify.get('/api/export/:table', async (req: FastifyRequest<{ Params: { table: string }; Querystring: { database?: string; format?: 'csv' | 'json' | 'sql'; limit?: number; delimiter?: string } }>, reply: FastifyReply) => {
    const { table } = req.params;
    const format = req.query.format || 'csv';
    const limit = Math.min(Number(req.query.limit) || 50000, 100000);
    const dbName = req.query.database || process.env.DB_DATABASE || 'u495297697_appsheet';

    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }

    // Delimiter: Default to Indonesian CSV standard (semicolon ';'), can be set to comma ','
    const delimiter = req.query.delimiter === ',' ? ',' : ';';

    try {
      const pool = getPool(dbName);
      const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM \`${dbName}\`.\`${table}\` LIMIT ${limit}`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      if (format === 'json') {
        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${table}_${timestamp}.json"`);
        return reply.send(JSON.stringify(rows, null, 2));
      }

      if (format === 'sql') {
        reply.header('Content-Type', 'application/sql');
        reply.header('Content-Disposition', `attachment; filename="${table}_${timestamp}.sql"`);

        let sqlDump = `-- Washeng Grand Control Studio SQL Export\n-- Table: ${table}\n-- Generated: ${new Date().toISOString()}\n\n`;
        if (rows.length > 0) {
          const colNames = Object.keys(rows[0]).map((c) => `\`${c}\``).join(', ');
          rows.forEach((row: any) => {
            const values = Object.values(row).map((v) => {
              if (v === null) return 'NULL';
              if (typeof v === 'number') return v;
              return `'${String(v).replace(/'/g, "\\'")}'`;
            }).join(', ');
            sqlDump += `INSERT INTO \`${table}\` (${colNames}) VALUES (${values});\n`;
          });
        }
        return reply.send(sqlDump);
      }

      // Default CSV (Format Indonesia / MS Excel: Semicolon ';' with UTF-8 BOM)
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      const suffix = delimiter === ';' ? '_id' : '';
      reply.header('Content-Disposition', `attachment; filename="${table}_${timestamp}${suffix}.csv"`);

      if (rows.length === 0) {
        return reply.send('\uFEFF');
      }

      const headers = Object.keys(rows[0]);
      // Prepend UTF-8 BOM (\uFEFF) for Indonesian Microsoft Excel compatibility
      let csv = '\uFEFF' + headers.map((h) => escapeCsvCell(h, delimiter)).join(delimiter) + '\r\n';

      for (const row of rows) {
        csv += headers.map((h) => escapeCsvCell(row[h], delimiter)).join(delimiter) + '\r\n';
      }

      return reply.send(csv);
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });

  // Export Entire Database or Selected Tables (Full SQL Dump or JSON - phpMyAdmin Style)
  fastify.get('/api/export-database', async (req: FastifyRequest<{ Querystring: { database?: string; format?: 'sql' | 'json'; tables?: string; includeStructure?: string; includeData?: string } }>, reply: FastifyReply) => {
    const dbName = req.query.database || process.env.DB_DATABASE || 'u495297697_appsheet';

    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }

    const format = req.query.format || 'sql';
    const includeStructure = req.query.includeStructure !== 'false';
    const includeData = req.query.includeData !== 'false';
    const tablesFilter = req.query.tables ? req.query.tables.split(',').map((t) => t.trim()) : null;

    try {
      const pool = getPool(dbName);

      // Get all tables in database
      const [tableRows] = await pool.query<RowDataPacket[]>(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND TABLE_TYPE = 'BASE TABLE'`,
        [dbName]
      );
      let targetTables = tableRows.map((r: any) => r.TABLE_NAME);
      if (tablesFilter && tablesFilter.length > 0) {
        targetTables = targetTables.filter((t) => tablesFilter.includes(t));
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      if (format === 'json') {
        const dbDump: Record<string, any[]> = {};
        for (const tbl of targetTables) {
          const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM \`${dbName}\`.\`${tbl}\` LIMIT 50000`);
          dbDump[tbl] = rows;
        }
        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${dbName}_dump_${timestamp}.json"`);
        return reply.send(JSON.stringify(dbDump, null, 2));
      }

      // Full SQL Dump
      reply.header('Content-Type', 'application/sql');
      reply.header('Content-Disposition', `attachment; filename="${dbName}_dump_${timestamp}.sql"`);

      let sqlDump = `-- Washeng DB Studio MySQL Dump\n-- Database: \`${dbName}\`\n-- Generated: ${new Date().toISOString()}\n-- Server version: MySQL\n\n`;
      sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n`;
      sqlDump += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
      sqlDump += `START TRANSACTION;\n`;
      sqlDump += `SET time_zone = "+00:00";\n\n`;

      for (const tbl of targetTables) {
        sqlDump += `-- --------------------------------------------------------\n`;
        sqlDump += `-- Struktur dari tabel \`${tbl}\`\n-- --------------------------------------------------------\n\n`;

        if (includeStructure) {
          sqlDump += `DROP TABLE IF EXISTS \`${tbl}\`;\n`;
          try {
            const [createRows]: any = await pool.query(`SHOW CREATE TABLE \`${dbName}\`.\`${tbl}\``);
            if (createRows && createRows[0]) {
              const createSql = createRows[0]['Create Table'];
              sqlDump += `${createSql};\n\n`;
            }
          } catch {
            // fallback if show create fails
          }
        }

        if (includeData) {
          const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM \`${dbName}\`.\`${tbl}\` LIMIT 50000`);
          if (rows.length > 0) {
            sqlDump += `-- Dumping data untuk tabel \`${tbl}\`\n\n`;
            const colNames = Object.keys(rows[0]).map((c) => `\`${c}\``).join(', ');

            for (let i = 0; i < rows.length; i += 100) {
              const chunk = rows.slice(i, i + 100);
              const valuesList = chunk.map((row: any) => {
                const values = Object.values(row).map((v) => {
                  if (v === null) return 'NULL';
                  if (typeof v === 'number') return v;
                  return `'${String(v).replace(/'/g, "\\'")}'`;
                }).join(', ');
                return `(${values})`;
              }).join(',\n');

              sqlDump += `INSERT INTO \`${tbl}\` (${colNames}) VALUES\n${valuesList};\n`;
            }
            sqlDump += `\n`;
          }
        }
      }

      sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;
      sqlDump += `COMMIT;\n`;
      return reply.send(sqlDump);
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });

  // Table Data Preview with limit & offset and search
  fastify.get('/api/tables/:table/data', async (req: FastifyRequest<{ Params: { table: string }; Querystring: { database?: string; page?: number; limit?: number; sortField?: string; sortOrder?: 'ASC' | 'DESC'; search?: string } }>, reply: FastifyReply) => {
    const { table } = req.params;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const offset = (page - 1) * limit;
    const { database, sortField, sortOrder = 'ASC', search } = req.query;
    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';

    try {
      const pool = getPool(dbName);

      // Get columns for search query
      const [colRows] = await pool.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME, COLUMN_KEY FROM information_schema.COLUMNS WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND TABLE_NAME = ?`,
        [dbName, table]
      );
      const allCols = colRows.map((c: any) => c.COLUMN_NAME);
      const primaryKeys = colRows.filter((c: any) => c.COLUMN_KEY === 'PRI').map((c: any) => c.COLUMN_NAME);

      let whereClause = '';
      const params: any[] = [];

      if (search && search.trim() && allCols.length > 0) {
        const searchConditions = allCols.map((c) => `\`${c}\` LIKE ?`).join(' OR ');
        whereClause = ` WHERE ${searchConditions}`;
        allCols.forEach(() => params.push(`%${search.trim()}%`));
      }

      // Count total
      const countSql = `SELECT COUNT(*) as total FROM \`${dbName}\`.\`${table}\`${whereClause}`;
      const [countRows]: any = await pool.query(countSql, params);
      const totalRows = countRows[0]?.total || 0;

      // Select data
      let dataSql = `SELECT * FROM \`${dbName}\`.\`${table}\`${whereClause}`;
      if (sortField && allCols.includes(sortField)) {
        dataSql += ` ORDER BY \`${sortField}\` ${sortOrder === 'DESC' ? 'DESC' : 'ASC'}`;
      }
      dataSql += ` LIMIT ${limit} OFFSET ${offset}`;

      const [rows, fields] = await pool.query<RowDataPacket[]>(dataSql, params);
      const columns = Array.isArray(fields) ? fields.map((f: any) => f.name) : (allCols.length > 0 ? allCols : (rows.length > 0 ? Object.keys(rows[0]) : []));

      return reply.send({
        ok: true,
        page,
        limit,
        totalRows,
        totalPages: Math.ceil(totalRows / limit) || 1,
        columns,
        primaryKeys,
        rows,
      });
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });
}
