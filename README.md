# Finance Reimbursement Assistant

Asisten AI untuk menjawab pertanyaan seputar reimbursement karyawan: batas biaya, kelengkapan struk, tenggat pengajuan, level approval, dan waktu pembayaran.

Project ini adalah monorepo TypeScript yang terdiri dari agent, HTTP API, dan web chat dengan riwayat percakapan yang tersimpan permanen di PostgreSQL.

> Data kebijakan di dalam repo ini adalah **data fiktif** untuk keperluan prototipe (PT Nusantara Teknologi Mandiri). Jangan dipakai sebagai acuan klaim nyata.

---

## Fitur

- **Chat streaming** — jawaban muncul bertahap (token per token), bukan menunggu selesai.
- **Session memory** — percakapan disimpan di Postgres, jadi bisa dibuka lagi kapan saja dan konteksnya tetap nyambung antar giliran.
- **Sidebar riwayat** — daftar sesi dengan judul otomatis dari pesan pertama, diurutkan dari yang terbaru.
- **Tool calling** — model memanggil tool sendiri saat butuh:
  - `check_reimbursement_limit` — cek nominal terhadap batas kebijakan, status tenggat, dan level approval.
  - `search_web` / `read_webpage` — cari regulasi terkini di web lewat Tavily.
- **Grounded answers** — kebijakan perusahaan dan aturan finance dimasukkan sebagai context document, bukan diandalkan dari pengetahuan model.
- **Observability** — setiap run agent dikirim ke Anvia Lens (trace, eval report).
- **Eval suite** — 8 test case dengan grader LLM dan pengecekan angka.

---

## Arsitektur

```
┌──────────────┐                ┌──────────────┐                ┌───────────────────┐
│   apps/web   │ ─────────────► │   apps/api   │ ─────────────► │  packages/agents  │
│    :5173     │  /api (proxy)  │    :3000     │    runAgent    │   Agent + tools   │
└──────────────┘                └───────┬──────┘                └─────────┬─────────┘
                                        │                                 │
                                        │ memory                          │ model
                                        ▼                                 ▼
                                ┌───────────────┐               ┌───────────────────┐
                                │  packages/db  │               │   model gateway   │
                                │ Prisma 8 + PG │               │   OpenAI-compat   │
                                │     :5434     │               └───────────────────┘
                                └───────────────┘
```

Alur satu pesan:

1. Web mengirim pesan ke `/api/chat?sessionId=...` (di-proxy Vite ke API).
2. API mem-parse request, lalu menjalankan agent dengan memory store.
3. Agent membaca riwayat sesi dari Postgres, memanggil model, dan memakai tool bila perlu.
4. Event stream dikembalikan sebagai JSONL dan dirender bertahap di browser.
5. Setiap turn disimpan kembali ke Postgres, sehingga sesi bisa dilanjutkan nanti.

---

## Struktur Project

```
.
├── apps/
│   ├── api/                 # HTTP server (Hono)
│   │   └── src/index.ts     # /chat, /sessions, /sessions/:id/messages
│   └── web/                 # Frontend (React + TanStack Router + Tailwind)
│       └── src/
│           ├── routes/      # __root (sidebar + loader), index, s.$id
│           ├── components/  # Sidebar
│           └── styles.css   # animasi stream
├── packages/
│   ├── agents/              # Agent, instructions, context, tools, evals
│   │   └── src/
│   │       ├── agent.ts
│   │       ├── context/     # dokumen kebijakan (grounding)
│   │       ├── tools/       # check_reimbursement_limit, search_web, read_webpage
│   │       └── evals/
│   └── db/                  # Prisma 8 contract + client Postgres
│       ├── prisma/          # schema.prisma (sumber), schema.json/.d.ts (hasil emit)
│       └── src/index.ts     # export `db`
├── infra/lens/              # stack observability Anvia Lens (Docker Compose)
├── docker-compose.dev.yaml  # Postgres untuk development
└── pnpm-workspace.yaml
```

---

## Tech Stack

| Lapisan | Teknologi |
| --- | --- |
| Monorepo | pnpm workspaces |
| Agent | [`@anvia/core`](https://www.npmjs.com/package/@anvia/core), `@anvia/openai` |
| Memory | `@anvia/memory-prisma` (entrypoint `/v8`) |
| Database | PostgreSQL 16 + Prisma 8 (contract workflow) |
| API | Hono + `@hono/node-server` |
| Frontend | React 19, Vite 8, TanStack Router, Tailwind CSS v4 |
| Chat UI | `@anvia/react`, `@anvia/react-ui` |
| Web search | Tavily (`@tavily/core`) |
| Observability | Anvia Lens |

---

## Prasyarat

- **Node.js** >= 22
- **pnpm** 12 (`corepack enable`)
- **Docker** + Docker Compose (untuk Postgres)

---

## Setup

### 1. Install dependency

```bash
pnpm install
```

### 2. Siapkan environment variable

```bash
cp .env.example .env
```

Lalu isi nilainya:

| Variabel | Keterangan |
| --- | --- |
| `OPENAI_API_KEY` | API key untuk model. **Wajib.** |
| `OPENAI_BASE_URL` | Base URL gateway yang kompatibel dengan OpenAI. |
| `TAVILY_API_KEY` | API key Tavily untuk `search_web` / `read_webpage`. |
| `DATABASE_URL` | Koneksi Postgres. Default dev: `postgresql://fin:fin@localhost:5434/fin` |
| `ANVIA_LENS_BASE_URL` | URL Anvia Lens. Kosongkan jika tidak memakai Lens. |
| `ANVIA_LENS_PUBLIC_KEY` | Public key Lens. |
| `ANVIA_LENS_SECRET_KEY` | Secret key Lens. |
| `ANVIA_LENS_MEDIA_UPLOAD_ENABLED` | `true` / `false`. |

Script API, eval, dan Prisma memakai `--env-file-if-exists=../../.env`, jadi satu file `.env` di root cukup untuk semua package.

### 3. Jalankan Postgres

```bash
docker compose -f docker-compose.dev.yaml up -d
```

Postgres mendengarkan di **port 5434**, bukan 5432, supaya tidak bentrok dengan instance Postgres lain yang mungkin sudah jalan di mesin kamu. Data disimpan di named volume, jadi tetap ada setelah container di-restart.

### 4. Siapkan database

Contract dan artifact-nya sudah di-commit, jadi cukup buat tabelnya di Postgres:

```bash
pnpm -C packages/db db:init
```

`db:init` bersifat aditif: tabel yang sudah ada dibiarkan, dan ia menandatangani database dengan hash contract yang sekarang.

Kalau `packages/db/prisma/schema.prisma` diubah, emit ulang artifact-nya dulu:

```bash
pnpm -C packages/db db:emit   # schema.prisma -> schema.json + schema.d.ts
```

`db:emit` wajib setelah perubahan PSL, karena runtime membaca `schema.json`, bukan file PSL-nya.

### 5. Jalankan aplikasi

Buka dua terminal:

```bash
pnpm dev:api    # http://localhost:3000
pnpm dev:web    # http://localhost:5173
```

Lalu buka <http://localhost:5173>.

Vite mem-proxy `/api/*` ke `http://localhost:3000` dan membuang prefix `/api`, jadi `/api/sessions` di browser menjadi `/sessions` di API.

### Script yang tersedia

Dijalankan dari root repo:

| Script | Fungsi |
| --- | --- |
| `pnpm dev:api` | API dengan auto-reload. |
| `pnpm dev:web` | Vite dev server. |
| `pnpm typecheck` | `tsc --noEmit` untuk semua package. |
| `pnpm build` | Build production (web). |
| `pnpm generate-routes` | Regenerate `routeTree.gen.ts` setelah menambah route baru. |
| `pnpm evals` | Jalankan eval suite agent. |

`routeTree.gen.ts` digenerate otomatis oleh plugin TanStack Router saat `pnpm dev:web` berjalan. Script `generate-routes` berguna kalau kamu menambah file route tanpa menyalakan dev server.

---

## API

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/` | Health check. |
| `POST` | `/chat?sessionId=<id>` | Stream jawaban agent (JSONL). Body: `{ "type": "messages", "messages": [...] }` |
| `GET` | `/sessions` | Daftar sesi milik user, terbaru dulu. |
| `GET` | `/sessions/:id/messages` | Riwayat pesan satu sesi, untuk memuat ulang halaman. |

Contoh:

```bash
curl -N -X POST "http://localhost:3000/chat?sessionId=demo-1" \
  -H "Content-Type: application/json" \
  -d '{"type":"messages","messages":[{"role":"user","content":"Berapa batas makan per hari?"}]}'
```

> Pakai `-N` dan jangan pipe ke `head`, karena memutus pipe akan membatalkan stream sebelum run selesai dan pesan tidak tersimpan.

---

## Data Model

Tiga tabel, semuanya dibuat oleh `@anvia/memory-prisma`:

- **`AgentMemorySession`** — satu baris per sesi. `scopeKey` unik per kombinasi `sessionId` + `userId`.
- **`AgentMemoryMessage`** — satu baris per pesan, dengan `runId`, `turn`, dan `position` untuk menjaga urutan.
- **`AgentMemoryError`** — run yang gagal, disimpan terpisah agar bisa dianalisis.

---

## Eval

```bash
pnpm evals
```

Menjalankan 8 test case pada agent dan menilai jawabannya dengan tiga metrik:

- `correctness` — grader LLM membandingkan fakta dan angka dengan jawaban yang diharapkan.
- `answer_relevancy` — seberapa relevan jawaban dengan pertanyaan.
- `contains_numbers` — regex pada angka kunci, untuk menangkap jawaban yang "benar topik tapi salah nominal".

Hasilnya juga dikirim ke Anvia Lens sebagai eval report.

---

## Keputusan Desain

**Memory menyimpan per turn, bukan per request.**
Saat memory aktif, agent hanya menerima pesan user terbaru (`agent.stream({ prompt, session })`). Riwayat sebelumnya dibaca dari store. Ini mencegah konteks terkirim dua kali dan membuat pemotongan konteks (compaction) tetap konsisten.

**Session id dibuat di browser.**
`crypto.randomUUID()` dipanggil saat user submit chat baru, sebelum ada request ke server. Baris database baru dibuat ketika pesan pertama disimpan, jadi tidak ada sesi kosong yang menumpuk.

**Kebijakan sebagai context, bukan di prompt.**
Batas biaya dan aturan finance ada di `packages/agents/src/context/` sebagai `Document`, sehingga bisa diperbarui tanpa mengubah instruksi dan tetap bisa dikutip sumbernya.

**Angka tidak dihitung model.**
Setiap nominal spesifik wajib lewat `check_reimbursement_limit`. Model hanya menjelaskan hasil tool, supaya tidak ada limit yang dikarang.

**Loader TanStack Router untuk data awal.**
Daftar sesi dan riwayat pesan dimuat di route `loader`, jadi keduanya sudah tersedia sebelum komponen pertama kali dirender. Konsekuensinya, daftar sesi diperbarui setiap kali terjadi navigasi.

---

## Batasan yang Diketahui

- **Tanpa autentikasi.** Semua sesi memakai satu `userId` (`default-user`). Ganti dengan user id asli begitu auth tersedia.
- **Sidebar baru diperbarui saat navigasi.** Sesi yang baru dibuat muncul setelah berpindah halaman atau me-refresh, karena daftarnya dimuat oleh `loader` di root route.
- **Memory hanya di Postgres.** Belum ada TTL atau pembersihan sesi lama.
- **Prisma 8 masih RC.** Versi di-pin (`prisma@8.0.0-rc.22`, `@prisma/orm-postgres@8.0.0-rc.17`) dan akan perlu dinaikkan saat rilis stabil.
- **Lens butuh secret sendiri.** `infra/lens/.env` berisi nilai contoh; ganti dengan hasil `openssl rand -hex 32` sebelum menjalankan `docker compose down -v`.

---

## Lisensi

ISC — lihat `package.json`.
