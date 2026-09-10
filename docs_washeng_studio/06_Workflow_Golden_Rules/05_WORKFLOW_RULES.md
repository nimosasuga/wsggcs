# 05. Workflow & Golden Rules — Washeng DB Studio

Dokumen ini berisi standar operasional prosedur (SOP) dan aturan keselamatan mutlak yang wajib dipatuhi oleh setiap pengembang dan asisten AI.

---

## 🛑 Larangan Keras (Non-Negotiable)

1. **DILARANG MERESET DATABASE**:
   - Dilarang mengeksekusi `DROP DATABASE`, `DROP TABLE`, atau `TRUNCATE` pada skema database produksi (`u495297697_appsheet` atau database live lainnya).
2. **DILARANG MENGHAPUS DATA TANPA KLAUSUL WHERE**:
   - Perintah `DELETE FROM table_name` tanpa klausul filter `WHERE` dilarang keras. Sistem akan memblokir query semacam ini via `guard.ts`.
3. **DILARANG MEM-PUSH SECRET KE GIT**:
   - File `.env` yang berisi password MySQL, session secret, atau kredensial VPS tidak boleh di-commit ke Git.
   - Konfigurasi lokal Obsidian (`.obsidian/`) harus selalu masuk dalam `.gitignore`.
4. **DILARANG MENGUBAH FORMAT CSV KE KOMA UNTUK EXCEL LOKAL**:
   - Selalu pertahankan format titik koma (`;`) dan header UTF-8 BOM untuk kebutuhan operasional di Indonesia.

---

## 📋 Prosedur Kerja Baku (Standard Operating Procedure)

1. **Wajib Membuat Rencana (Plan) Sebelum Tindakan Besar**:
   - Sebelum melakukan migrasi database, perubahan schema global, atau refaktorisasi arsitektur, buat dokumen rencana kerja dan mintalah persetujuan pengguna.
2. **Gunakan Fitur Dry Run**:
   - Manfaatkan mode Dry Run pada Query Editor untuk memeriksa dampak query (estimasi baris yang terpengaruh dan sintaksis) sebelum dieksekusi secara permanen.
3. **Cadangkan Data Sebelum Aksi Kritis**:
   - Sebelum melakukan modifikasi skema tabel yang sudah berpenghuni ribuan baris, gunakan fitur **Ekspor Tabel (SQL Dump)** sebagai cadangan darurat.

---

## 🔗 Tautan Navigasi

- Lanjut ke [[06_DEPLOY_VPS]] untuk instruksi deploy ke server VPS.
- Kembali ke [[00_Index]].
