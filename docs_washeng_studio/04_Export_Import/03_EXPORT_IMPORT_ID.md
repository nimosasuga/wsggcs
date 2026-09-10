# 03. Format CSV Regional Indonesia, UTF-8 BOM, & SQL Backup

Fitur Ekspor dan Impor pada Washeng DB Studio dirancang secara spesifik untuk memecahkan kendala klasik Microsoft Excel pada komputer dengan regional setting **Indonesia / Asia Tenggara**.

---

## 🇮🇩 Mengapa Format CSV Indonesia Berbeda?

Pada standar Windows dan Excel berbahasa Indonesia:
1. **Pemisah Desimal**: Menggunakan tanda **koma** (contoh: `250,50`).
2. **Pemisah Ribuan**: Menggunakan tanda **titik** (contoh: `1.000.000`).
3. **Pemisah Kolom CSV**: Wajib menggunakan **titik koma (`;`)**, bukan koma biasa.

Jika berkas CSV diekspor menggunakan pemisah koma `,`, Microsoft Excel di Indonesia akan menggabungkan seluruh teks ke dalam satu kolom saja (Kolom A) dan memotong angka desimal.

---

## ⚙️ Spesifikasi Fitur Ekspor

- **Pemisah Default Titik Koma (`;`)**:
  - Diterapkan secara baku di endpoint `/api/export/:table?format=csv&delimiter=;`.
  - Pilihan pemisah internasional (koma `,`) tetap tersedia via dropdown antarmuka.
- **Injeksi UTF-8 BOM (`\uFEFF`)**:
  - Berkas CSV diawali dengan Byte Order Mark UTF-8.
  - Memastikan Excel mengenali karakter khusus dan aksen tanpa tampilan berantakan.
  - Berkas dapat dibuka langsung lewat **klik ganda (double-click)** tanpa perlu Import Wizard.
- **Dump Database Lengkap (`.sql`)**:
  - Mengekspor `CREATE TABLE`, `DROP TABLE IF EXISTS`, dan multi-row batch `INSERT INTO` (per 100 baris).
  - Dilengkapi deklarasi `SET FOREIGN_KEY_CHECKS=0` agar aman saat di-restore ke database lain.

---

## 📥 Spesifikasi Fitur Impor

- **Deteksi Pemisah Otomatis (Auto-Detect)**:
  - Sistem memeriksa baris pertama berkas CSV yang diunggah untuk mengenali pemisah `;`, `,`, atau `\t`.
- **Normalisasi Angka Format Indonesia**:
  - Fitur toggle: `Normalisasi Angka Format Indonesia (1.250,50 ➔ 1250.50)`.
  - Mengubah angka format lokal Indonesia ke desimal numerik standar MySQL sebelum dieksekusi ke query database:
    ```javascript
    // Logika normalisasi:
    val.replace(/\./g, '').replace(/,/g, '.')
    ```
- **Pratinjau Data Dinamis**:
  - Menampilkan 5 baris pertama data secara real-time saat pengguna mengganti pemisah atau mengaktifkan normalisasi angka.
- **Mode Penyisipan Fleksibel**:
  - `INSERT INTO`: Standar penambahan baris.
  - `REPLACE INTO`: Menimpa baris jika Primary Key sudah ada.
  - `INSERT IGNORE`: Melewati baris jika terjadi duplikasi kunci.

---

## 🔗 Tautan Navigasi

- Lanjut ke [[04_DATABASE_CONTROL]] untuk pembuatan & kontrol database.
- Lanjut ke [[05_WORKFLOW_RULES]] untuk SOP keamanan.
- Kembali ke [[00_Index]].
