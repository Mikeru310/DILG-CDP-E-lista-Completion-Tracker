<?php
require __DIR__ . "/../core/auth.php";
require __DIR__ . "/../core/config.php";

// ✅ Unified auth/session values come from Core
$role = strtolower(trim((string)($_SESSION['role'] ?? '')));
if (!in_array($role, ['responder', 'mlgoo'], true)) {
  header('Location: /core/portal.php');
  exit;
}

$isMlgoo = ($role === 'mlgoo');
$username = $_SESSION['username'] ?? ($_SESSION['name'] ?? 'User');

$municipalityName = 'Not Assigned';
$municipalityId = (int)($_SESSION['municipality_id'] ?? 0);
if ($municipalityId > 0) {
  $q = $pdo->prepare('SELECT name FROM municipalities WHERE id = ? LIMIT 1');
  $q->execute([$municipalityId]);
  $municipalityName = (string)($q->fetchColumn() ?? $municipalityName);
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Overview Progress of Completion</title>

  <link rel="stylesheet" href="style.css">

  <!-- ✅ Needed for DOCX preview inside modal -->
  <script src="https://unpkg.com/mammoth/mammoth.browser.min.js"></script>
  <script>window.MLGOO_MODE = <?php echo $isMlgoo ? 'true' : 'false'; ?>;</script>
</head>

<body>

<div class="layout">
  <!-- SIDEBAR -->
 <aside class="sidebar">
  <div class="sidebar-title">Menu</div>

  <div class="cycle-filter-wrap" id="cycleFilterWrap">
  <button class="cycle-filter-btn" id="cycleFilterBtn" type="button">
    <span class="cycle-filter-label">Cycle:</span>
    <span id="activeCycleLabel">Loading...</span>
    <span class="cycle-caret">▾</span>
  </button>

  <div class="cycle-filter-dropdown hidden" id="cycleFilterDropdown">
    <div class="cycle-filter-header">Select Cycle</div>
    <div id="cycleFilterList" class="cycle-filter-list">
      <div class="cycle-filter-empty">Loading cycles...</div>
    </div>
  </div>
</div>

  <button class="sidebar-btn" onclick="location.href='forms.php'">
    Forms
  </button>

  <button class="sidebar-btn" onclick="location.href='references.php'">
    References
  </button>

  <button class="sidebar-btn final-form-btn locked<?php echo $isMlgoo ? ' hidden' : ''; ?>" id="finalFormBtn" type="button" <?php echo $isMlgoo ? 'style="display:none"' : 'disabled'; ?> title="All forms must be approved before submitting the Final Form">
    📋 Final Form
  </button>

  <button class="sidebar-btn" id="createCycleBtn" type="button"<?php echo $isMlgoo ? ' style="display:none"' : ''; ?>>
    ➕ New Cycle
  </button>

  <form style="margin:0;">
    <button type="button" onclick="window.close();" class="sidebar-btn logout">
      Close
    </button>
  </form>
</aside>

  <!-- MAIN CONTENT -->
  <main class="main-content">

    <!-- ✅ TOP BAR (Welcome center + Municipality right) -->
    <div class="topbar">
      <div class="topbar-left"></div>

      <div class="topbar-center">
        Welcome, <strong><?php echo htmlspecialchars($username); ?></strong>
      </div>

      <div class="topbar-right">
        <span class="topbar-municipality">Municipality: <strong><?php echo htmlspecialchars($municipalityName); ?></strong></span>
        <div class="notif-wrap" id="notifWrap">
          <button class="notif-bell" id="notifBell" type="button" aria-label="Notifications">
            🔔
            <span class="notif-badge hidden" id="notifBadge">0</span>
          </button>
          <div class="notif-dropdown hidden" id="notifDropdown">
            <div class="notif-dropdown-header">
              <span>Notifications</span>
              <button type="button" class="notif-mark-all" id="notifMarkAll">Mark all read</button>
            </div>
            <div class="notif-list" id="notifList">
              <div class="notif-empty">No new notifications</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page">

      <!-- TOP -->
      <div class="top">
        <div class="panel">
          <div class="title">Overview Progress of Completion</div>
          <div class="pieWrap">
            <div class="progress-ring-container">
              <svg class="progress-ring-svg" width="220" height="220" viewBox="0 0 220 220">
                <circle class="progress-ring-bg" cx="110" cy="110" r="91"/>
                <circle class="progress-ring-fill" id="progressRingFill" cx="110" cy="110" r="91"
                  stroke-dasharray="571.77"
                  stroke-dashoffset="571.77"/>
              </svg>
              <div class="progress-ring-text" id="ringPercent">0%</div>
            </div>
          </div>
        </div>

        <div class="panel percentBox">
          <div class="center">
            <div class="percent" id="overallPercent">0%</div>
            <div class="percentLabel">Percentage of Completion</div>
            <div class="smallNote" id="overallNote">0 of 100 uploads</div>
          </div>
        </div>
      </div>

      <!-- STEPS -->
      <div id="stepsContainer"></div>

    </div>

    <!-- ✅ Your main script (uses mammoth if DOCX is opened) -->
    <script src="script.js"></script>
  </main>
</div>

</body>
</html>
