<?php
// elista/get_zip_entries.php — returns JSON list of files inside a final-form ZIP
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

function deny_json(int $code, string $msg): void {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg]);
  exit;
}

$user_id = (int)($_SESSION['user_id'] ?? 0);
$role    = strtolower(trim((string)($_SESSION['role'] ?? '')));

if ($user_id <= 0) {
  deny_json(401, 'Not logged in.');
}

$filePath = trim((string)($_GET['file_path'] ?? ''));
if ($filePath === '') {
  deny_json(400, 'Missing file_path.');
}

// Sanitise path: strip traversal sequences and leading slashes
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
  $fullZipPath === false ||
  $allowedBase === false ||
  strncmp($fullZipPath, $allowedBase, strlen($allowedBase)) !== 0 ||
  !is_file($fullZipPath)
) {
  deny_json(403, 'Access denied.');
}

if (!class_exists('ZipArchive')) {
  deny_json(500, 'ZipArchive extension is not available on this server.');
}

$zip = new ZipArchive();
if ($zip->open($fullZipPath) !== true) {
  deny_json(500, 'Could not open ZIP file.');
}

$entries = [];
for ($i = 0; $i < $zip->numFiles; $i++) {
  $name = $zip->getNameIndex($i);
  if ($name === false) continue;
  if (substr($name, -1) === '/') continue; // skip directory entries
  if (basename($name) === '' ) continue;   // safety: skip malformed
  $entries[] = $name;
}
$zip->close();

sort($entries);

echo json_encode(['ok' => true, 'entries' => $entries]);
