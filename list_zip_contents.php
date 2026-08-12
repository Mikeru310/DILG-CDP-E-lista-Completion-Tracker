<?php
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');
error_reporting(E_ALL);

function fail(string $msg, int $code = 400): void {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg]);
  exit;
}

try {
  if (!class_exists('ZipArchive')) {
    fail('ZipArchive is not available on this server.', 500);
  }

  $user_id = (int)($_SESSION['user_id'] ?? 0);
  if ($user_id <= 0) {
    fail('Not logged in.', 401);
  }

  $filePath = trim((string)($_GET['file_path'] ?? ''));
  if ($filePath === '') {
    fail('Missing file_path.', 400);
  }

  $normalized = ltrim(str_replace(['..\\', '../', '\\'], ['', '', '/'], $filePath), '/');
  $fullPath = __DIR__ . '/' . $normalized;

  if (!is_file($fullPath)) {
    fail('ZIP file not found.', 404);
  }

  $real = realpath($fullPath);
  $allowedBase = realpath(__DIR__ . '/uploads/user_' . $user_id);

  if (!$real || !$allowedBase || strpos($real, $allowedBase) !== 0) {
    fail('Access denied.', 403);
  }

  $zip = new ZipArchive();
  if ($zip->open($real) !== true) {
    fail('Failed to open ZIP file.', 500);
  }

  $items = [];
  for ($i = 0; $i < $zip->numFiles; $i++) {
    $stat = $zip->statIndex($i);
    if (!$stat) continue;

    $name = (string)($stat['name'] ?? '');
    if ($name === '') continue;

    $isDir = str_ends_with($name, '/');

    $items[] = [
      'name' => $name,
      'is_dir' => $isDir,
      'size' => (int)($stat['size'] ?? 0),
      'compressed_size' => (int)($stat['comp_size'] ?? 0),
      'modified' => isset($stat['mtime']) ? date('c', (int)$stat['mtime']) : null,
    ];
  }

  $zip->close();

  echo json_encode([
    'ok' => true,
    'items' => $items
  ]);
} catch (Throwable $e) {
  fail('Server error: ' . $e->getMessage(), 500);
}