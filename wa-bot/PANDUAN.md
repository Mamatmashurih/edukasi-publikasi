# Panduan Chatbot WhatsApp (Gemini)

Alamat webhook: `https://edukasipublikasi.web.id/wa-bot/webhook.php`

## File di server
| File | Lokasi | Isi |
|---|---|---|
| `webhook.php`, `knowledge.md` | `public_html/wa-bot/` (otomatis dari GitHub) | Program bot dan pengetahuan bot |
| `wa-bot-config.php` | `domains/edukasipublikasi.web.id/` (**di luar** public_html) | Kunci rahasia — dibuat manual, tidak pernah masuk GitHub |
| `wa-bot-data/` | `domains/edukasipublikasi.web.id/` | Riwayat chat & `error.log` — dibuat otomatis |

## 1. Gemini API key
1. Buka https://aistudio.google.com/apikey → **Create API key**.
2. Salin kuncinya ke `gemini_api_key` di `wa-bot-config.php`.
3. Untuk pemakaian sungguhan aktifkan billing (paid tier) agar isi chat klien tidak dipakai Google untuk melatih model.

## 2. WhatsApp Cloud API (Meta)
1. https://developers.facebook.com/apps → **Create app** → pilih use case **Connect with customers through WhatsApp**.
2. Hubungkan / buat **Business portfolio** (Meta Business).
3. Menu **WhatsApp → API Setup**:
   - Salin **Phone number ID** → `phone_number_id`.
   - Tambahkan nomor bisnis Anda (**Add phone number**) dan verifikasi via SMS/telepon.
4. Token permanen: **Business Settings → Users → System users** → Add (Admin) → **Generate token** untuk aplikasi ini dengan izin `whatsapp_business_messaging` dan `whatsapp_business_management` → salin ke `wa_token`.
5. **App settings → Basic → App secret** → Show → salin ke `app_secret`.

## 3. Buat file config di Hostinger
1. hPanel → Websites → edukasipublikasi.web.id → **File Manager**.
2. Naik satu folder dari `public_html` (ke folder `edukasipublikasi.web.id`).
3. **New file** → `wa-bot-config.php` → tempel isi `config.sample.php` → isi semua nilai → Save.

## 4. Hubungkan webhook
1. Meta → aplikasi Anda → **WhatsApp → Configuration → Webhook → Edit**.
2. Callback URL: `https://edukasipublikasi.web.id/wa-bot/webhook.php`
3. Verify token: sama persis dengan `verify_token` di config → **Verify and save**.
4. Di **Webhook fields**, klik **Subscribe** pada `messages` dan (jika nomor memakai coexistence) `smb_message_echoes` — agar bot diam otomatis selama `pause_hours` saat Anda membalas manual dari aplikasi WhatsApp Business.

## 5. Uji coba
Kirim chat ke nomor bisnis dari HP lain, misalnya "Halo, berapa harga skrining artikel?". Bot harus membalas dalam beberapa detik.
Jika tidak ada balasan, cek `wa-bot-data/error.log` di File Manager.

## Mengubah jawaban bot
Edit `wa-bot/knowledge.md` (layanan, harga, aturan) lalu commit ke GitHub — otomatis ter-deploy.
