<?php
// elista/serve_zip_entry.php — streams a single entry from a ZIP archive.
// Encoder role may access any file under uploads/.
// Other roles are confined to their own uploads/user_{id}/ directory.
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

ini_set('display_errors', '0');
error_reporting(E_ALL);

function deny(int $code, string $msg = ''): void {
  http_response_code($code);
  if ($msg !== '') {
    header('Content-Type: text/plain; charset=utf-8');
    echo $msg;
  }
  exit;
}

$user_id = (int)($_SESSION['user_id'] ?? 0);
$role    = strtolower(trim((string)($_SESSION['role'] ?? '')));

if ($user_id <= 0) {
  deny(401, 'Not logged in.');
}

$filePath = trim((string)($_GET['file_path'] ?? ''));
$entry    = trim((string)($_GET['entry']     ?? ''));

if ($filePath === '' || $entry === '') {
  deny(400, 'Missing file_path or entry.');
}

// Sanitise the ZIP path
$normalized  = ltrim(str_replace(['..\\', '../', '\\'], ['', '', '/'], $filePath), '/');
$fullZipPath = realpath(__DIR__ . '/' . $normalized);

// Role-based confinement:
//   encoder → any file under uploads/
//   others  → only their own uploads/user_{id}/
if ($role === 'encoder') {
  $allowedBase = realpath(__DIR__ . '/uploads');
} else {
  $allowedBase = realpath(__DIR__ . '/uploads/user_' . $user_id);
}

if (
  !$fullZipPath ||
  !$allowedBase ||
  strncmp($fullZipPath, $allowedBase, strlen($allowedBase)) !== 0 ||
  !is_file($fullZipPath)
) {
  deny(403, 'Access denied.');
}

if (!class_exists('ZipArchive')) {
  deny(500, 'ZipArchive extension is not available on this server.');
}

$zip = new ZipArchive();
if ($zip->open($fullZipPath) !== true) {
  deny(500, 'Could not open ZIP file.');
}

// Locate the requested entry (exact match first, then case-insensitive fallback)
$idx = $zip->locateName($entry);
if ($idx === false) {
  $idx = $zip->locateName($entry, ZipArchive::FL_NOCASE);
}
if ($idx === false) {
  $zip->close();
  deny(404, 'Entry not found inside ZIP.');
}

$content = $zip->getFromIndex($idx);
$zip->close();

if ($content === false) {
  deny(500, 'Could not read entry from ZIP.');
}

// Derive MIME type from extension
$ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
$mimeMap = [
  'pdf'  => 'application/pdf',
  'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'doc'  => 'application/msword',
  'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls'  => 'application/vnd.ms-excel',
  'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'ppt'  => 'application/vnd.ms-powerpoint',
  'txt'  => 'text/plain; charset=utf-8',
  'csv'  => 'text/csv; charset=utf-8',
  'png'  => 'image/png',
  'jpg'  => 'image/jpeg',
  'jpeg' => 'image/jpeg',
  'gif'  => 'image/gif',
  'webp' => 'image/webp',
  'svg'  => 'image/svg+xml',
];
$mime     = $mimeMap[$ext] ?? 'application/octet-stream';
$basename = basename($entry);

header('Content-Type: ' . $mime);
$disposition = in_array($ext, ['pdf', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'], true)
  ? 'inline'
  : 'attachment';
header('Content-Disposition: ' . $disposition . '; filename="' . addslashes($basename) . '"');
header('Content-Length: ' . strlen($content));
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');

echo $content;
