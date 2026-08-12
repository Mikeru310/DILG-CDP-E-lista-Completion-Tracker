<?php
// elista/save_fp.php (Unified: Core SSO + DILG8888 DB)
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
if ($role !== 'encoder') {
  http_response_code(403);
  echo json_encode(["ok" => false, "error" => "Forbidden"]);
  exit;
}

$body = json_decode(file_get_contents("php://input"), true);
if (!$body) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Invalid JSON"]);
  exit;
}

$municipality = trim((string)($body["municipality"] ?? ""));
$step         = (int)($body["step"] ?? 0);
$category     = trim((string)($body["category"] ?? ""));
$action       = trim((string)($body["action"] ?? ""));
$remarks      = trim((string)($body["remarks"] ?? ""));
$cycle_id     = (int)($body["cycle_id"] ?? 0);

if (
  $municipality === "" ||
  $step < 1 || $step > 20 ||
  $category === "" ||
  $cycle_id <= 0 ||
  !in_array($action, ["approve", "reject", "remark"], true)
) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Bad input"]);
  exit;
}

if ($action === "reject" && $remarks === "") {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Remarks are required for rejection."]);
  exit;
}

// name -> municipalities.(id|municipal_id)
$mid = muni_id_from_name($pdo, $municipality);
if ($mid <= 0) {
  http_response_code(404);
  echo json_encode(["ok" => false, "error" => "Municipality not found"]);
  exit;
}

// FP -> DB category
$mapBack = [
  "social" => "Social",
  "economic" => "Economic",
  "infrastructure" => "Infrastructure",
  "environmental" => "Environmental",
  // legacy/typo tolerance
  "individual" => "Institutional",
  "institutional" => "Institutional"
];
$dbCat = $mapBack[strtolower($category)] ?? null;

if (!$dbCat) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Unknown category"]);
  exit;
}

$updated = 0;
$newStatus = "";

try {
  $pdo->beginTransaction();

  if ($action === "remark") {
    $u = $pdo->prepare("
      UPDATE submissions
      SET revision_remarks = :rmk
      WHERE municipality_id = :mid
        AND step_no = :step
        AND category = :cat
        AND cycle_id = :cycle_id
    ");
    $u->execute([
      ":rmk"      => ($remarks === "" ? null : $remarks),
      ":mid"      => $mid,
      ":step"     => $step,
      ":cat"      => $dbCat,
      ":cycle_id" => $cycle_id
    ]);
    $updated = $u->rowCount();

    $s = $pdo->prepare("
      SELECT status
      FROM submissions
      WHERE municipality_id = :mid
        AND step_no = :step
        AND category = :cat
        AND cycle_id = :cycle_id
      LIMIT 1
    ");
    $s->execute([
      ":mid" => $mid,
      ":step" => $step,
      ":cat" => $dbCat,
      ":cycle_id" => $cycle_id
    ]);
    $newStatus = (string)($s->fetchColumn() ?? "");

  } else {
    $newStatus = ($action === "approve") ? "approved" : "rejected";

    if ($action === "approve") {
      if ($remarks !== "") {
        $u = $pdo->prepare("
          UPDATE submissions
          SET status = :st,
              revision_remarks = :rmk,
              approved_at = NOW()
          WHERE municipality_id = :mid
            AND step_no = :step
            AND category = :cat
            AND cycle_id = :cycle_id
        ");
        $u->execute([
          ":st"       => $newStatus,
          ":rmk"      => $remarks,
          ":mid"      => $mid,
          ":step"     => $step,
          ":cat"      => $dbCat,
          ":cycle_id" => $cycle_id
        ]);
      } else {
        $u = $pdo->prepare("
          UPDATE submissions
          SET status = :st,
              approved_at = NOW()
          WHERE municipality_id = :mid
            AND step_no = :step
            AND category = :cat
            AND cycle_id = :cycle_id
        ");
        $u->execute([
          ":st"       => $newStatus,
          ":mid"      => $mid,
          ":step"     => $step,
          ":cat"      => $dbCat,
          ":cycle_id" => $cycle_id
        ]);
      }

      $updated = $u->rowCount();

    } else {
      $u = $pdo->prepare("
        UPDATE submissions
        SET status = :st,
            revision_remarks = :rmk,
            approved_at = NULL
        WHERE municipality_id = :mid
          AND step_no = :step
          AND category = :cat
          AND cycle_id = :cycle_id
      ");
      $u->execute([
        ":st"       => $newStatus,
        ":rmk"      => $remarks,
        ":mid"      => $mid,
        ":step"     => $step,
        ":cat"      => $dbCat,
        ":cycle_id" => $cycle_id
      ]);
      $updated = $u->rowCount();
    }
  }

  // Auto-clear matching unread upload notifications after verdict/remark
  if ($updated > 0) {
    $clearNotif = $pdo->prepare("
      UPDATE notifications
      SET is_read = 1
      WHERE recipient_role = 'ENCODER'
        AND is_read = 0
        AND municipality = :municipality
        AND step_number = :step_number
        AND category = :category
        AND cycle_id = :cycle_id
    ");
    $clearNotif->execute([
      ":municipality" => $municipality,
      ":step_number"  => $step,
      ":category"     => $dbCat,
      ":cycle_id"     => $cycle_id
    ]);
  }

  $pdo->commit();

  echo json_encode([
    "ok" => true,
    "status" => $newStatus,
    "updated" => $updated
  ]);

} catch (Throwable $e) {
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }

  http_response_code(500);
  echo json_encode([
    "ok" => false,
    "error" => "Server error: " . $e->getMessage()
  ]);
}