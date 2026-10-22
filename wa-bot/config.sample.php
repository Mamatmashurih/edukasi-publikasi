<?php
/**
 * CONTOH pengaturan bot. JANGAN isi kunci asli di file ini (repo GitHub bersifat publik).
 *
 * Salin isi file ini ke:  domains/edukasipublikasi.web.id/wa-bot-config.php
 * (satu tingkat DI ATAS public_html, lewat File Manager Hostinger), lalu isi nilainya.
 */
return [
    // Google AI Studio > Get API key
    'gemini_api_key'  => 'ISI_GEMINI_API_KEY',
    'gemini_model'    => 'gemini-2.5-flash',

    // Meta for Developers > aplikasi Anda > WhatsApp > API Setup
    'wa_token'        => 'ISI_TOKEN_WHATSAPP',
    'phone_number_id' => 'ISI_PHONE_NUMBER_ID',
    // App settings > Basic > App secret
    'app_secret'      => 'ISI_APP_SECRET',
    // Kata sandi bebas buatan Anda sendiri, diisi sama persis di menu Webhook Meta
    'verify_token'    => 'ISI_KATA_BEBAS_MISAL_edupub-2026',
    'graph_version'   => 'v21.0',

    'admin_email'     => 'wawansetiawardani15@gmail.com',
    'form_url'        => 'https://docs.google.com/forms/d/e/1FAIpQLScr9OKYKTr4y9DCfoQPz7FR_USEyD9N__sH3Wl3yxOfRXIrFg/viewform',
];
