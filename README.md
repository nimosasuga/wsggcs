# 🛡️ Grand Control (GC) Database Studio — Pro Max Clean Responsive

**Grand Control (GC) Database Studio** adalah sistem kontrol database MySQL modern, ultra-ringan, dan responsif penuh (desktop, tablet, mobile) yang dirancang khusus untuk mengelola database produksi Washeng (`u495297697_appsheet`) serta integrasi AppSheet dan VPS tanpa membebani performa server.

Target Subdomain VPS: **`https://gc.cargo.washeng.online`**

---

## ✨ Fitur Unggulan

### 1. ⚡ Monaco SQL Workspace Pro (VS Code Engine)
- **Autocomplete Cerdas**: Otomatis mendeteksi nama tabel, nama kolom, dan kata kunci MySQL saat mengetik.
- **Safety Dry-Run Guard**: Peringatan otomatis untuk query destruktif (`DROP`, `TRUNCATE`, `ALTER DROP`, `DELETE/UPDATE` tanpa `WHERE`) dengan modal konfirmasi pengetikan kata sandi/konfirmasi.
- **Format SQL Instan**: Format query SQL otomatis dengan tombol Format (atau keyboard shortcut).
- **Multi-Tab & Eksekusi Cepat**: Mendukung multi-tab query dan shortcut `Ctrl+Enter` / `Cmd+Enter`.
- **Statistik Eksekusi**: Menampilkan durasi eksekusi dalam milidetik (`ms`), baris terdampak (`affected rows`), dan jumlah baris data.

### 2. 📱 Responsive Data Grid (Desktop & Mobile Card View)
- **Desktop Grid**: Virtual scrolling, inline cell inspector, filter cepat, sorting multi-arah, dan pagination.
- **Mobile Card View**: Khusus untuk smartphone (360px – 412px), baris data otomatis diubah menjadi **Interactive Cards** yang ramah sentuhan, bebas dari teks terpotong atau overflow horizontal yang merusak layout.
- **Cell Inspector**: Modal khusus untuk melihat dan menyalin isi data JSON atau teks panjang dengan format rapi.

### 3. 🔍 Structure & Schema Inspector
- Menampilkan definisi field/kolom: tipe data, nullability, keys (`PRIMARY`, `UNIQUE`, `INDEX`), default value, dan komentar.
- Visualisasi indeks tabel dan relasi kolom.
- Tombol satu klik **"Optimize Table"** (`OPTIMIZE TABLE`) untuk membersihkan fragmentasi tabel InnoDB.
- Banner panduan kepatuhan **Google AppSheet** (menjaga integritas kolom tanggal ISO dan virtual column).

### 4. 🚀 Live Ops & Processlist Monitor
- Pembaca proses live (`SHOW FULL PROCESSLIST`) dengan auto-refresh setiap 3 detik.
- Menampilkan metrik real-time: Threads Connected, Threads Running, Server Uptime, dan Slow Queries.
- Tombol instan **"Kill Query"** untuk menghentikan query macet seketika tanpa perlu login ke terminal SSH VPS.

### 5. 📦 Streaming Export & Import Standar Washeng
- **Export ISO 8601**: CSV otomatis diformat dengan standar tanggal Washeng (`YYYY-MM-DD` dan `YYYY-MM-DD HH:mm:ss`) agar tidak merusak format saat di-upload ulang ke AppSheet/Washeng GO.
- Pilihan export ke format **JSON** dan **SQL Dump (INSERT statements)**.
- **Transactional Import**: Import file CSV dengan preview kolom dan rollback otomatis jika terjadi kegagalan integritas data.

---

## 🛠️ Instalasi & Menjalankan di Lokal (Laragon Windows)

### 1. Masuk ke Folder Proyek:
```powershell
cd c:\laragon\www\washeng-db-studio
```

### 2. Install Dependensi:
```powershell
npm install
```

### 3. Konfigurasi `.env`:
Pastikan file `.env` telah sesuai dengan konfigurasi database lokal atau remote Anda:
```env
PORT=3001
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=u495297697_appsheet
DB_USERNAME=root
DB_PASSWORD=
```

### 4. Jalankan Development Mode:
```powershell
npm run dev
```
Aplikasi akan terbuka di `http://localhost:3000` (Frontend Vite) dan terhubung otomatis ke backend API di `http://localhost:3001`.

---

## 🚀 Deploy ke VPS Washeng (`gc.cargo.washeng.online`)

Aplikasi ini telah dilengkapi dengan `Dockerfile` multi-stage dan `docker-compose.yml` yang dirancang untuk bergabung ke jaringan Docker `washeng` di VPS (`31.97.221.172`).

### 1. Setup di VPS:
Salin proyek ini ke VPS, misalnya di `/home/washeng/apps/washeng-db-studio`:
```bash
cd /home/washeng/apps/washeng-db-studio
```

### 2. Build & Jalankan Container:
```bash
docker compose up -d --build
```
Container `washeng-gc-studio` akan langsung terhubung ke container `db:3306` melalui internal network Docker tanpa perlu membuka port MySQL ke internet publik.

### 3. Konfigurasi Caddy di VPS:
Tambahkan blok berikut pada konfigurasi Caddyfile VPS (`/home/washeng/apps/washeng-app/docker/caddy/Caddyfile` atau Caddy utama):

```caddy
gc.cargo.washeng.online {
    encode zstd gzip

    # Reverse proxy ke container washeng-gc-studio
    reverse_proxy washeng-gc-studio:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
    }
}
```

Lalu reload Caddy:
```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## 🔒 Arsitektur Keamanan
1. **Zero-Expose Database**: Port `3306` MySQL tetap terlindungi di dalam Docker bridge network `washeng`.
2. **Safety Guard**: Mencegah query drop/truncate yang tidak disengaja.
3. **Resource Bound**: Dibatasi maksimal 256MB RAM di Docker sehingga tidak mengganggu aplikasi Washeng GO maupun proyek `drrkobe` di VPS.
