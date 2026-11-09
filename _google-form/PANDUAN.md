# Panduan Google Form "Kirim Naskah" + Notifikasi Email

Folder `_google-form` ini **tidak perlu diunggah ke Hostinger**.

## 1. Buat formulir otomatis (±5 menit)
1. Login Gmail yang akan menerima notifikasi, buka https://script.google.com → **Proyek baru**.
2. Hapus isi editor, tempel seluruh isi `Code.gs`, lalu **Simpan** (ikon disket).
3. Pilih fungsi **`setup`** di toolbar → klik **Jalankan**.
4. Izinkan akses (Tinjau izin → pilih akun → *Advanced* → *Go to project* → *Allow*).
   Peringatan "Google hasn't verified this app" normal karena script milik Anda sendiri.
5. Buka **Log eksekusi** — di sana ada 3 tautan: Edit formulir, Tautan publik, Spreadsheet.

## 2. Tambahkan pertanyaan upload file (manual)
Google tidak mengizinkan script membuat pertanyaan upload, jadi:
1. Buka tautan **Edit formulir**.
2. Klik **+** → ubah jenis pertanyaan menjadi **Upload file** → *Lanjutkan*.
3. Judul: `File naskah`, wajib diisi, izinkan jenis **Dokumen** dan **PDF**, ukuran maks. **10 MB**.
4. Geser pertanyaan ini ke bawah "Judul naskah".

File yang diunggah otomatis tersimpan di Google Drive Anda.

## 3. Pasang di website
1. Di Google Form klik **Kirim** → ikon tautan 🔗 → salin URL.
2. Buka `assets/script.js`, isi baris:
   ```js
   const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/XXXX/viewform";
   ```
3. Unggah ulang `assets/script.js` ke Hostinger (`public_html/assets/`).

## 4. Notifikasi email yang berjalan
- **Ke admin** (email akun yang menjalankan script): data pengirim + tautan file di Drive.
- **Ke pengirim**: email konfirmasi bahwa naskah diterima.
- Ingin notifikasi ke email lain? Isi `ADMIN_EMAIL` di `Code.gs`, simpan.

Batas kirim email gratis Gmail: ±100 email/hari (cukup untuk ±50 kiriman/hari).

## Catatan
- Pengirim **wajib login akun Google** untuk bisa upload file (aturan Google Form).
- Uji coba: isi formulir sekali sendiri, pastikan dua email masuk.

---

# Formulir Testimoni Klien

## 1. Buat formulir
1. Buka project Apps Script yang sama → tempel ulang isi `Code.gs` terbaru → **Simpan**.
2. Pilih fungsi **`setupTestimoni`** → **Jalankan** → izinkan akses.
3. Di **Log eksekusi** salin *Tautan publik*.
4. Isi tautan itu di `assets/script.js`:
   ```js
   const TESTIMONI_FORM_URL = "https://docs.google.com/forms/d/e/XXXX/viewform";
   ```
   Tombol "Beri Testimoni" otomatis muncul di footer website.
5. Kirim tautan formulir ke klien yang sudah selesai didampingi.

Setiap testimoni masuk ke spreadsheet "Data Testimoni" dan email admin. Subjek email menyebut apakah klien **BOLEH** atau **TIDAK** mengizinkan ditampilkan.

## 2. Tampilkan di website
Hanya testimoni klien nyata yang mencentang persetujuan. Edit `assets/testimoni.json` di GitHub:
```json
[
  {
    "nama": "R. A.",
    "keterangan": "Dosen PGSD, Universitas X",
    "layanan": "Jurnal Nasional (SINTA)",
    "kutipan": "Tulis persis seperti yang dikirim klien (boleh dipersingkat, jangan diubah maknanya).",
    "tautan": "https://doi.org/..."
  }
]
```
- `nama` mengikuti pilihan klien (nama lengkap / inisial / "Anonim").
- `tautan` opsional; isi hanya jika klien mengizinkan.
- Selama file berisi `[]`, bagian Testimoni di beranda tidak tampil.
