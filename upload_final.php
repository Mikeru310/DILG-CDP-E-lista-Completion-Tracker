<?php
// elista/upload_final.php
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');
error_reporting(E_ALL);

function fail(string $msg, int $code = 400): void {
  http_response_code($code);
  echo json_encode([
    'ok' => false,
    'error' => $msg
  ]);
  exit;
}

try {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed.', 405);
  }

  $user_id = (int)($_SESSION['user_id'] ?? 0);
  $role = strtolower(trim((string)($_SESSION['role'] ?? '')));
  $municipality_id = (int)($_SESSION['municipality_id'] ?? 0);

  if ($user_id <= 0) fail('Not logged in.', 401);
  if ($municipality_id <= 0) fail('User has no municipality assigned.', 400);

  // Only responder can submit final form
  if (!in_array($role, ['responder'], true)) {
    fail('Not allowed.', 403);
  }

  $remarks = trim((string)($_POST['remarks'] ?? ''));
  $posted_cycle_id = (int)($_POST['cycle_id'] ?? 0);

  if (!isset($_FILES['file']) || ($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    fail('No final form file uploaded (or upload error).');
  }

  $originalName = (string)($_FILES['file']['name'] ?? '');
  $tmpPath = (string)($_FILES['file']['tmp_name'] ?? '');

  if ($originalName === '' || $tmpPath === '') {
    fail('Invalid uploaded file.');
  }

  $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
  $allowedExts = ['pdf', 'docx', 'txt'];

  if (!in_array($ext, $allowedExts, true)) {
    fail('Only PDF, DOCX, and TXT files are allowed.');
  }

  $allowedMimes = [
    'pdf' => ['application/pdf'],
    'docx' => [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip'
    ],
    'txt' => ['text/plain', 'application/octet-stream']
  ];

  $mime = null;
  if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
      $mime = finfo_file($finfo, $tmpPath);
      finfo_close($finfo);
    }
  }

  if ($mime && !in_array($mime, $allowedMimes[$ext], true)) {
    fail('Invalid file type. Only PDF, DOCX, and TXT are allowed.');
  }

  // Municipality name
  $qM = $pdo->prepare('SELECT name FROM municipalities WHERE id = :id LIMIT 1');
  $qM->execute([':id' => $municipality_id]);
  $municipality_name = trim((string)($qM->fetchColumn() ?? ''));
  if ($municipality_name === '') {
    $municipality_name = "Municipality #{$municipality_id}";
  }

  // Resolve cycle
  if ($posted_cycle_id > 0) {
    $qCycle = $pdo->prepare("
      SELECT id, cycle_start, cycle_end, municipality_id
      FROM planning_cycles
      WHERE id = :id
      LIMIT 1
    ");
    $qCycle->execute([':id' => $posted_cycle_id]);
    $selectedCycle = $qCycle->fetch(PDO::FETCH_ASSOC);

    if (!$selectedCycle) {
      fail('Selected cycle not found.', 400);
    }

    if ((int)$selectedCycle['municipality_id'] !== $municipality_id) {
      fail('Selected cycle does not belong to your municipality.', 403);
    }

    $cycle_id = (int)$selectedCycle['id'];
    $cycle_start = (int)$selectedCycle['cycle_start'];
    $cycle_end = (int)$selectedCycle['cycle_end'];
  } else {
    $qCycle = $pdo->prepare("
      SELECT id, cycle_start, cycle_end
      FROM planning_cycles
      WHERE is_active = 1
        AND municipality_id = :municipality_id
      ORDER BY id DESC
      LIMIT 1
    ");
    $qCycle->execute([':municipality_id' => $municipality_id]);
    $activeCycle = $qCycle->fetch(PDO::FETCH_ASSOC);

    if (!$activeCycle) {
      fail('No active cycle found for this municipality.', 500);
    }

    $cycle_id = (int)$activeCycle['id'];
    $cycle_start = (int)$activeCycle['cycle_start'];
    $cycle_end = (int)$activeCycle['cycle_end'];
  }

  // Save physical file
  $baseDir = __DIR__ . '/uploads';
  $userDir = $baseDir . '/user_' . $user_id;

  if (!is_dir($baseDir) && !mkdir($baseDir, 0777, true)) {
    fail('Failed to create uploads directory.', 500);
  }

  if (!is_dir($userDir) && !mkdir($userDir, 0777, true)) {
    fail('Failed to create user directory.', 500);
  }

  $extSafe = preg_replace('/[^a-z0-9]/', '', $ext);
  $filenameSafe = "final_form_cycle{$cycle_id}_" . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . ".{$extSafe}";
  $destPath = $userDir . '/' . $filenameSafe;

  if (!move_uploaded_file($tmpPath, $destPath)) {
    fail('Failed to save final form file.', 500);
  }

  $publicPath = 'uploads/user_' . $user_id . '/' . $filenameSafe;

  $pdo->beginTransaction();

  try {
    // Make sure table exists in DB before using this file.
    // Table name used here: final_form_submissions

    $sel = $pdo->prepare("
      SELECT *
      FROM final_form_submissions
      WHERE user_id = :user_id
        AND municipality_id = :municipality_id
        AND cycle_id = :cycle_id
      LIMIT 1
      FOR UPDATE
    ");
    $sel->execute([
      ':user_id' => $user_id,
      ':municipality_id' => $municipality_id,
      ':cycle_id' => $cycle_id
    ]);
    $old = $sel->fetch(PDO::FETCH_ASSOC);

    if ($old) {
      $upd = $pdo->prepare("
        UPDATE final_form_submissions
        SET
          file_name = :file_name,
          file_path = :file_path,
          status = 'pending',
          uploaded_at = NOW(),
          approved_at = NULL,
          revision_remarks = NULL,
          upload_remarks = :upload_remarks
        WHERE id = :id
      ");

      $upd->execute([
        ':file_name' => $originalName,
        ':file_path' => $publicPath,
        ':upload_remarks' => $remarks,
        ':id' => $old['id']
      ]);
    } else {
      $ins = $pdo->prepare("
        INSERT INTO final_form_submissions (
          user_id,
          municipality_id,
          cycle_id,
          status,
          file_name,
          file_path,
          uploaded_at,
          approved_at,
          revision_remarks,
          upload_remarks
        ) VALUES (
          :user_id,
          :municipality_id,
          :cycle_id,
          'pending',
          :file_name,
          :file_path,
          NOW(),
          NULL,
          NULL,
          :upload_remarks
        )
      ");

      $ins->execute([
        ':user_id' => $user_id,
        ':municipality_id' => $municipality_id,
        ':cycle_id' => $cycle_id,
        ':file_name' => $originalName,
        ':file_path' => $publicPath,
        ':upload_remarks' => $remarks
      ]);
    }

    // Optional notification
    $actorName = trim((string)($_SESSION['username'] ?? $_SESSION['name'] ?? ''));
    if ($actorName === '') {
      $actorName = "User #{$user_id}";
    }

    $message = "{$actorName} submitted the Final Form: {$municipality_name} [Cycle {$cycle_start}-{$cycle_end}]";

    $stmtNotif = $pdo->prepare("
      INSERT INTO notifications (
        recipient_role,
        actor_user_id,
        actor_name,
        municipality,
        step_number,
        category,
        cycle_id,
        message,
        is_read,
        created_at
      ) VALUES (
        'ENCODER',
        :actor_user_id,
        :actor_name,
        :municipality,
        0,
        'Final Form',
        :cycle_id,
        :message,
        0,
        NOW()
      )
    ");

    $stmtNotif->execute([
      ':actor_user_id' => $user_id,
      ':actor_name' => $actorName,
      ':municipality' => $municipality_name,
      ':cycle_id' => $cycle_id,
      ':message' => $message
    ]);

    $pdo->commit();
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }

    if (is_file($destPath)) {
      @unlink($destPath);
    }

    throw $e;
  }

  echo json_encode([
    'ok' => true,
    'status' => 'pending',
    'file_name' => $originalName,
    'file_path' => $publicPath,
    'uploaded_at' => date('Y-m-d H:i:s'),
    'upload_remarks' => $remarks,
    'cycle_id' => $cycle_id,
    'cycle_start' => $cycle_start,
    'cycle_end' => $cycle_end,
    'municipality' => $municipality_name,
    'municipality_id' => $municipality_id
  ]);
} catch (Throwable $e) {
  fail('Server error: ' . $e->getMessage(), 500);
}