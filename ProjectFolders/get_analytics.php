<?php
// elista/get_analytics.php (Unified: Core SSO + DILG8888 DB)
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

header("Content-Type: application/json; charset=utf-8");

$role = strtolower(trim((string)($_SESSION['role'] ?? '')));
if ($role !== 'encoder') {
  http_response_code(403);
  echo json_encode(["ok" => false, "error" => "Forbidden"]);
  exit;
}

$selectedMunicipalityId = isset($_GET['municipality_id']) ? (int)$_GET['municipality_id'] : 0;
$selectedCycleId        = isset($_GET['cycle_id']) ? (int)$_GET['cycle_id'] : 0;

// Always fetch all municipalities for the filter list
$munis = $pdo->query("
  SELECT id AS municipal_id, name
  FROM municipalities
  ORDER BY name ASC
")->fetchAll(PDO::FETCH_ASSOC);

if ($selectedCycleId <= 0) {
  // ── All Cycles: aggregate latest submission per municipality + step + category
  //    across every cycle the LGU has (no cycle_id filter applied).
  $sql = "
    SELECT
      m.id AS municipal_id,
      m.name AS municipality,
      COALESCE(SUM(CASE WHEN x.status_norm = 'approved'     THEN 1 ELSE 0 END), 0) AS reviewed,
      COALESCE(SUM(CASE WHEN x.status_norm = 'pending'      THEN 1 ELSE 0 END), 0) AS pending,
      COALESCE(SUM(CASE WHEN x.status_norm = 'for revision' THEN 1 ELSE 0 END), 0) AS for_revision
    FROM municipalities m
    LEFT JOIN (
      SELECT
        s.municipality_id,
        s.step_no,
        TRIM(s.category) AS category,
        CASE
          WHEN LOWER(TRIM(COALESCE(s.status, ''))) = 'approved' THEN 'approved'
          WHEN LOWER(TRIM(COALESCE(s.status, ''))) = 'pending'  THEN 'pending'
          WHEN LOWER(TRIM(COALESCE(s.status, ''))) IN (
            'with revisions','with revision','with_revision','with-revision',
            'revision','revisions','needs revision','needs revisions',
            'for revision','for_revision','for-revision',
            'rejected'
          ) THEN 'for revision'
          WHEN s.revision_remarks IS NOT NULL AND TRIM(s.revision_remarks) <> '' THEN 'for revision'
          ELSE 'pending'
        END AS status_norm
      FROM submissions s
      INNER JOIN (
        SELECT
          municipality_id,
          step_no,
          TRIM(category) AS category,
          MAX(uploaded_at) AS max_uploaded
        FROM submissions
        GROUP BY municipality_id, step_no, TRIM(category)
      ) latest
        ON latest.municipality_id = s.municipality_id
       AND latest.step_no         = s.step_no
       AND latest.category        = TRIM(s.category)
       AND latest.max_uploaded    = s.uploaded_at
    ) x
      ON x.municipality_id = m.id
    GROUP BY m.id, m.name
    ORDER BY m.name ASC
  ";

  $stmt = $pdo->query($sql);

} else {
  // ── Single Cycle: aggregate latest submission per municipality + step + category
  //    scoped to the selected cycle only.
  $sql = "
    SELECT
      m.id AS municipal_id,
      m.name AS municipality,
      COALESCE(SUM(CASE WHEN x.status_norm = 'approved'     THEN 1 ELSE 0 END), 0) AS reviewed,
      COALESCE(SUM(CASE WHEN x.status_norm = 'pending'      THEN 1 ELSE 0 END), 0) AS pending,
      COALESCE(SUM(CASE WHEN x.status_norm = 'for revision' THEN 1 ELSE 0 END), 0) AS for_revision
    FROM municipalities m
    LEFT JOIN (
      SELECT
        s.municipality_id,
        s.step_no,
        TRIM(s.category) AS category,
        CASE
          WHEN LOWER(TRIM(COALESCE(s.status, ''))) = 'approved' THEN 'approved'
          WHEN LOWER(TRIM(COALESCE(s.status, ''))) = 'pending'  THEN 'pending'
          WHEN LOWER(TRIM(COALESCE(s.status, ''))) IN (
            'with revisions','with revision','with_revision','with-revision',
            'revision','revisions','needs revision','needs revisions',
            'for revision','for_revision','for-revision',
            'rejected'
          ) THEN 'for revision'
          WHEN s.revision_remarks IS NOT NULL AND TRIM(s.revision_remarks) <> '' THEN 'for revision'
          ELSE 'pending'
        END AS status_norm
      FROM submissions s
      INNER JOIN (
        SELECT
          municipality_id,
          step_no,
          TRIM(category) AS category,
          MAX(uploaded_at) AS max_uploaded
        FROM submissions
        WHERE cycle_id = :cycle_id_inner
        GROUP BY municipality_id, step_no, TRIM(category)
      ) latest
        ON latest.municipality_id = s.municipality_id
       AND latest.step_no         = s.step_no
       AND latest.category        = TRIM(s.category)
       AND latest.max_uploaded    = s.uploaded_at
      WHERE s.cycle_id = :cycle_id_outer
    ) x
      ON x.municipality_id = m.id
    GROUP BY m.id, m.name
    ORDER BY m.name ASC
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->execute([
    ":cycle_id_inner" => $selectedCycleId,
    ":cycle_id_outer" => $selectedCycleId
  ]);
}

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if ($selectedMunicipalityId > 0) {
  $rows = array_values(array_filter(
    $rows,
    fn($r) => (int)$r['municipal_id'] === $selectedMunicipalityId
  ));
}

echo json_encode([
  "ok"                => true,
  "rows"              => $rows,
  "municipalities"    => $munis,
  "selected_id"       => $selectedMunicipalityId,
  "selected_cycle_id" => $selectedCycleId
]);
