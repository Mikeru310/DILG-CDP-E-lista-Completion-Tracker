<?php
// elista/get_history.php (Unified)
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

header("Content-Type: application/json; charset=utf-8");

function fail(string $msg, int $code = 400): void {
  http_response_code($code);
  echo json_encode(["ok"=>false, "error"=>$msg]);
  exit;
}

$role = strtolower(trim((string)($_SESSION['role'] ?? '')));

$municipality = trim((string)($_GET["municipality"] ?? ""));
$step = (int)($_GET["step"] ?? 0);
$category = trim((string)($_GET["category"] ?? ""));

$allowedCategories = ["Social","Economic","Infrastructure","Environmental","Institutional"];
if ($step < 1 || $step > 20 || !in_array($category, $allowedCategories, true)) {
  fail("Bad input.");
}

$muni_id = 0;
if (in_array($role, ['responder','mlgoo'], true)) {
  $muni_id = (int)($_SESSION['municipality_id'] ?? 0);
} else {
  if ($municipality === "") fail("Bad input.");
  $q = $pdo->prepare("SELECT id FROM municipalities WHERE LOWER(name)=LOWER(:n) LIMIT 1");
  $q->execute([":n" => $municipality]);
  $muni_id = (int)($q->fetchColumn() ?? 0);
}

if ($muni_id <= 0) fail("Municipality not found.");

$out = [];

$cur = $pdo->prepare("
  SELECT
    'current' AS source,
    id AS row_id,
    file_name, file_path, status,
    uploaded_at, approved_at, revision_remarks,
    NULL AS archived_at
  FROM submissions
  WHERE municipality_id = :m AND step_no = :s AND category = :c
  LIMIT 1
");
$cur->execute([":m"=>$muni_id, ":s"=>$step, ":c"=>$category]);
$curRow = $cur->fetch(PDO::FETCH_ASSOC);
if ($curRow) $out[] = $curRow;

$hist = $pdo->prepare("
  SELECT
    'history' AS source,
    id AS row_id,
    file_name, file_path, status,
    uploaded_at, approved_at, revision_remarks,
    archived_at
  FROM submission_history
  WHERE municipality_id = :m AND step_no = :s AND category = :c
  ORDER BY archived_at DESC
");
$hist->execute([":m"=>$muni_id, ":s"=>$step, ":c"=>$category]);
$out = array_merge($out, $hist->fetchAll(PDO::FETCH_ASSOC));

echo json_encode(["ok"=>true, "items"=>$out]);
