<?php
// elista/mark_notification_read.php
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

header("Content-Type: application/json; charset=utf-8");

$role = strtolower(trim((string)($_SESSION['role'] ?? '')));
if ($role !== 'encoder') {
  http_response_code(403);
  echo json_encode(["ok" => false, "error" => "Forbidden"]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(["ok" => false, "error" => "Method not allowed"]);
  exit;
}

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body)) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Invalid JSON"]);
  exit;
}

try {
  // ── Mark ALL unread notifications read ──
  if (!empty($body['mark_all'])) {
    $stmt = $pdo->prepare("
      UPDATE notifications
      SET is_read = 1
      WHERE recipient_role = 'ENCODER'
        AND is_read = 0
    ");
    $stmt->execute();

    echo json_encode([
      "ok"           => true,
      "updated"      => $stmt->rowCount(),
      "unread_count" => 0
    ]);
    exit;
  }

  // ── Mark a single notification read by ID ──
  $id = (int)($body['id'] ?? 0);
  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Missing or invalid id"]);
    exit;
  }

  $stmt = $pdo->prepare("
    UPDATE notifications
    SET is_read = 1
    WHERE id = :id
      AND recipient_role = 'ENCODER'
  ");
  $stmt->execute([':id' => $id]);

  // Return fresh unread count
  $countStmt = $pdo->query("
    SELECT COUNT(*) FROM notifications
    WHERE recipient_role = 'ENCODER'
      AND is_read = 0
  ");
  $unread = (int)($countStmt->fetchColumn() ?? 0);

  echo json_encode([
    "ok"           => true,
    "updated"      => $stmt->rowCount(),
    "unread_count" => $unread
  ]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => "Server error"]);
}
