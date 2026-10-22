/**
 * Edukasi Publikasi — Formulir Kirim Naskah + Notifikasi Email
 *
 * Cara pakai: lihat PANDUAN.md di folder yang sama.
 * 1. Jalankan setup() sekali  -> membuat Google Form, Spreadsheet, dan pemicu (trigger).
 * 2. Tambahkan pertanyaan "Upload file" secara manual di Google Form (tidak bisa lewat script).
 * 3. Setiap ada kiriman, onFormSubmit() mengirim email ke admin dan ke pengirim.
 */

const BRAND = "Edukasi Publikasi";
const WA_NUMBER = "628131023310";
// Kosongkan untuk memakai email akun Google yang menjalankan script ini.
const ADMIN_EMAIL = "";

function setup() {
  const form = FormApp.create("Kirim Naskah untuk Review Awal — " + BRAND);
  form.setDescription(
    "Unggah naskah Anda untuk skrining awal artikel. Hasil review dikirim ke email Anda dalam 2–3 hari kerja. " +
    "Naskah dijaga kerahasiaannya dan hanya diakses oleh tim kami."
  );
  form.setCollectEmail(true);
  form.setConfirmationMessage(
    "Terima kasih! Naskah Anda sudah kami terima. Email konfirmasi telah dikirim ke alamat Anda."
  );

  form.addTextItem().setTitle("Nama lengkap").setRequired(true);
  form.addTextItem().setTitle("Nomor WhatsApp").setRequired(true);
  form.addTextItem().setTitle("Instansi / Universitas");
  form.addMultipleChoiceItem()
    .setTitle("Status")
    .setChoiceValues(["Mahasiswa S1", "Mahasiswa S2/S3", "Dosen", "Peneliti", "Lainnya"])
    .setRequired(true);
  form.addListItem()
    .setTitle("Layanan yang diminati")
    .setChoiceValues([
      "Publikasi Jurnal Internasional (Scopus/WoS)",
      "Publikasi Jurnal Nasional (SINTA)",
      "Proofreading / Translasi",
      "Cek Turnitin",
      "Pendampingan Skripsi hingga Terbit",
      "Penerbitan Buku",
      "Lainnya",
    ])
    .setRequired(true);
  form.addTextItem().setTitle("Judul naskah").setRequired(true);
  form.addTextItem().setTitle("Target jurnal / penerbit (jika ada)");
  form.addParagraphTextItem().setTitle("Catatan untuk tim kami");

  const ss = SpreadsheetApp.create("Data Kiriman Naskah — " + BRAND);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "onFormSubmit")
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("onFormSubmit").forForm(form).onFormSubmit().create();

  Logger.log("Edit formulir : " + form.getEditUrl());
  Logger.log("Tautan publik : " + form.getPublishedUrl());
  Logger.log("Spreadsheet   : " + ss.getUrl());
  Logger.log("LANGKAH BERIKUTNYA: buka tautan Edit, tambahkan pertanyaan 'Upload file'.");
}

function onFormSubmit(e) {
  const response = e.response;
  const senderEmail = response.getRespondentEmail();
  const admin = ADMIN_EMAIL || Session.getEffectiveUser().getEmail();

  const rows = [];
  let nama = "";
  response.getItemResponses().forEach((ir) => {
    const item = ir.getItem();
    let value = ir.getResponse();
    if (item.getType() === FormApp.ItemType.FILE_UPLOAD) {
      value = value
        .map((id) => {
          const f = DriveApp.getFileById(id);
          return '<a href="' + f.getUrl() + '">' + escapeHtml(f.getName()) + "</a>";
        })
        .join("<br>");
    } else {
      value = escapeHtml(Array.isArray(value) ? value.join(", ") : String(value));
    }
    if (item.getTitle() === "Nama lengkap") nama = ir.getResponse();
    rows.push("<tr><td style='padding:6px 12px;color:#5d6779'>" + escapeHtml(item.getTitle()) +
      "</td><td style='padding:6px 12px'>" + value + "</td></tr>");
  });
  const table = "<table style='border-collapse:collapse;font-family:sans-serif;font-size:14px'>" +
    "<tr><td style='padding:6px 12px;color:#5d6779'>Email</td><td style='padding:6px 12px'>" +
    escapeHtml(senderEmail) + "</td></tr>" + rows.join("") + "</table>";

  // 1) Notifikasi ke admin
  MailApp.sendEmail({
    to: admin,
    replyTo: senderEmail,
    subject: "[Naskah Baru] " + (nama || senderEmail),
    htmlBody: "<p>Ada kiriman naskah baru untuk review awal:</p>" + table,
  });

  // 2) Konfirmasi ke pengirim
  if (senderEmail) {
    MailApp.sendEmail({
      to: senderEmail,
      name: BRAND,
      replyTo: admin,
      subject: "Naskah Anda sudah kami terima — " + BRAND,
      htmlBody:
        "<p>Halo " + escapeHtml(nama || "") + ",</p>" +
        "<p>Terima kasih telah mengirim naskah ke <b>" + BRAND + "</b>. " +
        "Tim kami akan melakukan review awal dan mengirim hasilnya ke email ini dalam 2–3 hari kerja.</p>" +
        "<p>Ringkasan kiriman Anda:</p>" + table +
        "<p>Ada pertanyaan? Hubungi kami via WhatsApp: " +
        "<a href='https://wa.me/" + WA_NUMBER + "'>+62 813-1023-310</a></p>" +
        "<p>Salam,<br>Tim " + BRAND + "</p>",
    });
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}
