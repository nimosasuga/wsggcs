# 01. Backend Architecture & API Routes

Backend **Washeng DB Studio** dibangun menggunakan **Fastify** dan **TypeScript** untuk menyajikan response API berlatensi sangat rendah (< 30ms) saat mengeksekusi query database.

---

## 📂 Struktur Berkas Backend

```text
server/
├── index.ts               # Entrypoint Fastify, CORS, JWT setup, registrasi rute
├── auth.ts                # Middleware otentikasi Bearer JWT & Fallback Token
├── db.ts                  # Dynamic MySQL Connection Pool Manager
├── guard.ts               # SQL Lexer & Query Safety Guard (Destructive Blocker)
└── routes/
    ├── crud.ts            # RESTful CRUD (Insert, Update, Delete) per baris
    ├── export.ts          # Dump SQL & Ekspor CSV Indonesia (;) / JSON
    ├── import.ts          # Eksekusi dump skrip SQL & Impor CSV ber-normalisasi
    ├── processlist.ts     # Live MySQL Processlist & Kill Process
    ├── query.ts           # Eksekusi custom raw query SQL & Dry Run
    └── schema.ts          # Introspeksi schema, list database, tabel, & kolom
```

---

## 🛡️ Dynamic Connection Pooling (`server/db.ts`)

Backend mendukung pergantian database secara dinamis per request tanpa perlu me-restart server:

```typescript
// Fungsi pool dinamis berdasarkan parameter database:
export function getPool(dbName?: string): mysql.Pool {
  const targetDb = dbName || process.env.DB_DATABASE || 'u495297697_appsheet';
  if (!pools.has(targetDb)) {
    pools.set(targetDb, mysql.createPool({ ...config, database: targetDb }));
  }
  return pools.get(targetDb)!;
}
```

Setiap route (CRUD, Query, Export, Import, Schema) menerima parameter `database` untuk memastikan query dieksekusi tepat pada database yang dipilih di UI.

---

## 🔒 Keamanan & Query Guard (`server/guard.ts`)

Untuk mencegah penghapusan data fatal:
1. **Analisis Statis SQL**: Memeriksa keberadaan kata kunci destruktif seperti `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, dan `DELETE` tanpa klausul `WHERE`.
2. **Mode Aman**: Jika `ALLOW_DESTRUCTIVE_QUERIES=false` di file `.env`, Fastify akan menolak eksekusi query destruktif secara otomatis dan mengembalikan status `403 Forbidden`.
3. **Audit Log**: Setiap query DDL/DML dicatat ke log server untuk kemudahan audit histori.

---

## 📡 Daftar Endpoint API Utama

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login admin dan penerbitan JWT token |
| `GET` | `/api/health` | Telemetri sistem, latency MySQL, & status koneksi |
| `GET` | `/api/databases` | Mengambil seluruh daftar database MySQL aktif |
| `POST` | `/api/databases` | Membuat database baru (Khusus Super-Admin) |
| `GET` | `/api/tables` | Mengambil metadata seluruh tabel (Engine, Rows, Size) |
| `POST` | `/api/query` | Eksekusi SQL editor + opsi Dry Run |
| `GET` | `/api/export/:table` | Ekspor tabel (CSV format ID / SQL / JSON) |
| `GET` | `/api/export-database`| Unduh dump SQL lengkap seluruh database |
| `POST` | `/api/import-sql` | Impor skrip SQL batch |
| `POST` | `/api/import/:table` | Impor berkas CSV ke tabel dengan normalisasi angka |
| `GET` | `/api/processlist` | Monitoring thread aktif MySQL & slow query |

---

## 🔗 Tautan Navigasi

- Lanjut ke [[02_FRONTEND]] untuk arsitektur antarmuka.
- Lanjut ke [[03_EXPORT_IMPORT_ID]] untuk mekanisme ekspor impor.
- Kembali ke [[00_Index]].
