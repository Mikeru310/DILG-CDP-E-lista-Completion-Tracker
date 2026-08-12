<?php
require __DIR__ . "/../core/auth.php";

// role guard
$role = strtolower(trim((string)($_SESSION['role'] ?? '')));
if (!in_array($role, ['mlgoo', 'responder', 'encoder'], true)) {
  http_response_code(403);
  echo "Forbidden";
  exit;
}

$type = $_GET['type'] ?? '';
$file = $_GET['file'] ?? '';

if (!in_array($type, ['forms', 'refs'], true) || $file === '') {
  http_response_code(400);
  echo "Bad request";
  exit;
}

// Base directories
$base = ($type === 'forms')
  ? (__DIR__ . "/templates/cdp_forms")
  : (__DIR__ . "/templates/cdp_references");

// Normalize and prevent traversal
$file = str_replace('\\', '/', $file);
$file = ltrim($file, '/');

// Resolve real path
$target = realpath($base . "/" . $file);
$baseReal = realpath($base);

if ($baseReal === false || $target === false) {
  http_response_code(404);
  echo "Not found";
  exit;
}

// Must be inside base folder
if (strpos($target, $baseReal) !== 0) {
  http_response_code(403);
  echo "Forbidden";
  exit;
}

if (!is_file($target)) {
  http_response_code(404);
  echo "Not found";
  exit;
}

// Send as download
$filename = basename($target);

// content type
$mime = "application/octet-stream";
if (function_exists('finfo_open')) {
  $finfo = finfo_open(FILEINFO_MIME_TYPE);
  if ($finfo) {
    $mime = finfo_file($finfo, $target) ?: $mime;
    finfo_close($finfo);
  }
}

header("Content-Type: " . $mime);
header('Content-Disposition: attachment; filename="' . $filename . '"');
header("Content-Length: " . filesize($target));
header("X-Content-Type-Options: nosniff");

readfile($target);
exit;
