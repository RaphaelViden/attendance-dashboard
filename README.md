# TAPPRESENSI RFID Fullstack Next.js

Gabungan konsep dari:

1. `tappresensi_-rfid-attendance-portal.zip`: UI login, topbar, admin dashboard style, ESP32 simulator, employee manager, backup/log concept.
2. `attendance-dashboard-shift-4tap-export-v3.zip`: model presensi 4 tap, shift kerja kantor, divisi kantor, export spreadsheet berdasarkan rentang tanggal.

Aplikasi ini siap dijalankan sebagai Next.js fullstack app di Vercel atau Render Web Service.

## Fitur utama

- Login admin.
- Dashboard admin.
- CRUD karyawan dan RFID card.
- Divisi: Casier, Kitchen, Produksi, Part-time.
- Shift kerja:
  - Pagi: 08.00-16.00
  - Siang: 14.00-22.00
  - Middle: 12.00-20.00
  - Middle Closing: 12.00-22.00
  - Pagi Middle: 08.00-20.00
  - Fullday: 08.00-22.00
- Presensi 4 tap:
  1. Masuk
  2. Mulai Istirahat
  3. Selesai Istirahat
  4. Pulang
- Perhitungan jam kerja:
  - Masuk sampai Mulai Istirahat
  - ditambah Selesai Istirahat sampai Pulang
- Endpoint RFID untuk ESP32/Raspberry Pi:
  - `POST /api/device/tap`
  - alias: `POST /api/rfid/tap`
- Export XLSX berdasarkan tanggal mulai dan tanggal akhir.
- Backup JSON.
- Mode demo-memory tanpa Supabase.
- Mode production dengan Supabase opsional.

## Jalankan lokal

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

Login demo:

```text
Username: admin
Password: admin123
```

## Environment variables

Buat `.env.local` dari `.env.example`.

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
AUTH_SECRET=change-this-to-a-long-random-secret
DEVICE_SECRET=DEV-SECRET-CHANGE-ME
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Jika `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` kosong, aplikasi berjalan dalam demo-memory mode. Data demo-memory tidak cocok untuk production karena data dapat hilang ketika server restart atau serverless function cold start.

## Setup Supabase

1. Buat project Supabase.
2. Buka SQL Editor.
3. Jalankan file `supabase/schema.sql`.
4. Ambil `Project URL` dan `service_role key`.
5. Isi environment variable:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

Jangan taruh service role key di frontend. Key ini hanya dipakai server-side API routes.

## Payload ESP32/Raspberry Pi

Endpoint:

```text
POST /api/device/tap
```

Header:

```text
x-device-secret: DEV-SECRET-CHANGE-ME
Content-Type: application/json
```

Body:

```json
{
  "rfid_uid": "B3:3D:1F:D3",
  "device_id": "attendance-esp32-001",
  "device_name": "Main Entrance Reader",
  "power_mode": "AC",
  "battery": 92
}
```

Urutan tap akan ditentukan otomatis berdasarkan jumlah tap karyawan pada tanggal tersebut.

## Deploy ke Vercel

1. Push project ke GitHub.
2. Import repo ke Vercel.
3. Framework: Next.js.
4. Isi environment variables.
5. Deploy.

## Deploy ke Render.com

Gunakan Web Service, bukan Static Site, karena aplikasi memakai API routes dan server-side logic.

Pengaturan manual:

```text
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start
```

Project juga menyertakan `render.yaml` untuk Blueprint.

## Endpoint API

- `POST /api/auth/login`
- `GET /api/bootstrap`
- `GET /api/employees`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`
- `POST /api/attendance/manual`
- `POST /api/device/tap`
- `POST /api/rfid/tap`
- `POST /api/simulator/tap`
- `GET /api/export?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `GET /api/system/logs`
- `GET /api/system/backups`
- `POST /api/system/backup/trigger`
- `GET /api/system/backup/download`
