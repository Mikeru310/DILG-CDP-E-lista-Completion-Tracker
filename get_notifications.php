<?php
// elista/get_notifications.php (Unified)
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

header("Content-Type: application/json; charset=utf-8");

$role = strtolower(trim((string)($_SESSION['role'] ?? '')));
if ($role !== 'encoder') {
  http_response_code(403);
  echo json_encode(["ok" => false, "error" => "Forbidden"]);
  exit;
}

try {
  $stmt = $pdo->prepare("
    SELECT
      id,
      message,
      created_at,
      is_read,
      municipality,
      step_number,
      category,
      cycle_id
    FROM notifications
    WHERE recipient_role = 'ENCODER'
      AND is_read = 0
    ORDER BY created_at DESC
    LIMIT 20
  ");
  $stmt->execute();
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode([
    "ok" => true,
    "unread_count" => count($rows),
    "notifications" => $rows
  ]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => "Server error"]);
}