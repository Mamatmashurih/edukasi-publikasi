// Ganti dengan nomor WhatsApp bisnis Anda (format internasional, tanpa + atau spasi)
const WA_NUMBER = "628131023310";

// Tempel tautan Google Form Anda (tombol "Kirim" > ikon tautan), contoh:
// "https://docs.google.com/forms/d/e/XXXXXXXX/viewform"
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScr9OKYKTr4y9DCfoQPz7FR_USEyD9N__sH3Wl3yxOfRXIrFg/viewform";

const formLink = document.getElementById("gform-link");
if (GOOGLE_FORM_URL) {
  // Dibuka di tab baru: upload file butuh login Google, yang diblokir di dalam iframe
  formLink.href = GOOGLE_FORM_URL;
} else {
  // Sebelum formulir siap, arahkan ke WhatsApp
  formLink.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo, saya ingin mengirim naskah untuk review awal.")}`;
}

document.getElementById("year").textContent = new Date().getFullYear();

// Menu mobile
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => links.classList.remove("open"))
);

// Formulir -> WhatsApp
document.getElementById("wa-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  const text =
    `Halo, saya ingin konsultasi.\n\n` +
    `Nama: ${d.get("nama")}\n` +
    `Instansi: ${d.get("instansi") || "-"}\n` +
    `Layanan: ${d.get("layanan")}\n` +
    `Pesan: ${d.get("pesan") || "-"}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
});
