<?php
require __DIR__ . '/../core/auth.php';

$role = strtolower(trim((string)($_SESSION['role'] ?? '')));

if ($role === 'encoder') {
  header('Location: /elista/fp_dashboard.php');
  exit;
}

if ($role === 'mlgoo' || $role === 'responder') {
  header('Location: /elista/progress.php');
  exit;
}

header('Location: /core/portal.php');
exit;
