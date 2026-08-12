<?php
require __DIR__ . "/../core/auth.php";
require __DIR__ . "/../core/config.php";

header("Content-Type: application/json; charset=utf-8");

if (!isset($_SESSION["user_id"])) {
  http_response_code(401);
  echo json_encode(["ok" => false, "error" => "Not logged in."]);
  exit;
}

$role           = strtolower(trim((string)($_SESSION["role"] ?? "")));
$municipalityId = (int)($_SESSION["municipality_id"] ?? 0);

// Fallback: if session lacks municipality_id, look it up from the users table.
if ($municipalityId <= 0 && $role !== "encoder") {
  $qUser = $pdo->prepare("SELECT municipality_id FROM users WHERE id = ? LIMIT 1");
  $qUser->execute([(int)($_SESSION["user_id"] ?? 0)]);
  $municipalityId = (int)($qUser->fetchColumn() ?: 0);
}

// Encoder may pass ?municipality_id=X to look up a specific municipality's active cycle
if ($role === "encoder") {
  $param = (int)($_GET["municipality_id"] ?? 0);
  if ($param > 0) {
    $municipalityId = $param;
  }
}

try {
  if ($municipalityId <= 0) {
    echo json_encode(["ok" => false, "error" => "No municipality specified."]);
    exit;
  }

  $q = $pdo->prepare("
    SELECT id, municipality_id, cycle_start, cycle_end
    FROM   planning_cycles
    WHERE  is_active       = 1
      AND  municipality_id = ?
    ORDER  BY id DESC
    LIMIT  1
  ");
  $q->execute([$municipalityId]);
  $cycle = $q->fetch(PDO::FETCH_ASSOC);

  if (!$cycle) {
    echo json_encode(["ok" => false, "error" => "No active cycle found for this municipality."]);
    exit;
  }

  echo json_encode([
    "ok"              => true,
    "id"              => (int)$cycle["id"],
    "municipality_id" => (int)$cycle["municipality_id"],
    "cycle_start"     => (int)$cycle["cycle_start"],
    "cycle_end"       => (int)$cycle["cycle_end"]
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => $e->getMessage()]);
}