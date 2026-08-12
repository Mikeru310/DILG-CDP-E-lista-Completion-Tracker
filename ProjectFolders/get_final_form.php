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

$municipality = trim((string)($_GET['municipality'] ?? ''));
$cycle_id     = (int)($_GET['cycle_id'] ?? 0);

if ($municipality === '') {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Municipality is required."]);
  exit;
}

$municipality_id = muni_id_from_name($pdo, $municipality);
if ($municipality_id <= 0) {
  http_response_code(404);
  echo json_encode(["ok" => false, "error" => "Municipality not found."]);
  exit;
}

if ($cycle_id <= 0) {
  $qc = $pdo->query("
    SELECT id
    FROM planning_cycles
    WHERE is_active = 1
    ORDER BY id DESC
    LIMIT 1
  ");
  $cycle_id = (int)($qc->fetchColumn() ?? 0);
}

if ($cycle_id <= 0) {
  echo json_encode([
    "ok" => true,
    "exists" => false,
    "error" => "No active cycle found."
  ]);
  exit;
}

$stmt = $pdo->prepare("
  SELECT
    ffs.id,
    ffs.user_id,
    ffs.municipality_id,
    ffs.cycle_id,
    ffs.status,
    ffs.file_name,
    ffs.file_path,
    ffs.upload_remarks,
    ffs.revision_remarks,
    ffs.uploaded_at,
    ffs.approved_at,
    m.name AS municipality_name,
    pc.cycle_start,
    pc.cycle_end
  FROM final_form_submissions ffs
  INNER JOIN municipalities m ON m.id = ffs.municipality_id
  INNER JOIN planning_cycles pc ON pc.id = ffs.cycle_id
  WHERE ffs.municipality_id = :mid
    AND ffs.cycle_id = :cid
  ORDER BY ffs.uploaded_at DESC, ffs.id DESC
  LIMIT 1
");
$stmt->execute([
  ':mid' => $municipality_id,
  ':cid' => $cycle_id
]);

$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
  echo json_encode([
    "ok" => true,
    "exists" => false,
    "municipality" => $municipality,
    "cycle_id" => $cycle_id
  ]);
  exit;
}

echo json_encode([
  "ok" => true,
  "exists" => true,
  "submission" => $row
]);
