<?php
// elista/get_file.php (Unified)
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

header("Content-Type: application/json; charset=utf-8");

// --- Municipality PK compatibility layer ---
function muni_pk_col(PDO $pdo): string {
  static $col = null;
  if ($col) return $col;
  try {
    $pdo->query("SELECT id FROM municipalities LIMIT 1");
    $col = 'id';
  } catch (Throwable $e) {
    $col = 'municipal_id';
  }
  return $col;
}

function muni_id_from_name(PDO $pdo, string $name): int {
  $name = trim($name);
  if ($name === '') return 0;
  $col = muni_pk_col($pdo);
  $q = $pdo->prepare("SELECT {$col} FROM municipalities WHERE LOWER(name)=LOWER(:n) LIMIT 1");
  $q->execute([':n' => $name]);
  return (int)($q->fetchColumn() ?? 0);
}

$role = strtolower(trim((string)($_SESSION['role'] ?? '')));

$municipality = trim((string)($_GET["municipality"] ?? ""));
$step = (int)($_GET["step"] ?? 0);
$category = trim((string)($_GET["category"] ?? ""));
$cycle_id = (int)($_GET["cycle_id"] ?? 0);

if ($step < 1 || $step > 20 || $category === "") {
  http_response_code(400);
  echo json_encode(["ok"=>false,"error"=>"Bad input"]);
  exit;
}

$muni_id = 0;
if (in_array($role, ['responder','mlgoo'], true)) {
  $muni_id = (int)($_SESSION['municipality_id'] ?? 0);
} else {
  if ($municipality === "") {
    http_response_code(400);
    echo json_encode(["ok"=>false,"error"=>"Bad input"]);
    exit;
  }
  $muni_id = muni_id_from_name($pdo, $municipality);
}

if ($muni_id <= 0) {
  echo json_encode([
    "ok"=>true,
    "file_name"=>null,
    "file_path"=>null,
    "status"=>null,
    "upload_remarks"=>null,
    "revision_remarks"=>null,
    "uploaded_at"=>null,
    "approved_at"=>null
  ]);
  exit;
}

if ($cycle_id <= 0) {
  try {
    $qc = $pdo->query("SELECT id FROM planning_cycles WHERE is_active = 1 ORDER BY id DESC LIMIT 1");
    $cycle_id = (int)($qc->fetchColumn() ?? 0);
  } catch (Throwable $e) {
    $cycle_id = 0;
  }
}

$mapBack = [
  "social" => "Social",
  "economic" => "Economic",
  "infrastructure" => "Infrastructure",
  "environmental" => "Environmental",
  "individual" => "Institutional",
  "institutional" => "Institutional"
];

$dbCat = $mapBack[strtolower($category)] ?? null;

if (!$dbCat) {
  http_response_code(400);
  echo json_encode(["ok"=>false,"error"=>"Unknown category"]);
  exit;
}

if ($cycle_id > 0) {
  $stmt = $pdo->prepare("
    SELECT
      file_name,
      file_path,
      status,
      upload_remarks,
      revision_remarks,
      uploaded_at,
      approved_at
    FROM submissions
    WHERE municipality_id = :mid
      AND step_no = :step
      AND category = :cat
      AND cycle_id = :cycle_id
    ORDER BY uploaded_at DESC, id DESC
    LIMIT 1
  ");
  $stmt->execute([
    ":mid" => $muni_id,
    ":step" => $step,
    ":cat" => $dbCat,
    ":cycle_id" => $cycle_id
  ]);
} else {
  $stmt = $pdo->prepare("
    SELECT
      file_name,
      file_path,
      status,
      upload_remarks,
      revision_remarks,
      uploaded_at,
      approved_at
    FROM submissions
    WHERE municipality_id = :mid
      AND step_no = :step
      AND category = :cat
    ORDER BY uploaded_at DESC, id DESC
    LIMIT 1
  ");
  $stmt->execute([
    ":mid" => $muni_id,
    ":step" => $step,
    ":cat" => $dbCat
  ]);
}

$r = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode([
  "ok" => true,
  "file_name" => $r["file_name"] ?? null,
  "file_path" => $r["file_path"] ?? null,
  "status" => $r["status"] ?? null,
  "upload_remarks" => $r["upload_remarks"] ?? null,
  "revision_remarks" => $r["revision_remarks"] ?? null,
  "uploaded_at" => $r["uploaded_at"] ?? null,
  "approved_at" => $r["approved_at"] ?? null
]);