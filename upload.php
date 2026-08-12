<?php
// elista/upload.php (Unified: Core SSO + shared DB + planning cycles)
require __DIR__ . '/../core/auth.php';
require __DIR__ . '/../core/config.php';

header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');
error_reporting(E_ALL);

function fail(string $msg, int $code = 400): void {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg]);
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

  // Who can upload
  if (!in_array($role, ['responder'], true)) {
    fail('Not allowed.', 403);
  }

  $step_no = (int)($_POST['step_no'] ?? 0);
  $category = trim((string)($_POST['category'] ?? ''));
  $remarks = trim((string)($_POST['remarks'] ?? ''));
  $posted_cycle_id = (int)($_POST['cycle_id'] ?? 0);

  $allowedCategories = ['Social', 'Economic', 'Infrastructure', 'Environmental', 'Institutional'];
  if ($step_no < 1 || $step_no > 20) fail('Invalid step number.');
  if (!in_array($category, $allowedCategories, true)) fail('Invalid category.');

  if (!isset($_FILES['file']) || ($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    fail('No file uploaded (or upload error).');
  }

  // Strict extensions
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

  // Mime check (best-effort)
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

  // Use selected cycle if provided, otherwise fallback to active cycle
  if ($posted_cycle_id > 0) {
    $qCycle = $pdo->prepare("
      SELECT id, cycle_start, cycle_end, is_active
      FROM planning_cycles
      WHERE id = :id
      LIMIT 1
    ");
    $qCycle->execute([':id' => $posted_cycle_id]);
    $selectedCycle = $qCycle->fetch(PDO::FETCH_ASSOC);

    if (!$selectedCycle) {
      fail('Selected cycle not found.', 400);
    }

    $cycle_id = (int)$selectedCycle['id'];
    $cycle_start = (int)$selectedCycle['cycle_start'];
    $cycle_end = (int)$selectedCycle['cycle_end'];
  } else {
    $qCycle = $pdo->query("
      SELECT id, cycle_start, cycle_end
      FROM planning_cycles
      WHERE is_active = 1
      ORDER BY id DESC
      LIMIT 1
    ");
    $activeCycle = $qCycle->fetch(PDO::FETCH_ASSOC);

    if (!$activeCycle) {
      fail('No active cycle found.', 500);
    }

    $cycle_id = (int)$activeCycle['id'];
    $cycle_start = (int)$activeCycle['cycle_start'];
    $cycle_end = (int)$activeCycle['cycle_end'];
  }

  // Save file
  $baseDir = __DIR__ . '/uploads';
  $userDir = $baseDir . '/user_' . $user_id;

  if (!is_dir($baseDir) && !mkdir($baseDir, 0777, true)) {
    fail('Failed to create uploads directory.', 500);
  }
  if (!is_dir($userDir) && !mkdir($userDir, 0777, true)) {
    fail('Failed to create user directory.', 500);
  }

  $categorySafe = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $category));
  $extSafe = preg_replace('/[^a-z0-9]/', '', $ext);

  $filenameSafe = "step{$step_no}_{$categorySafe}_cycle{$cycle_id}_" . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . ".{$extSafe}";
  $destPath = $userDir . '/' . $filenameSafe;

  if (!move_uploaded_file($tmpPath, $destPath)) {
    fail('Failed to save file.', 500);
  }

  $publicPath = 'uploads/user_' . $user_id . '/' . $filenameSafe;

  $pdo->beginTransaction();

  try {
    // Check existing submission for THIS SAME CYCLE ONLY
    $sel = $pdo->prepare(
      'SELECT * 
       FROM submissions 
       WHERE user_id = :user_id
         AND step_no = :step_no
         AND category = :category
         AND cycle_id = :cycle_id
       LIMIT 1
       FOR UPDATE'
    );
    $sel->execute([
      ':user_id' => $user_id,
      ':step_no' => $step_no,
      ':category' => $category,
      ':cycle_id' => $cycle_id
    ]);
    $old = $sel->fetch(PDO::FETCH_ASSOC);

    // Archive previous version in history, if any
    if ($old) {
      $insHist = $pdo->prepare(
        'INSERT INTO submission_history (
            source_submission_id,
            user_id,
            municipality_id,
            cycle_id,
            step_no,
            category,
            status,
            file_name,
            file_path,
            uploaded_at,
            approved_at,
            revision_remarks,
            upload_remarks,
            archived_at
         ) VALUES (
            :source_submission_id,
            :user_id,
            :municipality_id,
            :cycle_id,
            :step_no,
            :category,
            :status,
            :file_name,
            :file_path,
            :uploaded_at,
            :approved_at,
            :revision_remarks,
            :upload_remarks,
            NOW()
         )'
      );

      $insHist->execute([
        ':source_submission_id' => $old['id'],
        ':user_id' => $old['user_id'],
        ':municipality_id' => $old['municipality_id'],
        ':cycle_id' => $old['cycle_id'],
        ':step_no' => $old['step_no'],
        ':category' => $old['category'],
        ':status' => $old['status'],
        ':file_name' => $old['file_name'],
        ':file_path' => $old['file_path'],
        ':uploaded_at' => $old['uploaded_at'],
        ':approved_at' => $old['approved_at'],
        ':revision_remarks' => $old['revision_remarks'],
        ':upload_remarks' => $old['upload_remarks'] ?? null,
      ]);

      // Update ONLY the record in the same cycle
      $upd = $pdo->prepare(
        "UPDATE submissions
         SET municipality_id = :municipality_id,
             status = 'pending',
             file_name = :file_name,
             file_path = :file_path,
             uploaded_at = NOW(),
             approved_at = NULL,
             revision_remarks = NULL,
             upload_remarks = :upload_remarks
         WHERE id = :id"
      );

      $upd->execute([
        ':municipality_id' => $municipality_id,
        ':file_name' => $originalName,
        ':file_path' => $publicPath,
        ':upload_remarks' => $remarks,
        ':id' => $old['id']
      ]);
    } else {
      // Insert brand new record for this cycle
      $ins = $pdo->prepare(
        "INSERT INTO submissions (
            user_id,
            municipality_id,
            cycle_id,
            step_no,
            category,
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
            :step_no,
            :category,
            'pending',
            :file_name,
            :file_path,
            NOW(),
            NULL,
            NULL,
            :upload_remarks
         )"
      );

      $ins->execute([
        ':user_id' => $user_id,
        ':municipality_id' => $municipality_id,
        ':cycle_id' => $cycle_id,
        ':step_no' => $step_no,
        ':category' => $category,
        ':file_name' => $originalName,
        ':file_path' => $publicPath,
        ':upload_remarks' => $remarks,
      ]);
    }

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

  // Notification
  $actorName = trim((string)($_SESSION['username'] ?? ''));
  if ($actorName === '') {
    $actorName = "User #{$user_id}";
  }

  $message = "{$actorName} uploaded a file: {$municipality_name} — Step {$step_no} ({$category}) [Cycle {$cycle_start}-{$cycle_end}]";

  $stmtNotif = $pdo->prepare(
    "INSERT INTO notifications (
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
        :step_number,
        :category,
        :cycle_id,
        :message,
        0,
        NOW()
     )"
  );

  $stmtNotif->execute([
    ':actor_user_id' => $user_id,
    ':actor_name' => $actorName,
    ':municipality' => $municipality_name,
    ':step_number' => $step_no,
    ':category' => $category,
    ':cycle_id' => $cycle_id,
    ':message' => $message,
  ]);

  echo json_encode([
    'ok' => true,
    'file_name' => $originalName,
    'file_path' => $publicPath,
    'status' => 'pending',
    'municipality' => $municipality_name,
    'municipality_id' => $municipality_id,
    'cycle_id' => $cycle_id,
    'cycle_start' => $cycle_start,
    'cycle_end' => $cycle_end,
    'upload_remarks' => $remarks
  ]);

} catch (Throwable $e) {
  fail('Server error: ' . $e->getMessage(), 500);
}