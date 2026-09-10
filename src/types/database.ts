export interface TableInfo {
  name: string;
  engine: string;
  rows: number;
  dataSize: number;
  indexSize: number;
  totalSize: number;
  autoIncrement: number | null;
  collation: string;
  comment: string;
  updatedAt: string | null;
}

export interface ColumnInfo {
  name: string;
  type: string;
  dataType: string;
  nullable: boolean;
  key: string;
  isPrimary?: boolean;
  isAutoIncrement?: boolean;
  default: string | null;
  extra: string;
  collation: string | null;
  comment: string;
}

export interface IndexInfo {
  name: string;
  isUnique: boolean;
  isPrimary: boolean;
  columns: string[];
  indexType: string;
}

export interface QueryResult {
  ok: boolean;
  isSelect?: boolean;
  rowCount?: number;
  columns?: { name: string; type?: number }[];
  rows?: any[];
  affectedRows?: number;
  insertId?: number;
  changedRows?: number;
  message?: string;
  durationMs?: number;
  error?: string;
  safetyWarning?: boolean;
  safety?: {
    isDestructive: boolean;
    dangerLevel: 'SAFE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reason?: string;
    affectedTarget?: string;
  };
}

export interface ProcessItem {
  id: number;
  user: string;
  host: string;
  db: string | null;
  command: string;
  time: number;
  state: string;
  info: string | null;
}

export interface ServerStats {
  threadsConnected: number;
  threadsRunning: number;
  uptimeSeconds: number;
  slowQueries: number;
}

export interface AuthUser {
  username: string;
  role: string;
}

export interface CreateTableColumn {
  name: string;
  type: string;
  length?: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimary: boolean;
  autoIncrement: boolean;
  comment?: string;
}

export type ActiveTab = 'tables' | 'workspace' | 'data' | 'structure' | 'monitor' | 'export';
