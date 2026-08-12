<?php
require __DIR__ . "/../core/auth.php";
require __DIR__ . "/../core/config.php";

header("Content-Type: application/json; charset=utf-8");

if (!isset($_SESSION["user_id"])) {
  http_response_code(401);
  echo json_encode([]);
  exit;
}

$user_id         = (int)$_SESSION["user_id"];
$cycle_id        = isset($_GET["cycle_id"]) ? (int)$_GET["cycle_id"] : 0;
$role            = strtolower(trim((string)($_SESSION["role"] ?? "")));
$municipality_id = (int)($_SESSION["municipality_id"] ?? 0);

// ── MLGOO: resolve municipality_id if missing from session ──────────────────
// Try 1: users table
if ($role === "mlgoo" && $municipality_id <= 0) {
  try {
    $q = $pdo->prepare("SELECT municipality_id FROM users WHERE id = ? LIMIT 1");
    $q->execute([$user_id]);
    $municipality_id = (int)($q->fetchColumn() ?: 0);
    if ($municipality_id > 0) {
      $_SESSION["municipality_id"] = $municipality_id;
    }
  } catch (Throwable $e) { /* column may not exist */ }
}

// Try 2: derive from the selected cycle
if ($role === "mlgoo" && $municipality_id <= 0 && $cycle_id > 0) {
  try {
    $q = $pdo->prepare("SELECT municipality_id FROM planning_cycles WHERE id = ? LIMIT 1");
    $q->execute([$cycle_id]);
    $municipality_id = (int)($q->fetchColumn() ?: 0);
    if ($municipality_id > 0) {
      $_SESSION["municipality_id"] = $municipality_id;
    }
  } catch (Throwable $e) { /* ignore */ }
}

$isMlgoo = ($role === "mlgoo" && $municipality_id > 0);

try {

  // ── MLGOO: read all submissions for the municipality ─────────────────────
  if ($isMlgoo) {

    // IMPORTANT: $cycleFilter is injected inside a subquery where the outer
    // alias `s` is NOT in scope. Use bare column name `cycle_id`, not `s.cycle_id`.
    $cycleFilter  = $cycle_id > 0 ? "AND cycle_id = :cycle_id1"   : "";
    $cycleFilter2 = $cycle_id > 0 ? "AND s.cycle_id = :cycle_id2" : "";

    $activeCycleJoin = $cycle_id <= 0
      ? "INNER JOIN (
           SELECT id FROM planning_cycles
           WHERE  is_active       = 1
             AND  municipality_id = :mid_ac
           ORDER  BY id DESC LIMIT 1
         ) active_cycle ON active_cycle.id = s.cycle_id"
      : "";

    $sql = "
      SELECT
        s.step_no,
        TRIM(s.category)                        AS category,
        CASE
          WHEN LOWER(s.status) = 'approved'   THEN 'approved'
          WHEN LOWER(s.status) = 'pending'    THEN 'pending'
          WHEN s.revision_remarks IS NOT NULL
           AND TRIM(s.revision_remarks) <> '' THEN 'with revisions'
          ELSE s.status
        END                                     AS status,
        s.file_name,
        s.file_path,
        s.revision_remarks,
        s.upload_remarks,
        s.uploaded_at,
        COALESCE(s.approved_at, s.updated_at)  AS reviewed_at,
        s.cycle_id,
        pc.cycle_start,
        pc.cycle_end
      FROM submissions s
      INNER JOIN planning_cycles pc ON pc.id = s.cycle_id
      {$activeCycleJoin}
      INNER JOIN (
        SELECT
          step_no,
          TRIM(category)    AS category,
          cycle_id,
          MAX(uploaded_at)  AS max_uploaded
        FROM   submissions
        WHERE  municipality_id = :mid1
        {$cycleFilter}
        GROUP  BY step_no, TRIM(category), cycle_id
      ) latest
        ON  latest.step_no      = s.step_no
        AND latest.category     = TRIM(s.category)
        AND latest.cycle_id     = s.cycle_id
        AND latest.max_uploaded = s.uploaded_at
      WHERE s.municipality_id = :mid2
      {$cycleFilter2}
      ORDER BY s.step_no ASC, TRIM(s.category) ASC
    ";

    $params = [":mid1" => $municipality_id, ":mid2" => $municipality_id];
    if ($cycle_id <= 0) {
      $params[":mid_ac"] = $municipality_id;
    } else {
      $params[":cycle_id1"] = $cycle_id;
      $params[":cycle_id2"] = $cycle_id;
    }

    $q = $pdo->prepare($sql);
    $q->execute($params);

  // ── Responder: specific cycle ─────────────────────────────────────────────
  } elseif ($cycle_id > 0) {
    $sql = "
      SELECT
        s.step_no,
        TRIM(s.category)                        AS category,
        CASE
          WHEN LOWER(s.status) = 'approved'   THEN 'approved'
          WHEN LOWER(s.status) = 'pending'    THEN 'pending'
          WHEN s.revision_remarks IS NOT NULL
           AND TRIM(s.revision_remarks) <> '' THEN 'with revisions'
          ELSE s.status
        END                                     AS status,
        s.file_name,
        s.file_path,
        s.revision_remarks,
        s.upload_remarks,
        s.uploaded_at,
        COALESCE(s.approved_at, s.updated_at)  AS reviewed_at,
        s.cycle_id,
        pc.cycle_start,
        pc.cycle_end
      FROM submissions s
      INNER JOIN planning_cycles pc ON pc.id = s.cycle_id
      INNER JOIN (
        SELECT
          step_no,
          TRIM(category)    AS category,
          cycle_id,
          MAX(uploaded_at)  AS max_uploaded
        FROM   submissions
        WHERE  user_id  = :uid1
          AND  cycle_id = :cycle_id1
        GROUP  BY step_no, TRIM(category), cycle_id
      ) latest
        ON  latest.step_no      = s.step_no
        AND latest.category     = TRIM(s.category)
        AND latest.cycle_id     = s.cycle_id
        AND latest.max_uploaded = s.uploaded_at
      WHERE s.user_id  = :uid2
        AND s.cycle_id = :cycle_id2
      ORDER BY s.step_no ASC, TRIM(s.category) ASC
    ";

    $q = $pdo->prepare($sql);
    $q->execute([
      ":uid1"      => $user_id,
      ":uid2"      => $user_id,
      ":cycle_id1" => $cycle_id,
      ":cycle_id2" => $cycle_id
    ]);

  // ── Responder: active cycle ───────────────────────────────────────────────
  } else {
    $sql = "
      SELECT
        s.step_no,
        TRIM(s.category)                        AS category,
        CASE
          WHEN LOWER(s.status) = 'approved'   THEN 'approved'
          WHEN LOWER(s.status) = 'pending'    THEN 'pending'
          WHEN s.revision_remarks IS NOT NULL
           AND TRIM(s.revision_remarks) <> '' THEN 'with revisions'
          ELSE s.status
        END                                     AS status,
        s.file_name,
        s.file_path,
        s.revision_remarks,
        s.upload_remarks,
        s.uploaded_at,
        COALESCE(s.approved_at, s.updated_at)  AS reviewed_at,
        s.cycle_id,
        pc.cycle_start,
        pc.cycle_end
      FROM submissions s
      INNER JOIN planning_cycles pc ON pc.id = s.cycle_id
      INNER JOIN (
        SELECT id FROM planning_cycles
        WHERE  is_active = 1
        ORDER  BY id DESC LIMIT 1
      ) active_cycle ON active_cycle.id = s.cycle_id
      INNER JOIN (
        SELECT
          step_no,
          TRIM(category)    AS category,
          cycle_id,
          MAX(uploaded_at)  AS max_uploaded
        FROM   submissions
        WHERE  user_id = :uid1
        GROUP  BY step_no, TRIM(category), cycle_id
      ) latest
        ON  latest.step_no      = s.step_no
        AND latest.category     = TRIM(s.category)
        AND latest.cycle_id     = s.cycle_id
        AND latest.max_uploaded = s.uploaded_at
      WHERE s.user_id = :uid2
      ORDER BY s.step_no ASC, TRIM(s.category) ASC
    ";

    $q = $pdo->prepare($sql);
    $q->execute([":uid1" => $user_id, ":uid2" => $user_id]);
  }

  echo json_encode($q->fetchAll(PDO::FETCH_ASSOC));

} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode([
    "error"   => "Database query failed",
    "message" => $e->getMessage()
  ]);
}