<?php
// elista/get_file_history.php (Unified: Core SSO + DILG8888 DB)
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

header("Content-Type: application/json; charset=utf-8");

function out(array $arr, int $code = 200): void {
  http_response_code($code);
  echo json_encode($arr);
  exit;
}

$role = strtolower(trim((string)($_SESSION['role'] ?? '')));

$municipality = trim((string)($_GET["municipality"] ?? ""));
$step = (int)($_GET["step"] ?? 0);
$category = trim((string)($_GET["category"] ?? ""));

if ($step < 1 || $step > 20 || $category === "") {
  out(["ok"=>false,"error"=>"Bad input"], 400);
}

// Resolve municipality_id
$mid = 0;
if (in_array($role, ['responder','mlgoo'], true)) {
  $mid = (int)($_SESSION['municipality_id'] ?? 0);
} else {
  if ($municipality === "") out(["ok"=>false,"error"=>"Bad input"], 400);
  $q = $pdo->prepare("SELECT id FROM municipalities WHERE LOWER(name)=LOWER(:n) LIMIT 1");
  $q->execute([":n" => $municipality]);
  $mid = (int)($q->fetchColumn() ?? 0);
}

if ($mid <= 0) {
  out(["ok"=>true,"files"=>[]]);
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
  out(["ok"=>false,"error"=>"Unknown category"], 400);
}

$files = [];

// 1) Current
$cur = $pdo->prepare("
  SELECT
    id,
    file_name,
    file_path,
    status,
    uploaded_at,
    updated_at,
    approved_at,
    revision_remarks,
    NULL AS archived_at,
    0 AS is_history
  FROM submissions
  WHERE municipality_id = :mid
    AND step_no = :step
    AND category = :cat
  LIMIT 1
");

$cur->execute([
  ":mid"  => $mid,
  ":step" => $step,
  ":cat"  => $dbCat
]);

$curRow = $cur->fetch(PDO::FETCH_ASSOC);
if ($curRow) $files[] = $curRow;

// 2) History
$hist = $pdo->prepare("
  SELECT
    id,
    file_name,
    file_path,
    status,
    uploaded_at,
    NULL AS updated_at,
    approved_at,
    revision_remarks,
    archived_at,
    1 AS is_history
  FROM submission_history
  WHERE municipality_id = :mid
    AND step_no = :step
    AND category = :cat
  ORDER BY archived_at DESC, id DESC
");

$hist->execute([
  ":mid"  => $mid,
  ":step" => $step,
  ":cat"  => $dbCat
]);

$files = array_merge($files, $hist->fetchAll(PDO::FETCH_ASSOC));

out(["ok"=>true, "files"=>$files]);
