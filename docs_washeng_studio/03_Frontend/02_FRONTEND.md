# 02. Frontend Architecture & phpMyAdmin Style

Frontend **Washeng DB Studio** dirancang untuk memberikan kenyamanan navigasi yang akrab bagi pengguna **phpMyAdmin** dengan kecepatan dan interaktivitas Single Page Application (SPA) berbasis **React 18** dan **Tailwind CSS**.

---

## 🎨 Komponen Antarmuka Utama

```text
src/
├── App.tsx                        # Root layout, database switcher, tab controller
├── services/api.ts                # Client API service terpusat (Axios / Fetch)
└── components/
    ├── auth/LoginPage.tsx         # Layar otentikasi login
    ├── common/BrandLogo.tsx       # Logo resmi Washeng Grand Control
    ├── database/CreateDatabaseModal.tsx # Dialog pembuatan database baru
    ├── crud/                      # Form Create & Edit Row Data
    ├── editor/SqlEditor.tsx       # Monaco SQL query editor dengan shortcut run
    ├── export/ExportImportView.tsx# Halaman utama ekspor dump & impor data
    ├── export/ExportImportModal.tsx# Modal ekspor/impor cepat pada tabel
    ├── grid/DataGrid.tsx          # Virtual grid penampil baris tabel
    ├── layout/Navbar.tsx          # Command bar atas, status live, telemetry
    ├── layout/Sidebar.tsx         # Pohon tabel (Sidebar Tree) bergaya phpMyAdmin
    ├── monitor/LiveProcesslist.tsx# Monitor thread realtime MySQL
    ├── schema/TableStructure.tsx  # Inspektur struktur kolom, indeks, tipe data
    └── tables/TablesOverview.tsx  # Dashboard ikhtisar tabel, ukuran, baris, & engine
```

---

## 🧭 Desain & Navigasi Terpadu

### 1. Hierarki Tampilan
- **Header (Navbar)**:
  - Selector database dinamis dengan indikator koneksi aktif.
  - Telemetry bar: status koneksi, latensi query (ms), serta indikator hak akses admin.
  - Tombol aksi global: Quick Table creation & Database creation.
- **Sidebar**:
  - Menampilkan daftar seluruh tabel dalam database aktif.
  - Fitur pencarian instan (filter tabel).
  - Indikator jumlah baris (records) di samping setiap nama tabel.
- **Area Kerja Utama (Tab-based)**:
  - **Tabel**: Ikhtisar status seluruh tabel (Mirip tampilan *Structure* phpMyAdmin pada level database).
  - **Jelajahi (Browse)**: Grid data interaktif dengan pagination, sorting, dan aksi baris (Edit, Delete, Copy).
  - **Struktur (Structure)**: Rincian kolom, tipe data MySQL, NULL, Default, Collation, dan Indexes.
  - **SQL**: Workspace query Monaco dengan riwayat eksekusi dan tombol *Format Query*.
  - **Ekspor / Impor**: Panel cadangan database lengkap dengan format standar Indonesia.
  - **Proses (Processlist)**: Memantau query yang sedang berjalan di MySQL server.

---

## 💡 Skala Tampilan Standar (Zoom 100% = 75%)

Sesuai preferensi manajemen basis data densitas tinggi:
- Komponen menggunakan sizing compact (`text-xs`, `py-1`, `px-2.5`).
- Font angka tabular (`font-mono`) untuk keselarasan angka dan tanggal.
- Warna status: Hijau (*online/success*), Kuning (*warning/dry-run*), Merah (*destructive/error*).

---

## 🔒 Status Rilis Stabil (Locked Baseline: v1.0.0-stable)

Versi saat ini telah **DINYATAKAN STABIL** dan dikunci sebagai acuan standar:
- **Fitur, tata letak, dan styling antarmuka dipertahankan 100%**.
- Tag Git: `v1.0.0-stable` (Commit `d371f4d`).

### Standar Tata Letak Responsif (Desktop, Tablet, & Mobile):
1. **Desktop / Laptop (`>= 1024px`)**:
   - Sidebar kiri tetap (`w-60 sm:w-64`) dengan fitur *collapsible* (`w-11`).
   - Matriks tabel 9 kolom dengan *sticky header* dan *sticky footer total summary*.
   - Navigasi tab lengkap dan bilah telemetri latensi MySQL realtime.
2. **Tablet (`768px - 1023px`)**:
   - Sidebar mendukung mode ciutkan (*compact icon bar*).
   - Tabel matriks dan data grid dapat digulir horizontal mulus dengan `min-w-[820px]`.
3. **Mobile Phone (`< 768px`)**:
   - **Off-Canvas Sliding Drawer**: Sidebar disembunyikan dari aliran dokumen (`hidden md:flex`) dan digantikan oleh *sliding drawer* geser kiri (`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw]`) dengan *backdrop overlay* gelap (`fixed inset-0 bg-slate-900/50`).
   - Area `<main>` mendapatkan **100% lebar penuh layar**.
   - Tombol **`Tabel [X]`** tersedia di navbar atas untuk membuka drawer dengan 1 ketukan.
   - Pilihan tabel otomatis menutup drawer (*auto-dismiss*).
   - Selector database diberi pembatas lebar (`max-w-[105px] xs:max-w-[130px] truncate`).
   - Paginasi data grid adaptif dan ringkas (`1-50 / Total Baris`).

---

## 🔗 Tautan Navigasi

- Lanjut ke [[03_EXPORT_IMPORT_ID]] untuk detail fitur ekspor impor.
- Lanjut ke [[04_DATABASE_CONTROL]] untuk multi-database control.
- Kembali ke [[00_Index]].
