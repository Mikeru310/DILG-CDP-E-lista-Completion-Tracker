<?php
require __DIR__ . "/../core/auth.php";
require __DIR__ . "/../core/config.php";

header("Content-Type: application/json; charset=utf-8");

if (!isset($_SESSION["user_id"])) {
  http_response_code(401);
  echo json_encode(["ok" => false, "error" => "Not logged in."]);
  exit;
}

$role = strtolower(trim((string)($_SESSION["role"] ?? "")));
if (!in_array($role, ["encoder", "responder"], true)) {
  http_response_code(403);
  echo json_encode(["ok" => false, "error" => "Not allowed."]);
  exit;
}

// ------------------------------------------------------------------
// Each municipality manages its own cycle library.
// encoder: may pass municipality_id explicitly (for admin use);
//          defaults to their own session municipality if not provided.
// mlgoo / responder: always uses their session municipality_id.
// ------------------------------------------------------------------
$municipalityId = (int)($_SESSION["municipality_id"] ?? 0);

if ($role === "encoder") {
  $posted = (int)($_POST["municipality_id"] ?? 0);
  if ($posted > 0) {
    $municipalityId = $posted;
  }
}

if ($municipalityId <= 0) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "No municipality associated with your account."]);
  exit;
}

// ------------------------------------------------------------------
// Validate start_year from POST
// ------------------------------------------------------------------
$rawStart = trim((string)($_POST["start_year"] ?? ""));
if (!preg_match('/^\d{4}$/', $rawStart)) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Invalid start year. Must be a 4-digit year."]);
  exit;
}

$startYear = (int)$rawStart;
$endYear   = $startYear + 6;          // always a 6-year gap

$currentYear = (int)date("Y");
if ($startYear < $currentYear - 50 || $startYear > $currentYear + 50) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Start year is out of reasonable range."]);
  exit;
}

// ------------------------------------------------------------------
// Insert the new cycle (scoped to this municipality)
// ------------------------------------------------------------------
try {
  $pdo->beginTransaction();

  // Prevent duplicates within the same municipality
  $check = $pdo->prepare("
    SELECT id
    FROM planning_cycles
    WHERE municipality_id = ?
      AND cycle_start     = ?
      AND cycle_end       = ?
    LIMIT 1
  ");
  $check->execute([$municipalityId, $startYear, $endYear]);

  if ($check->fetch()) {
    $pdo->rollBack();
    http_response_code(409);
    echo json_encode(["ok" => false, "error" => "A cycle for {$startYear}–{$endYear} already exists for this municipality."]);
    exit;
  }

  // Deactivate any currently active cycle for THIS municipality only
  $deactivate = $pdo->prepare("
    UPDATE planning_cycles
    SET    is_active = 0
    WHERE  municipality_id = ?
      AND  is_active = 1
  ");
  $deactivate->execute([$municipalityId]);

  // Insert the new cycle
  $ins = $pdo->prepare("
    INSERT INTO planning_cycles (
      municipality_id,
      cycle_start,
      cycle_end,
      start_year,
      end_year,
      is_active,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, 1, NOW())
  ");
  $ins->execute([$municipalityId, $startYear, $endYear, $startYear, $endYear]);

  $newId = (int)$pdo->lastInsertId();
  $pdo->commit();

  echo json_encode([
    "ok"          => true,
    "message"     => "New cycle created successfully.",
    "id"          => $newId,
    "cycle_start" => $startYear,
    "cycle_end"   => $endYear,
    "start_year"  => $startYear,
    "end_year"    => $endYear
  ]);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => $e->getMessage()]);
}
