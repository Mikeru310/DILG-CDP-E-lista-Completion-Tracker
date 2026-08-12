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

// If the session is missing municipality_id (common for mlgoo accounts),
// fall back to the users table so they still see their LGU's cycles.
if ($municipalityId <= 0 && $role !== "encoder") {
  $qUser = $pdo->prepare("SELECT municipality_id FROM users WHERE id = ? LIMIT 1");
  $qUser->execute([(int)($_SESSION["user_id"] ?? 0)]);
  $municipalityId = (int)($qUser->fetchColumn() ?: 0);
}

try {
  // ------------------------------------------------------------------
  // Encoders can optionally filter by a specific municipality_id passed
  // as a query param (e.g. ?municipality_id=3).  When no param is given
  // they receive ALL cycles across every municipality (admin overview).
  //
  // mlgoo / responder only ever see their own municipality's cycles.
  // ------------------------------------------------------------------
  if ($role === "encoder") {
    $filterMuni = (int)($_GET["municipality_id"] ?? 0);

    if ($filterMuni > 0) {
      $q = $pdo->prepare("
        SELECT
          pc.id,
          pc.municipality_id,
          m.name  AS municipality_name,
          pc.cycle_start,
          pc.cycle_end,
          pc.start_year,
          pc.end_year,
          pc.is_active,
          CASE
            WHEN YEAR(CURDATE()) > pc.end_year THEN 1
            ELSE 0
          END AS is_expired
        FROM  planning_cycles pc
        LEFT  JOIN municipalities m ON m.id = pc.municipality_id
        WHERE pc.municipality_id = ?
        ORDER BY pc.cycle_start DESC, pc.cycle_end DESC, pc.id DESC
      ");
      $q->execute([$filterMuni]);
    } else {
      // All municipalities — useful for the encoder's admin dashboard
      $q = $pdo->query("
        SELECT
          pc.id,
          pc.municipality_id,
          m.name  AS municipality_name,
          pc.cycle_start,
          pc.cycle_end,
          pc.start_year,
          pc.end_year,
          pc.is_active,
          CASE
            WHEN YEAR(CURDATE()) > pc.end_year THEN 1
            ELSE 0
          END AS is_expired
        FROM  planning_cycles pc
        LEFT  JOIN municipalities m ON m.id = pc.municipality_id
        ORDER BY pc.cycle_start DESC, pc.cycle_end DESC, pc.id DESC
      ");
    }
  } else {
    // mlgoo / responder — their municipality only
    if ($municipalityId <= 0) {
      echo json_encode(["ok" => true, "cycles" => []]);
      exit;
    }

    $q = $pdo->prepare("
      SELECT
        pc.id,
        pc.municipality_id,
        m.name  AS municipality_name,
        pc.cycle_start,
        pc.cycle_end,
        pc.start_year,
        pc.end_year,
        pc.is_active,
        CASE
          WHEN YEAR(CURDATE()) > pc.end_year THEN 1
          ELSE 0
        END AS is_expired
      FROM  planning_cycles pc
      LEFT  JOIN municipalities m ON m.id = pc.municipality_id
      WHERE pc.municipality_id = ?
      ORDER BY pc.cycle_start DESC, pc.cycle_end DESC, pc.id DESC
    ");
    $q->execute([$municipalityId]);
  }

  echo json_encode([
    "ok"     => true,
    "cycles" => $q->fetchAll(PDO::FETCH_ASSOC)
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => $e->getMessage()]);
}