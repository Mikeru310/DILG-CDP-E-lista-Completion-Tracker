<?php
require __DIR__ . "/../core/auth.php";
require __DIR__ . "/../core/config.php";

header("Content-Type: application/json; charset=utf-8");

if (!isset($_SESSION["user_id"])) {
  http_response_code(401);
  echo json_encode(["submitted" => false]);
  exit;
}

$user_id  = (int)$_SESSION["user_id"];
$cycle_id = isset($_GET["cycle_id"]) ? (int)$_GET["cycle_id"] : 0;

try {
  if ($cycle_id > 0) {
    $q = $pdo->prepare("
      SELECT status, file_name, file_path, uploaded_at, approved_at, upload_remarks, revision_remarks
      FROM final_form_submissions
      WHERE user_id  = :uid
        AND cycle_id = :cid
      ORDER BY uploaded_at DESC
      LIMIT 1
    ");
    $q->execute([":uid" => $user_id, ":cid" => $cycle_id]);
  } else {
    $q = $pdo->prepare("
      SELECT ffs.status, ffs.file_name, ffs.file_path, ffs.uploaded_at, ffs.approved_at, ffs.upload_remarks, ffs.revision_remarks
      FROM final_form_submissions ffs
      INNER JOIN (
        SELECT id FROM planning_cycles
        WHERE is_active = 1
        ORDER BY id DESC
        LIMIT 1
      ) ac ON ac.id = ffs.cycle_id
      WHERE ffs.user_id = :uid
      ORDER BY ffs.uploaded_at DESC
      LIMIT 1
    ");
    $q->execute([":uid" => $user_id]);
  }

  $row = $q->fetch(PDO::FETCH_ASSOC);

  if ($row) {
    echo json_encode([
      "submitted"        => true,
      "status"           => strtolower(trim($row["status"])),
      "file_name"        => $row["file_name"],
      "file_path"        => $row["file_path"],
      "uploaded_at"      => $row["uploaded_at"],
      "approved_at"      => $row["approved_at"],
      "upload_remarks"   => $row["upload_remarks"],
      "revision_remarks" => $row["revision_remarks"]
    ]);
  } else {
    echo json_encode(["submitted" => false]);
  }
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(["submitted" => false, "error" => $e->getMessage()]);
}
