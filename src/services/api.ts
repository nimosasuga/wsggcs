import { TableInfo, ColumnInfo, IndexInfo, QueryResult, ProcessItem, ServerStats, AuthUser, CreateTableColumn } from '../types/database';

const BASE_URL = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('gc_studio_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ ok: boolean; token?: string; user?: AuthUser; error?: string }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.ok && data.token) {
      localStorage.setItem('gc_studio_token', data.token);
      localStorage.setItem('gc_studio_user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('gc_studio_token');
    localStorage.removeItem('gc_studio_user');
  },

  getCurrentUser(): AuthUser | null {
    try {
      const u = localStorage.getItem('gc_studio_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  async verifyAuth(): Promise<{ ok: boolean; user?: AuthUser }> {
    const token = localStorage.getItem('gc_studio_token');
    if (!token) return { ok: false };

    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch {
      return { ok: false };
    }
  },

  // Health
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Databases
  async getDatabases(): Promise<{ ok: boolean; databases: string[] }> {
    const res = await fetch(`${BASE_URL}/databases`, { headers: getAuthHeaders() });
    return res.json();
  },

  async createDatabase(payload: { name: string; charset?: string; collation?: string }): Promise<{ ok: boolean; message?: string; database?: string; error?: string }> {
    const res = await fetch(`${BASE_URL}/databases/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Tables (All 109 tables via SHOW TABLE STATUS)
  async getTables(database?: string): Promise<{ ok: boolean; database: string; tables: TableInfo[] }> {
    const query = database ? `?database=${encodeURIComponent(database)}` : '';
    const res = await fetch(`${BASE_URL}/tables${query}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Table Structure
  async getTableStructure(table: string, database?: string): Promise<{ ok: boolean; database: string; table: string; primaryKeys: string[]; columns: ColumnInfo[]; indexes: IndexInfo[] }> {
    const query = database ? `?database=${encodeURIComponent(database)}` : '';
    const res = await fetch(`${BASE_URL}/tables/${encodeURIComponent(table)}/structure${query}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Table Data
  async getTableData(table: string, page = 1, limit = 50, sortField?: string, sortOrder: 'ASC' | 'DESC' = 'ASC', search?: string, database?: string) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortOrder,
    });
    if (database) params.append('database', database);
    if (sortField) params.append('sortField', sortField);
    if (search) params.append('search', search);

    const res = await fetch(`${BASE_URL}/tables/${encodeURIComponent(table)}/data?${params.toString()}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Execute SQL
  async executeQuery(sql: string, confirmed = false): Promise<QueryResult> {
    const res = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sql, confirmed }),
    });
    return res.json();
  },

  // Explain Query
  async explainQuery(sql: string) {
    const res = await fetch(`${BASE_URL}/query/explain`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sql }),
    });
    return res.json();
  },

  // Processlist
  async getProcesslist(): Promise<{ ok: boolean; processes: ProcessItem[]; stats: ServerStats }> {
    const res = await fetch(`${BASE_URL}/processlist`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Kill Process
  async killProcess(processId: number, type: 'QUERY' | 'CONNECTION' = 'QUERY') {
    const res = await fetch(`${BASE_URL}/processlist/kill`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ processId, type }),
    });
    return res.json();
  },

  // Optimize Table
  async optimizeTable(table: string, database?: string) {
    const query = database ? `?database=${encodeURIComponent(database)}` : '';
    const res = await fetch(`${BASE_URL}/tables/${encodeURIComponent(table)}/optimize${query}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // ==================== CRUD OPERATIONS ====================

  // Insert Row
  async insertRow(table: string, data: Record<string, any>, database?: string) {
    const res = await fetch(`${BASE_URL}/crud/${encodeURIComponent(table)}/row`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ database, data }),
    });
    return res.json();
  },

  // Update Row
  async updateRow(table: string, primaryKey: Record<string, any>, data: Record<string, any>, database?: string) {
    const res = await fetch(`${BASE_URL}/crud/${encodeURIComponent(table)}/row`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ database, primaryKey, data }),
    });
    return res.json();
  },

  // Delete Row
  async deleteRow(table: string, primaryKey: Record<string, any>, database?: string) {
    const res = await fetch(`${BASE_URL}/crud/${encodeURIComponent(table)}/row`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ database, primaryKey }),
    });
    return res.json();
  },

  // Bulk Delete Rows
  async bulkDeleteRows(table: string, primaryKeys: Record<string, any>[], database?: string) {
    const res = await fetch(`${BASE_URL}/crud/${encodeURIComponent(table)}/rows/delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ database, primaryKeys }),
    });
    return res.json();
  },

  // Create Table
  async createTable(payload: { database?: string; tableName: string; engine?: string; collation?: string; columns: CreateTableColumn[] }) {
    const res = await fetch(`${BASE_URL}/crud/tables/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Truncate Table
  async truncateTable(table: string, database?: string) {
    const res = await fetch(`${BASE_URL}/crud/${encodeURIComponent(table)}/truncate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ database, confirmed: true }),
    });
    return res.json();
  },

  // Drop Table
  async dropTable(table: string, database?: string) {
    const res = await fetch(`${BASE_URL}/crud/${encodeURIComponent(table)}/drop`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ database, confirmed: true }),
    });
    return res.json();
  },

  // Import CSV / JSON Rows
  async importData(table: string, columns: string[], rows: (string | number | null)[][], mode: 'INSERT' | 'REPLACE' | 'IGNORE' = 'INSERT', database?: string) {
    const res = await fetch(`${BASE_URL}/import/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ columns, rows, mode, database }),
    });
    return res.json();
  },

  // Import SQL Dump Script
  async importSql(sql: string, database?: string) {
    const res = await fetch(`${BASE_URL}/import-sql`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sql, database }),
    });
    return res.json();
  },

  // Authenticated File Download for Single Table (Support Indonesian CSV format ';')
  async downloadTableExport(table: string, database?: string, format: 'csv' | 'json' | 'sql' = 'csv', limit: number = 50000, delimiter: string = ';') {
    const query = new URLSearchParams({
      format,
      limit: String(limit),
      delimiter,
      ...(database ? { database } : {}),
    });
    const res = await fetch(`${BASE_URL}/export/${encodeURIComponent(table)}?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      let errMsg = 'Gagal mengunduh file ekspor.';
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    const blob = await res.blob();
    const filename = `${table}_${new Date().toISOString().slice(0, 10)}.${format}`;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Authenticated File Download for Entire Database
  async downloadDatabaseExport(database?: string, format: 'sql' | 'json' = 'sql', tables?: string[], includeStructure: boolean = true, includeData: boolean = true) {
    const query = new URLSearchParams({
      format,
      includeStructure: String(includeStructure),
      includeData: String(includeData),
      ...(database ? { database } : {}),
      ...(tables && tables.length > 0 ? { tables: tables.join(',') } : {}),
    });
    const res = await fetch(`${BASE_URL}/export-database?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      let errMsg = 'Gagal mengunduh dump database.';
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    const blob = await res.blob();
    const filename = `${database || 'database'}_dump_${new Date().toISOString().slice(0, 10)}.${format}`;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
