# Memory Struktur Obsidian Washeng DB Studio

## Lokasi Vault

```text
C:\laragon\www\washeng-db-studio\docs_washeng_studio
```
atau root workspace:
```text
C:\laragon\www\washeng-db-studio
```

Folder `docs_washeng_studio` digunakan sebagai vault dokumentasi project Washeng DB Studio (Grand Control) untuk Obsidian, AI handoff, referensi arsitektur, dan panduan operasional.

## Struktur Lengkap

```text
docs_washeng_studio/
├── 00_Index.md                           # Peta navigasi utama (Wikilinks)
├── README_HANDOFF.md                     # SOP Handoff developer & AI agent
├── 01_Overview/
│   └── 00_OVERVIEW.md                    # Deskripsi sistem & tech stack
├── 02_Backend/
│   └── 01_BACKEND.md                     # Fastify API, pool MySQL, query guard
├── 03_Frontend/
│   └── 02_FRONTEND.md                    # React 18, Vite, phpMyAdmin UI standard
├── 04_Export_Import/
│   └── 03_EXPORT_IMPORT_ID.md            # CSV regional Indonesia (;), BOM, SQL
├── 05_Database_Control/
│   └── 04_DATABASE_CONTROL.md            # Multi-DB switcher & schema inspector
├── 06_Workflow_Golden_Rules/
│   └── 05_WORKFLOW_RULES.md              # Aturan proteksi data & SOP
└── 07_Deploy_VPS/
    └── 06_DEPLOY_VPS.md                  # Docker & VPS production deployment
```

## Aturan Penggunaan Obsidian

- Buka folder `c:\laragon\www\washeng-db-studio` sebagai vault Obsidian.
- Mulai dari `00_Index.md`.
- Gunakan `README_HANDOFF.md` untuk konteks kerja AI.
- Gunakan `06_Workflow_Golden_Rules/05_WORKFLOW_RULES.md` sebelum eksekusi.
- Gunakan Graph View (`Ctrl + G`) untuk melihat keterkaitan antar dokumen.
- Format Wikilink menggunakan `[[NamaFile]]` atau `[[NamaFile#Bagian|Label]]`.
- Dilarang menaruh secret, password, atau credential production di vault.
- Folder `.obsidian/` di-ignore oleh Git via `.gitignore`.
