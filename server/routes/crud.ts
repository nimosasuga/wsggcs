import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../db.js';
import { isDatabaseAllowed } from '../guard.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface RowPayload {
  database?: string;
  data: Record<string, any>;
  primaryKey?: Record<string, any>;
}

interface CreateTablePayload {
  database?: string;
  tableName: string;
  engine?: string;
  collation?: string;
  columns: {
    name: string;
    type: string;
    length?: string;
    nullable: boolean;
    defaultValue?: string;
    isPrimary: boolean;
    autoIncrement: boolean;
    comment?: string;
  }[];
}

export async function crudRoutes(fastify: FastifyInstance) {
  // 1. INSERT ROW
  fastify.post('/api/crud/:table/row', async (req: FastifyRequest<{ Params: { table: string }; Body: RowPayload }>, reply: FastifyReply) => {
    const { table } = req.params;
    const { database, data } = req.body || {};

    if (!data || Object.keys(data).length === 0) {
      return reply.status(400).send({ ok: false, error: 'Data baris tidak boleh kosong.' });
    }

    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';
    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }
    const pool = getPool(dbName);

    try {
      const keys = Object.keys(data);
      const cols = keys.map((k) => `\`${k}\``).join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map((k) => {
        const v = data[k];
        return v === undefined || v === '' ? null : v;
      });

      const sql = `INSERT INTO \`${dbName}\`.\`${table}\` (${cols}) VALUES (${placeholders})`;
      const [res] = await pool.query<ResultSetHeader>(sql, values);

      return reply.send({
        ok: true,
        message: 'Baris data baru berhasil ditambahkan.',
        insertId: res.insertId,
        affectedRows: res.affectedRows,
      });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message || 'Gagal menambahkan baris data.' });
    }
  });

  // 2. UPDATE ROW
  fastify.put('/api/crud/:table/row', async (req: FastifyRequest<{ Params: { table: string }; Body: RowPayload }>, reply: FastifyReply) => {
    const { table } = req.params;
    const { database, data, primaryKey } = req.body || {};

    if (!data || Object.keys(data).length === 0) {
      return reply.status(400).send({ ok: false, error: 'Data baris tidak boleh kosong.' });
    }
    if (!primaryKey || Object.keys(primaryKey).length === 0) {
      return reply.status(400).send({ ok: false, error: 'Primary key diperlukan untuk memperbarui baris.' });
    }

    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';
    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }
    const pool = getPool(dbName);

    try {
      // SET clause
      const setKeys = Object.keys(data);
      const setClause = setKeys.map((k) => `\`${k}\` = ?`).join(', ');
      const setValues = setKeys.map((k) => {
        const v = data[k];
        return v === undefined || v === '' ? null : v;
      });

      // WHERE clause (Primary Key)
      const pkKeys = Object.keys(primaryKey);
      const whereClause = pkKeys.map((k) => `\`${k}\` = ?`).join(' AND ');
      const pkValues = pkKeys.map((k) => primaryKey[k]);

      const sql = `UPDATE \`${dbName}\`.\`${table}\` SET ${setClause} WHERE ${whereClause} LIMIT 1`;
      const [res] = await pool.query<ResultSetHeader>(sql, [...setValues, ...pkValues]);

      return reply.send({
        ok: true,
        message: 'Baris data berhasil diperbarui.',
        affectedRows: res.affectedRows,
      });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message || 'Gagal memperbarui baris.' });
    }
  });

  // 3. DELETE ROW
  fastify.delete('/api/crud/:table/row', async (req: FastifyRequest<{ Params: { table: string }; Body: { database?: string; primaryKey: Record<string, any> } }>, reply: FastifyReply) => {
    const { table } = req.params;
    const { database, primaryKey } = req.body || {};

    if (!primaryKey || Object.keys(primaryKey).length === 0) {
      return reply.status(400).send({ ok: false, error: 'Primary key diperlukan untuk menghapus baris.' });
    }

    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';
    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }
    const pool = getPool(dbName);

    try {
      const pkKeys = Object.keys(primaryKey);
      const whereClause = pkKeys.map((k) => `\`${k}\` = ?`).join(' AND ');
      const pkValues = pkKeys.map((k) => primaryKey[k]);

      const sql = `DELETE FROM \`${dbName}\`.\`${table}\` WHERE ${whereClause} LIMIT 1`;
      const [res] = await pool.query<ResultSetHeader>(sql, pkValues);

      return reply.send({
        ok: true,
        message: 'Baris data berhasil dihapus.',
        affectedRows: res.affectedRows,
      });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message || 'Gagal menghapus baris.' });
    }
  });

  // 4. BULK DELETE ROWS
  fastify.post('/api/crud/:table/rows/delete', async (req: FastifyRequest<{ Params: { table: string }; Body: { database?: string; primaryKeys: Record<string, any>[] } }>, reply: FastifyReply) => {
    const { table } = req.params;
    const { database, primaryKeys } = req.body || {};

    if (!primaryKeys || primaryKeys.length === 0) {
      return reply.status(400).send({ ok: false, error: 'Daftar baris untuk dihapus kosong.' });
    }

    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';
    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }
    const pool = getPool(dbName);
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();
      let totalDeleted = 0;

      for (const pk of primaryKeys) {
        const pkKeys = Object.keys(pk);
        const whereClause = pkKeys.map((k) => `\`${k}\` = ?`).join(' AND ');
        const pkValues = pkKeys.map((k) => pk[k]);
        const sql = `DELETE FROM \`${dbName}\`.\`${table}\` WHERE ${whereClause} LIMIT 1`;
        const [res]: any = await conn.query(sql, pkValues);
        totalDeleted += res.affectedRows || 0;
      }

      await conn.commit();
      conn.release();

      return reply.send({
        ok: true,
        message: `Berhasil menghapus ${totalDeleted} baris data.`,
        totalDeleted,
      });
    } catch (err: any) {
      await conn.rollback();
      conn.release();
      return reply.status(400).send({ ok: false, error: err.message || 'Gagal melakukan bulk delete.' });
    }
  });

  // 5. CREATE NEW TABLE
  fastify.post('/api/crud/tables/create', async (req: FastifyRequest<{ Body: CreateTablePayload }>, reply: FastifyReply) => {
    const { database, tableName, engine = 'InnoDB', collation = 'utf8mb4_unicode_ci', columns } = req.body || {};

    if (!tableName || !columns || columns.length === 0) {
      return reply.status(400).send({ ok: false, error: 'Nama tabel dan minimal 1 kolom wajib diisi.' });
    }

    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';
    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }
    const pool = getPool(dbName);

    try {
      const colDefs: string[] = [];
      const primaryKeys: string[] = [];

      columns.forEach((col) => {
        let def = `\`${col.name}\` ${col.type}`;
        if (col.length) {
          def += `(${col.length})`;
        }
        if (!col.nullable) {
          def += ' NOT NULL';
        } else {
          def += ' NULL';
        }
        if (col.autoIncrement) {
          def += ' AUTO_INCREMENT';
        }
        if (col.defaultValue !== undefined && col.defaultValue !== '') {
          def += ` DEFAULT '${col.defaultValue}'`;
        }
        if (col.comment) {
          def += ` COMMENT '${col.comment.replace(/'/g, "\\'")}'`;
        }
        colDefs.push(def);

        if (col.isPrimary) {
          primaryKeys.push(`\`${col.name}\``);
        }
      });

      if (primaryKeys.length > 0) {
        colDefs.push(`PRIMARY KEY (${primaryKeys.join(', ')})`);
      }

      const sql = `CREATE TABLE \`${dbName}\`.\`${tableName}\` (\n  ${colDefs.join(',\n  ')}\n) ENGINE=${engine} DEFAULT CHARSET=utf8mb4 COLLATE=${collation}`;
      await pool.query(sql);

      return reply.send({
        ok: true,
        message: `Tabel \`${tableName}\` berhasil dibuat.`,
      });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message || 'Gagal membuat tabel.' });
    }
  });

  // 6. TRUNCATE TABLE
  fastify.post('/api/crud/:table/truncate', async (req: FastifyRequest<{ Params: { table: string }; Body: { database?: string; confirmed: boolean } }>, reply: FastifyReply) => {
    const { table } = req.params;
    const { database, confirmed } = req.body || {};

    if (!confirmed) {
      return reply.status(400).send({ ok: false, error: 'Konfirmasi diperlukan untuk mengosongkan tabel.' });
    }

    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';
    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }
    const pool = getPool(dbName);

    try {
      await pool.query(`TRUNCATE TABLE \`${dbName}\`.\`${table}\``);
      return reply.send({ ok: true, message: `Tabel \`${table}\` berhasil dikosongkan.` });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message });
    }
  });

  // 7. DROP TABLE
  fastify.delete('/api/crud/:table/drop', async (req: FastifyRequest<{ Params: { table: string }; Body: { database?: string; confirmed: boolean } }>, reply: FastifyReply) => {
    const { table } = req.params;
    const { database, confirmed } = req.body || {};

    if (!confirmed) {
      return reply.status(400).send({ ok: false, error: 'Konfirmasi diperlukan untuk menghapus tabel.' });
    }

    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';
    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }
    const pool = getPool(dbName);

    try {
      await pool.query(`DROP TABLE \`${dbName}\`.\`${table}\``);
      return reply.send({ ok: true, message: `Tabel \`${table}\` berhasil dihapus.` });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message });
    }
  });

  // 8. RENAME TABLE
  fastify.post('/api/crud/tables/:table/rename', async (req: FastifyRequest<{ Params: { table: string }; Body: { database?: string; newTableName: string } }>, reply: FastifyReply) => {
    const { table } = req.params;
    const { database, newTableName } = req.body || {};

    if (!newTableName || typeof newTableName !== 'string') {
      return reply.status(400).send({ ok: false, error: 'Nama tabel baru wajib diisi.' });
    }

    const targetName = newTableName.trim();
    if (!/^[a-zA-Z0-9_]+$/.test(targetName)) {
      return reply.status(400).send({ ok: false, error: 'Nama tabel baru hanya boleh memuat huruf, angka, dan garis bawah (_).' });
    }

    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';
    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }
    const pool = getPool(dbName);

    try {
      await pool.query(`RENAME TABLE \`${dbName}\`.\`${table}\` TO \`${dbName}\`.\`${targetName}\``);
      return reply.send({
        ok: true,
        message: `Tabel \`${table}\` berhasil diubah namanya menjadi \`${targetName}\`.`,
        newTableName: targetName,
      });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message || 'Gagal mengubah nama tabel.' });
    }
  });

  // 9. ADD COLUMN TO TABLE
  fastify.post('/api/crud/tables/:table/columns/add', async (req: FastifyRequest<{ Params: { table: string }; Body: { database?: string; column: any; position?: 'FIRST' | 'AFTER' | 'END'; afterColumn?: string } }>, reply: FastifyReply) => {
    const { table } = req.params;
    const { database, column, position = 'END', afterColumn } = req.body || {};

    if (!column || !column.name || !column.type) {
      return reply.status(400).send({ ok: false, error: 'Nama dan tipe kolom wajib diisi.' });
    }

    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';
    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }
    const pool = getPool(dbName);

    try {
      let colDef = `\`${column.name}\` ${column.type}`;
      if (column.length) {
        colDef += `(${column.length})`;
      }
      if (!column.nullable) {
        colDef += ' NOT NULL';
      } else {
        colDef += ' NULL';
      }
      if (column.autoIncrement) {
        colDef += ' AUTO_INCREMENT';
      }
      if (column.defaultValue !== undefined && column.defaultValue !== null && column.defaultValue !== '') {
        const dVal = String(column.defaultValue).trim();
        if (dVal.toUpperCase() === 'CURRENT_TIMESTAMP' || dVal.toUpperCase() === 'NULL') {
          colDef += ` DEFAULT ${dVal.toUpperCase()}`;
        } else {
          colDef += ` DEFAULT '${dVal.replace(/'/g, "\\'")}'`;
        }
      } else if (column.nullable && column.defaultValue === null) {
        colDef += ' DEFAULT NULL';
      }
      if (column.comment) {
        colDef += ` COMMENT '${String(column.comment).replace(/'/g, "\\'")}'`;
      }

      let positionClause = '';
      if (position === 'FIRST') {
        positionClause = ' FIRST';
      } else if (position === 'AFTER' && afterColumn) {
        positionClause = ` AFTER \`${afterColumn}\``;
      }

      const sql = `ALTER TABLE \`${dbName}\`.\`${table}\` ADD COLUMN ${colDef}${positionClause}`;
      await pool.query(sql);

      return reply.send({
        ok: true,
        message: `Kolom \`${column.name}\` berhasil ditambahkan ke tabel \`${table}\`.`,
      });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message || 'Gagal menambahkan kolom baru.' });
    }
  });

  // 10. MODIFY/CHANGE COLUMN IN TABLE
  fastify.put('/api/crud/tables/:table/columns/:column/modify', async (req: FastifyRequest<{ Params: { table: string; column: string }; Body: { database?: string; newColumn: any } }>, reply: FastifyReply) => {
    const { table, column } = req.params;
    const { database, newColumn } = req.body || {};

    if (!newColumn || !newColumn.name || !newColumn.type) {
      return reply.status(400).send({ ok: false, error: 'Definisi kolom baru (nama & tipe) wajib diisi.' });
    }

    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';
    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }
    const pool = getPool(dbName);

    try {
      let colDef = `\`${newColumn.name}\` ${newColumn.type}`;
      if (newColumn.length) {
        colDef += `(${newColumn.length})`;
      }
      if (!newColumn.nullable) {
        colDef += ' NOT NULL';
      } else {
        colDef += ' NULL';
      }
      if (newColumn.autoIncrement) {
        colDef += ' AUTO_INCREMENT';
      }
      if (newColumn.defaultValue !== undefined && newColumn.defaultValue !== null && newColumn.defaultValue !== '') {
        const dVal = String(newColumn.defaultValue).trim();
        if (dVal.toUpperCase() === 'CURRENT_TIMESTAMP' || dVal.toUpperCase() === 'NULL') {
          colDef += ` DEFAULT ${dVal.toUpperCase()}`;
        } else {
          colDef += ` DEFAULT '${dVal.replace(/'/g, "\\'")}'`;
        }
      } else if (newColumn.nullable && newColumn.defaultValue === null) {
        colDef += ' DEFAULT NULL';
      }
      if (newColumn.comment) {
        colDef += ` COMMENT '${String(newColumn.comment).replace(/'/g, "\\'")}'`;
      }

      // MySQL CHANGE COLUMN allows renaming as well as modifying types
      const sql = `ALTER TABLE \`${dbName}\`.\`${table}\` CHANGE COLUMN \`${column}\` ${colDef}`;
      await pool.query(sql);

      return reply.send({
        ok: true,
        message: `Kolom \`${column}\` berhasil diperbarui.`,
      });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message || 'Gagal mengubah kolom.' });
    }
  });

  // 11. DROP COLUMN FROM TABLE
  fastify.delete('/api/crud/tables/:table/columns/:column/drop', async (req: FastifyRequest<{ Params: { table: string; column: string }; Body: { database?: string; confirmed: boolean } }>, reply: FastifyReply) => {
    const { table, column } = req.params;
    const { database, confirmed } = req.body || {};

    if (!confirmed) {
      return reply.status(400).send({ ok: false, error: 'Konfirmasi diperlukan untuk menghapus kolom.' });
    }

    const dbName = database || process.env.DB_DATABASE || 'u495297697_appsheet';
    if (!isDatabaseAllowed(dbName)) {
      return reply.status(403).send({ ok: false, error: `Akses ditolak: Database "${dbName}" di luar jangkauan ekosistem Washeng.` });
    }
    const pool = getPool(dbName);

    try {
      const sql = `ALTER TABLE \`${dbName}\`.\`${table}\` DROP COLUMN \`${column}\``;
      await pool.query(sql);

      return reply.send({
        ok: true,
        message: `Kolom \`${column}\` berhasil dihapus dari tabel \`${table}\`.`,
      });
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message || 'Gagal menghapus kolom.' });
    }
  });
}
