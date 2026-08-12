<?php
// elista/load_fp.php (Unified: Core SSO + DILG8888 DB)
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

header("Content-Type: application/json; charset=utf-8");

$role = strtolower(trim((string)($_SESSION['role'] ?? '')));

$muni_id = 0;

// LGU/MLGOO are locked to their own municipality
if (in_array($role, ['responder', 'mlgoo'], true)) {
  $muni_id = (int)($_SESSION['municipality_id'] ?? 0);
} else {
  // Encoder can load any municipality by name
  $municipality = trim((string)($_GET["municipality"] ?? ""));
  if ($municipality !== "") {
    // municipalities table uses `id` in your current schema
    $q = $pdo->prepare("SELECT id FROM municipalities WHERE LOWER(name)=LOWER(:n) LIMIT 1");
    $q->execute([":n" => $municipality]);
    $muni_id = (int)($q->fetchColumn() ?? 0);
  }
}

if ($muni_id <= 0) {
  echo json_encode([]);
  exit;
}

// Optional cycle filter — 0 means fall back to active cycle
$cycle_id = (int)($_GET["cycle_id"] ?? 0);

if ($cycle_id <= 0) {
  $qc = $pdo->query("SELECT id FROM planning_cycles WHERE is_active = 1 ORDER BY id DESC LIMIT 1");
  $cycle_id = (int)($qc->fetchColumn() ?? 0);
}

/*
  IMPORTANT:
  FP_script.js expects fields:
    - step_number
    - category
    - status
    - approved_at
  (It does NOT read step_no.)
*/
if ($cycle_id > 0) {
  // Cycle-scoped: latest upload per step+category within this cycle
  $stmt = $pdo->prepare("
    SELECT
      s.step_no AS step_number,
      s.category,
      s.status,
      s.approved_at
    FROM submissions s
    INNER JOIN (
      SELECT step_no, category, MAX(uploaded_at) AS max_up
      FROM submissions
      WHERE municipality_id = :mid1
        AND cycle_id = :cid1
      GROUP BY step_no, category
    ) t
      ON t.step_no    = s.step_no
     AND t.category   = s.category
     AND t.max_up     = s.uploaded_at
    WHERE s.municipality_id = :mid2
      AND s.cycle_id = :cid2
  ");
  $stmt->execute([":mid1" => $muni_id, ":cid1" => $cycle_id, ":mid2" => $muni_id, ":cid2" => $cycle_id]);
} else {
  // No cycle found at all — return empty
  echo json_encode([]);
  exit;
}

$map = [
  "Social" => "social",
  "Economic" => "economic",
  "Infrastructure" => "infrastructure",
  "Environmental" => "environmental",
  // backend uses "individual" key; UI converts it to "institutional"
  "Institutional" => "individual"
];

$out = [];
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
  $catKey = $map[$r["category"]] ?? strtolower(trim((string)$r["category"]));
  $out[] = [
    "step_number" => (int)$r["step_number"],
    "category" => $catKey,
    "status" => $r["status"],
    "approved_at" => $r["approved_at"],
  ];
}

echo json_encode($out);