export interface QuerySafetyCheck {
  isDestructive: boolean;
  dangerLevel: 'SAFE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason?: string;
  affectedTarget?: string;
}

export function analyzeSqlSafety(sql: string): QuerySafetyCheck {
  const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const upper = cleanSql.toUpperCase();

  // 1. Critical: DROP, TRUNCATE
  if (/\bDROP\s+(DATABASE|SCHEMA|TABLE|VIEW)\b/i.test(upper)) {
    const match = cleanSql.match(/DROP\s+(?:DATABASE|SCHEMA|TABLE|VIEW)\s+(?:IF\s+EXISTS\s+)?([`\w]+)/i);
    return {
      isDestructive: true,
      dangerLevel: 'CRITICAL',
      reason: 'Pernyataan DROP akan menghapus struktur dan data secara permanen!',
      affectedTarget: match ? match[1] : 'Unspecified',
    };
  }

  if (/\bTRUNCATE\s+(?:TABLE\s+)?([`\w]+)/i.test(upper)) {
    const match = cleanSql.match(/TRUNCATE\s+(?:TABLE\s+)?([`\w]+)/i);
    return {
      isDestructive: true,
      dangerLevel: 'CRITICAL',
      reason: 'Pernyataan TRUNCATE akan mengosongkan seluruh baris dalam tabel secara permanen!',
      affectedTarget: match ? match[1] : 'Unspecified',
    };
  }

  // 2. High: DELETE without WHERE
  if (/\bDELETE\s+FROM\s+([`\w]+)/i.test(upper) && !/\bWHERE\b/i.test(upper)) {
    const match = cleanSql.match(/DELETE\s+FROM\s+([`\w]+)/i);
    return {
      isDestructive: true,
      dangerLevel: 'HIGH',
      reason: 'Pernyataan DELETE tanpa klausa WHERE akan menghapus SEMUA data pada tabel ini!',
      affectedTarget: match ? match[1] : 'All Rows',
    };
  }

  // 3. High: UPDATE without WHERE
  if (/\bUPDATE\s+([`\w]+)\s+SET\b/i.test(upper) && !/\bWHERE\b/i.test(upper)) {
    const match = cleanSql.match(/UPDATE\s+([`\w]+)\s+SET/i);
    return {
      isDestructive: true,
      dangerLevel: 'HIGH',
      reason: 'Pernyataan UPDATE tanpa klausa WHERE akan mengubah SEMUA baris pada tabel ini!',
      affectedTarget: match ? match[1] : 'All Rows',
    };
  }

  // 4. Medium: ALTER TABLE DROP COLUMN
  if (/\bALTER\s+TABLE\s+([`\w]+)\s+DROP\b/i.test(upper)) {
    const match = cleanSql.match(/ALTER\s+TABLE\s+([`\w]+)/i);
    return {
      isDestructive: true,
      dangerLevel: 'HIGH',
      reason: 'Pernyataan ALTER TABLE DROP akan menghapus kolom beserta datanya!',
      affectedTarget: match ? match[1] : 'Table Column',
    };
  }

  return {
    isDestructive: false,
    dangerLevel: 'SAFE',
  };
}

/**
 * Validasi scope isolasi database:
 * Hanya mengizinkan database milik Washeng dan memblokir database lain.
 */
export function isDatabaseAllowed(dbName?: string): boolean {
  if (!dbName) return false;
  const lower = dbName.trim().toLowerCase();

  // Database sistem MySQL selalu diblokir dari scope studio
  const systemDbs = ['information_schema', 'performance_schema', 'mysql', 'sys'];
  if (systemDbs.includes(lower)) return false;

  // Jika terdapat konfigurasi whitelist eksplisit di .env
  const allowedEnv = process.env.ALLOWED_DATABASES;
  if (allowedEnv && allowedEnv.trim()) {
    const patterns = allowedEnv.split(',').map(s => s.trim().toLowerCase());
    return patterns.some(pattern => {
      if (pattern.endsWith('*')) {
        return lower.startsWith(pattern.slice(0, -1));
      }
      return lower === pattern;
    });
  }

  // Kebijakan Baku Ekosistem Washeng:
  // Hanya izinkan database utama (u495297697_appsheet) atau database dengan awalan washeng_ / u495297697_
  const primaryDb = (process.env.DB_DATABASE || 'u495297697_appsheet').toLowerCase();
  return lower === primaryDb || lower.startsWith('washeng_') || lower.startsWith('u495297697_');
}

