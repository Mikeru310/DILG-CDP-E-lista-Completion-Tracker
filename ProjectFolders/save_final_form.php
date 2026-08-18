<?php
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

header("Content-Type: application/json; charset=utf-8");

$role = strtolower(trim((string)($_SESSION['role'] ?? '')));
if ($role !== 'encoder') {
  http_response_code(403);
  echo json_encode(["ok" => false, "error" => "Forbidden"]);
  exit;
}

function muni_id_from_name(PDO $pdo, string $name): int {
  $name = trim($name);
  if ($name === '') return 0;

  try {
    $q = $pdo->prepare("SELECT id FROM municipalities WHERE LOWER(name)=LOWER(:n) LIMIT 1");
    $q->execute([':n' => $name]);
    return (int)($q->fetchColumn() ?? 0);
  } catch (Throwable $e) {
    return 0;
  }
}

$body = json_decode(file_get_contents("php://input"), true);
if (!$body) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Invalid JSON"]);
  exit;
}

$municipality = trim((string)($body['municipality'] ?? ''));
$cycle_id     = (int)($body['cycle_id'] ?? 0);
$action       = trim((string)($body['action'] ?? ''));
$remarks      = trim((string)($body['remarks'] ?? ''));

if ($municipality === '' || $cycle_id <= 0 || !in_array($action, ['approve', 'reject'], true)) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Bad input"]);
  exit;
}

if ($action === 'reject' && $remarks === '') {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Remarks are required for revision."]);
  exit;
}

$municipality_id = muni_id_from_name($pdo, $municipality);
if ($municipality_id <= 0) {
  http_response_code(404);
  echo json_encode(["ok" => false, "error" => "Municipality not found"]);
  exit;
}

$newStatus = ($action === 'approve') ? 'approved' : 'with-revision';

if ($action === 'approve') {
  $stmt = $pdo->prepare("
    UPDATE final_form_submissions
    SET
      status = 'approved',
      revision_remarks = :remarks,
      approved_at = NOW()
    WHERE municipality_id = :mid
      AND cycle_id = :cid
  ");
  $stmt->execute([
    ':remarks' => ($remarks !== '' ? $remarks : null),
    ':mid'     => $municipality_id,
    ':cid'     => $cycle_id
  ]);
} else {
  $stmt = $pdo->prepare("
    UPDATE final_form_submissions
    SET
      status = 'with-revision',
      revision_remarks = :remarks,
      approved_at = NULL
    WHERE municipality_id = :mid
      AND cycle_id = :cid
  ");
  $stmt->execute([
    ':remarks' => $remarks,
    ':mid'     => $municipality_id,
    ':cid'     => $cycle_id
  ]);
}

echo json_encode([
  "ok" => true,
  "status" => $newStatus,
  "updated" => $stmt->rowCount()
]);
