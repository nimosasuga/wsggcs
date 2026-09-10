# 04. Multi-Database Management & Schema Control

Washeng DB Studio dirancang sebagai console database terpusat yang mampu mengelola banyak database MySQL sekaligus dalam satu antarmuka yang mulus.

---

## 🏢 Fitur Multi-Database

### 1. Database Selector
- Terletak di sudut kiri atas bilah navigasi utama (`Navbar.tsx`).
- Menampilkan seluruh database yang dapat diakses oleh user.
- Memperbarui konteks global aplikasi (`selectedDatabase`) seketika:
  - Sidebar memuat ulang daftar tabel milik database tersebut.
  - Tab Tabel dan Data Grid langsung menyinkronkan data.
  - Query Editor mengarahkan koneksi ke database terpilih.

### 2. Pembuatan Database Baru (`+ New Database`)
- Disediakan modal intuitif di [CreateDatabaseModal.tsx](file:///c:/laragon/www/washeng-db-studio/src/components/database/CreateDatabaseModal.tsx).
- **Parameter yang Didukung**:
  - Nama Database: validasi format identifier MySQL (`[a-zA-Z0-9_]`).
  - Charset: `utf8mb4` (standar modern), `utf8`, `latin1`.
  - Collation: `utf8mb4_unicode_ci`, `utf8mb4_general_ci`, `utf8mb4_bin`.
- Begitu database baru berhasil dibuat, sistem langsung mengalihkan konteks aktif ke database tersebut.

---

## 🗃️ Manajemen Tabel & Skema

### 1. Pembuatan Tabel Baru (`+ New Table`)
- Modal pembuatan tabel di [CreateTableModal.tsx](file:///c:/laragon/www/washeng-db-studio/src/components/crud/CreateTableModal.tsx).
- Penambahan kolom interaktif:
  - Nama Kolom
  - Tipe Data: `VARCHAR`, `INT`, `BIGINT`, `TEXT`, `DATETIME`, `DECIMAL`, `BOOLEAN`, dll.
  - Panjang / Nilai
  - Default Value (`NULL`, `CURRENT_TIMESTAMP`, nilai kustom)
  - Kolasi / Atribut (`UNSIGNED`, `BINARY`)
  - Primary Key & Auto Increment (`AI`)

### 2. Inspeksi Struktur Tabel (`TableStructure.tsx`)
- Menampilkan daftar kolom lengkap dengan badge kunci utama (Primary Key `PRI`), Foreign Key (`MUL`), dan Unique Index (`UNI`).
- Tabel indeks terpisah yang memperlihatkan kardinalitas, tipe indeks (BTREE), dan nama indeks.

---

## 🔗 Tautan Navigasi

- Lanjut ke [[05_WORKFLOW_RULES]] untuk pedoman keselamatan data.
- Lanjut ke [[06_DEPLOY_VPS]] untuk deployment container.
- Kembali ke [[00_Index]].
