# README HANDOFF — Washeng DB Studio

Dokumen ini adalah pedoman wajib bagi AI Agent maupun Developer berikutnya yang melanjutkan pengerjaan proyek **Washeng DB Studio** (Grand Control).

---

## 🎯 Identitas Proyek

- **Nama Aplikasi**: Washeng DB Studio // Grand Control (GC) Database Studio
- **Tujuan**: Console manajemen database mandiri bergaya phpMyAdmin modern berkecepatan tinggi untuk mengontrol MySQL lokal dan VPS Washeng.
- **Path Lokal**: `c:\laragon\www\washeng-db-studio`
- **Subdomain Produksi**: `gc.cargo.washeng.online`
- **Repositori GitHub**: [https://github.com/nimosasuga/wsggcs.git](https://github.com/nimosasuga/wsggcs.git) (Branch: `main`)

---

## 📜 Aturan Utama & SOP Pengerjaan

1. **Bahasa Komunikasi**: Selalu gunakan Bahasa Indonesia yang profesional, ramah, dan solutif.
2. **Kewajiban Membuat Plan**:
   - Selalu buat dokumen rencana kerja (*Implementation Plan*) sebelum melakukan modifikasi struktural, penambahan modul besar, atau tindakan berisiko.
   - **Tunggu persetujuan (ACC)** eksplisit dari pengguna sebelum mengeksekusi perubahan.
3. **Proteksi Database**:
   - **DILARANG KERAS** menjalankan `DROP DATABASE`, `DROP TABLE`, atau `TRUNCATE` pada database produksi tanpa konfirmasi eksplisit dari pengguna.
   - Gunakan fitur `Dry Run` atau `ALLOW_DESTRUCTIVE_QUERIES=false` pada backend untuk mencegah eksekusi query berbahaya tanpa sengaja.
4. **Kerahasiaan Kredensial**:
   - Berkas `.env` tidak boleh di-commit atau dibagikan ke Git publik. Pastikan `.gitignore` selalu aktif mengabaikan file lingkungan dan folder `.obsidian/`.

---

## 🚀 Alur Navigasi Pembacaan Dokumen

Untuk memahami sistem secara utuh, baca dokumen dengan urutan berikut:

1. [[00_OVERVIEW]] — Arsitektur dan stack teknologi.
2. [[01_BACKEND]] — Backend Fastify, koneksi MySQL dinamis, dan query guard.
3. [[02_FRONTEND]] — Komponen UI React, Virtual DataGrid, dan Monaco Editor.
4. [[03_EXPORT_IMPORT_ID]] — Fitur ekspor/impor CSV regional Indonesia & SQL dump.
5. [[04_DATABASE_CONTROL]] — Multi-database switcher & manajemen tabel.
6. [[05_WORKFLOW_RULES]] — Standard operating procedure dan keamanan data.
7. [[06_DEPLOY_VPS]] — Instruksi deployment Docker container di VPS.
