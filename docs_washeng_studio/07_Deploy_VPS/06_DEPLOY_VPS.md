# 06. Deployment to VPS & Docker

Washeng DB Studio dikemas dalam container Docker mandiri yang siap di-deploy ke VPS Washeng pada domain/subdomain `gc.cargo.washeng.online`.

---

## 🐳 Konfigurasi Container

### 1. Multi-Stage Dockerfile
- **Stage 1 (Builder)**: Mengompilasi frontend React Vite dan server TypeScript menjadi artefak JavaScript teroptimasi di `dist/` dan `dist-server/`.
- **Stage 2 (Runner)**: Menggunakan base image `node:20-alpine` yang sangat ringan, menyalin hasil build, dan menjalankan backend Fastify + SPA static serving.

### 2. Docker Compose
Tersedia berkas `docker-compose.yml` untuk orkestrasi cepat:
```yaml
version: '3.8'

services:
  washeng-db-studio:
    build: .
    container_name: washeng_gc_db_studio
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DB_HOST=127.0.0.1 # atau nama container mysql VPS
      - DB_PORT=3306
      - DB_DATABASE=u495297697_appsheet
    env_file:
      - .env
```

---

## 🚀 Langkah Deploy ke VPS Washeng

1. **Clone / Pull Kode Terbaru**:
   ```bash
   cd /var/www/washeng-db-studio   # atau direktori aplikasi di VPS
   git pull origin main
   ```
2. **Periksa File Environment**:
   ```bash
   cp .env.example .env
   nano .env
   ```
3. **Build & Jalankan Container**:
   ```bash
   docker compose up -d --build
   ```
4. **Konfigurasi Reverse Proxy (Nginx / Caddy)**:
   Arahkan subdomain `gc.cargo.washeng.online` ke port container `3001` dengan sertifikat SSL Let's Encrypt aktif.

---

## 🔗 Tautan Navigasi

- Kembali ke [[00_Index]] untuk ikhtisar seluruh dokumen.
