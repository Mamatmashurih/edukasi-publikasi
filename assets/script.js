// Ganti dengan nomor WhatsApp bisnis Anda (format internasional, tanpa + atau spasi)
const WA_NUMBER = "628131023310";

// Tempel tautan Google Form Anda (tombol "Kirim" > ikon tautan), contoh:
// "https://docs.google.com/forms/d/e/XXXXXXXX/viewform"
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScr9OKYKTr4y9DCfoQPz7FR_USEyD9N__sH3Wl3yxOfRXIrFg/viewform";

// Tautan Google Form "Testimoni Klien" (kosongkan jika belum ada)
const TESTIMONI_FORM_URL = "";

// Script ini dipakai di semua halaman, jadi setiap elemen dicek dulu keberadaannya
const $ = (id) => document.getElementById(id);

const formLink = $("gform-link");
if (formLink) {
  // Dibuka di tab baru: upload file butuh login Google, yang diblokir di dalam iframe
  formLink.href = GOOGLE_FORM_URL ||
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo, saya ingin mengirim naskah untuk skrining awal.")}`;
}

if ($("year")) $("year").textContent = new Date().getFullYear();

// Menu mobile
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
if (toggle && links) {
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );
}

// Formulir -> WhatsApp
const waForm = $("wa-form");
if (waForm) {
  waForm.addEventListener("submit", (e) => {
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
}

// Testimoni: hanya klien nyata yang sudah memberi izin, diisi di assets/testimoni.json
const testiList = $("testi-list");
if (testiList) {
  fetch("assets/testimoni.json?v=" + Date.now())
    .then((r) => (r.ok ? r.json() : []))
    .then((items) => {
      if (!Array.isArray(items) || !items.length) return;
      items.forEach((t) => {
        const card = document.createElement("figure");
        card.className = "card testi in";
        const q = document.createElement("blockquote");
        q.textContent = t.kutipan || "";
        card.append(q);
        if (t.layanan) {
          const tag = document.createElement("span");
          tag.className = "post-tag";
          tag.textContent = t.layanan;
          card.prepend(tag);
        }
        if (t.tautan && /^https?:\/\//.test(t.tautan)) {
          const a = document.createElement("a");
          a.className = "testi-link";
          a.href = t.tautan;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = "Lihat karya yang terbit →";
          card.append(a);
        }
        const who = document.createElement("figcaption");
        who.className = "testi-who";
        const av = document.createElement("span");
        av.className = "testi-avatar";
        av.textContent = (t.nama || "?").trim().charAt(0).toUpperCase();
        const info = document.createElement("div");
        const nm = document.createElement("strong");
        nm.textContent = t.nama || "";
        const ket = document.createElement("span");
        ket.textContent = t.keterangan || "";
        info.append(nm, ket);
        who.append(av, info);
        card.append(who);
        testiList.append(card);
      });
      $("testimoni").hidden = false;
    })
    .catch(() => {});
}
if (TESTIMONI_FORM_URL) {
  [["testi-form-link", "testi-cta"], ["footer-testi", "footer-testi"]].forEach(([link, box]) => {
    if ($(link)) {
      $(link).href = TESTIMONI_FORM_URL;
      $(box).hidden = false;
    }
  });
}

// Animasi muncul saat di-scroll
const revealTargets = document.querySelectorAll(
  ".card, .aud-card, .steps li, .price-card, .promo, .gform-card, details"
);
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });
}
