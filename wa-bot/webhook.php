<?php
/**
 * Edukasi Publikasi — Chatbot WhatsApp (WhatsApp Cloud API + Gemini)
 *
 * Alamat webhook: https://edukasipublikasi.web.id/wa-bot/webhook.php
 * Rahasia (token, API key) TIDAK disimpan di repo, tetapi di file
 * wa-bot-config.php di luar public_html. Lihat wa-bot/PANDUAN.md.
 */

declare(strict_types=1);

$configPath = dirname(__DIR__, 2) . '/wa-bot-config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    exit('Config belum dibuat');
}
$cfg = require $configPath;

$dataDir = dirname(__DIR__, 2) . '/wa-bot-data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0700, true);
}

// ---------- 1. Verifikasi webhook dari Meta (GET) ----------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (($_GET['hub_mode'] ?? '') === 'subscribe'
        && hash_equals($cfg['verify_token'], (string)($_GET['hub_verify_token'] ?? ''))) {
        echo $_GET['hub_challenge'] ?? '';
    } else {
        http_response_code(403);
    }
    exit;
}

// ---------- 2. Pesan masuk (POST) ----------
$raw = file_get_contents('php://input') ?: '';

// Pastikan permintaan benar-benar dari Meta
$sig = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
if (!hash_equals('sha256=' . hash_hmac('sha256', $raw, $cfg['app_secret']), $sig)) {
    http_response_code(401);
    exit;
}

// Balas 200 ke Meta secepatnya, lalu proses di belakang
http_response_code(200);
echo 'OK';
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

$payload = json_decode($raw, true);
$value = $payload['entry'][0]['changes'][0]['value'] ?? [];

// Admin membalas manual dari aplikasi WhatsApp Business (coexistence):
// catat balasannya ke riwayat dan bekukan bot di chat itu
foreach ($value['message_echoes'] ?? [] as $echo) {
    $to = preg_replace('/\D/', '', (string)($echo['to'] ?? ''));
    if ($to === '') {
        continue;
    }
    $pauseUntil = time() + (int)($cfg['pause_hours'] ?? 6) * 3600;
    file_put_contents("$dataDir/pause-$to.txt", (string)$pauseUntil, LOCK_EX);
    if (($echo['type'] ?? '') === 'text') {
        $h = loadHistory($dataDir, $to);
        $h[] = ['role' => 'model', 'text' => (string)$echo['text']['body'], 't' => time()];
        saveHistory($dataDir, $to, $h);
    }
}

$msg = $value['messages'][0] ?? null;
if (!$msg) {
    exit; // status pesan (terkirim/dibaca) atau echo admin, bukan pesan baru
}

$from = preg_replace('/\D/', '', (string)$msg['from']);
$msgId = (string)$msg['id'];
$name = $value['contacts'][0]['profile']['name'] ?? '';

// Abaikan pesan yang sama jika Meta mengirim ulang
$seenFile = "$dataDir/seen.txt";
$seen = is_file($seenFile) ? file($seenFile, FILE_IGNORE_NEW_LINES) : [];
if (in_array($msgId, $seen, true)) {
    exit;
}
$seen[] = $msgId;
file_put_contents($seenFile, implode("\n", array_slice($seen, -500)), LOCK_EX);

// Selama admin sedang menangani chat ini, bot hanya mencatat tanpa membalas
$pauseFile = "$dataDir/pause-$from.txt";
if (is_file($pauseFile) && (int)file_get_contents($pauseFile) > time()) {
    if (($msg['type'] ?? '') === 'text') {
        $h = loadHistory($dataDir, $from);
        $h[] = ['role' => 'user', 'text' => trim((string)$msg['text']['body']), 't' => time()];
        saveHistory($dataDir, $from, $h);
    }
    exit;
}

markRead($cfg, $msgId);

if (($msg['type'] ?? '') !== 'text') {
    sendText($cfg, $from, "Maaf, saat ini saya hanya bisa membaca pesan teks 🙏\n\n"
        . "Untuk mengirim file naskah, silakan gunakan formulir: " . $cfg['form_url']);
    exit;
}
$text = trim((string)$msg['text']['body']);

$history = loadHistory($dataDir, $from);
$history[] = ['role' => 'user', 'text' => $text, 't' => time()];

$reply = askGemini($cfg, $history, $name);
if ($reply === null) {
    $reply = "Terima kasih sudah menghubungi Edukasi Publikasi 🙏\n"
        . "Pesan Anda sudah kami terima, admin akan membalas secepatnya pada jam kerja "
        . "(Senin–Sabtu, 08.00–20.00 WIB).";
}

// Model menandai [ADMIN] jika perlu diteruskan ke manusia
$needsAdmin = str_contains($reply, '[ADMIN]');
$reply = trim(str_replace('[ADMIN]', '', $reply));

sendText($cfg, $from, $reply);

$history[] = ['role' => 'model', 'text' => $reply, 't' => time()];
saveHistory($dataDir, $from, $history);

if ($needsAdmin && !empty($cfg['admin_email'])) {
    $lines = array_map(fn($h) => ($h['role'] === 'user' ? 'Klien' : 'Bot') . ': ' . $h['text'], $history);
    @mail(
        $cfg['admin_email'],
        "[WA Bot] Perlu admin: $name (+$from)",
        "Klien ini perlu ditangani admin.\nWhatsApp: https://wa.me/$from\n\n" . implode("\n\n", $lines),
        "Content-Type: text/plain; charset=UTF-8"
    );
}

// ---------- Fungsi ----------

// Riwayat percakapan per nomor (disimpan di luar public_html)
function loadHistory(string $dataDir, string $num): array
{
    $file = "$dataDir/chat-$num.json";
    $h = is_file($file) ? (json_decode((string)file_get_contents($file), true) ?: []) : [];
    // Lupakan percakapan yang sudah lebih dari 3 hari
    return array_values(array_filter($h, fn($x) => $x['t'] > time() - 3 * 86400));
}

function saveHistory(string $dataDir, string $num, array $h): void
{
    file_put_contents("$dataDir/chat-$num.json", json_encode(array_slice($h, -16), JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function askGemini(array $cfg, array $history, string $name): ?string
{
    $system = (string)file_get_contents(__DIR__ . '/knowledge.md');
    if ($name !== '') {
        $system .= "\n\nNama profil WhatsApp klien: $name";
    }
    // Gemini butuh percakapan yang diawali klien dan bergantian peran,
    // jadi pesan beruntun dari pihak yang sama digabung
    $contents = [];
    foreach ($history as $h) {
        if ($contents === [] && $h['role'] !== 'user') {
            continue;
        }
        $last = count($contents) - 1;
        if ($last >= 0 && $contents[$last]['role'] === $h['role']) {
            $contents[$last]['parts'][0]['text'] .= "\n" . $h['text'];
        } else {
            $contents[] = ['role' => $h['role'], 'parts' => [['text' => $h['text']]]];
        }
    }

    $res = httpJson(
        'https://generativelanguage.googleapis.com/v1beta/models/' . $cfg['gemini_model'] . ':generateContent',
        ['x-goog-api-key: ' . $cfg['gemini_api_key']],
        [
            'system_instruction' => ['parts' => [['text' => $system]]],
            'contents' => $contents,
            'generationConfig' => ['temperature' => 0.4, 'maxOutputTokens' => 800],
        ]
    );
    $out = $res['candidates'][0]['content']['parts'][0]['text'] ?? null;
    if ($out === null) {
        logError('Gemini: ' . json_encode($res));
    }
    return $out !== null ? trim($out) : null;
}

function sendText(array $cfg, string $to, string $body): void
{
    $res = httpJson(
        'https://graph.facebook.com/' . $cfg['graph_version'] . '/' . $cfg['phone_number_id'] . '/messages',
        ['Authorization: Bearer ' . $cfg['wa_token']],
        ['messaging_product' => 'whatsapp', 'to' => $to, 'type' => 'text',
         'text' => ['body' => mb_substr($body, 0, 4000), 'preview_url' => true]]
    );
    if (isset($res['error'])) {
        logError('WA send: ' . json_encode($res['error']));
    }
}

function markRead(array $cfg, string $msgId): void
{
    httpJson(
        'https://graph.facebook.com/' . $cfg['graph_version'] . '/' . $cfg['phone_number_id'] . '/messages',
        ['Authorization: Bearer ' . $cfg['wa_token']],
        ['messaging_product' => 'whatsapp', 'status' => 'read', 'message_id' => $msgId]
    );
}

function httpJson(string $url, array $headers, array $body): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 40,
        CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
    ]);
    $out = curl_exec($ch);
    if ($out === false) {
        logError('cURL: ' . curl_error($ch));
        return [];
    }
    return json_decode((string)$out, true) ?: [];
}

function logError(string $line): void
{
    $file = dirname(__DIR__, 2) . '/wa-bot-data/error.log';
    file_put_contents($file, date('c') . ' ' . $line . "\n", FILE_APPEND | LOCK_EX);
}
