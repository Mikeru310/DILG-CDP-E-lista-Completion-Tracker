<?php
require __DIR__ . "/../core/auth.php";
require __DIR__ . "/../core/config.php";

/* ✅ role + session variables */
$role = strtolower(trim((string)($_SESSION["role"] ?? "")));
if ($role !== "encoder") {
  header("Location: /core/portal.php");
  exit;
}

/* ✅ username label */
$loggedInUsername = $_SESSION["username"] ?? ($_SESSION["name"] ?? "User");

/* ── Municipality (needed for Forms/References header) ── */
$municipalityName = 'Not Assigned';
$municipalityId   = (int)($_SESSION['municipality_id'] ?? 0);
if ($municipalityId > 0) {
  $q = $pdo->prepare('SELECT name FROM municipalities WHERE id = ? LIMIT 1');
  $q->execute([$municipalityId]);
  $municipalityName = (string)($q->fetchColumn() ?? $municipalityName);
}

/* ── Helpers for Forms / References ── */
function list_files_recursive(string $baseDir, array $allowedExt): array {
  $out = [];
  if (!is_dir($baseDir)) return $out;
  $it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($baseDir, FilesystemIterator::SKIP_DOTS)
  );
  foreach ($it as $file) {
    if (!$file->isFile()) continue;
    $ext = strtolower(pathinfo($file->getFilename(), PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExt, true)) continue;
    $full = $file->getPathname();
    $rel  = str_replace('\\', '/', substr($full, strlen($baseDir) + 1));
    $folder = str_replace('\\', '/', dirname($rel));
    if ($folder === '.') $folder = 'Root';
    $out[] = [
      'name'   => $file->getFilename(),
      'rel'    => $rel,
      'ext'    => $ext,
      'size'   => $file->getSize(),
      'mtime'  => $file->getMTime(),
      'folder' => $folder,
    ];
  }
  usort($out, function($a, $b) {
    $fc = strcmp($a['folder'], $b['folder']);
    return $fc !== 0 ? $fc : strcmp($a['name'], $b['name']);
  });
  return $out;
}

function human_filesize(int $bytes): string {
  $units = ['B','KB','MB','GB'];
  $i = 0; $size = (float)$bytes;
  while ($size >= 1024 && $i < count($units)-1) { $size /= 1024; $i++; }
  return ($i === 0) ? ($bytes . ' B') : (number_format($size, 2) . ' ' . $units[$i]);
}

$formsBase = __DIR__ . "/templates/cdp_forms";
$refsBase  = __DIR__ . "/templates/cdp_references";

$forms = list_files_recursive($formsBase, ['docx','xlsx','xls','pdf']);
$refs  = list_files_recursive($refsBase,  ['pdf','docx','doc','xlsx','xls']);

$formsGrouped = [];
foreach ($forms as $f) { $formsGrouped[$f['folder']][] = $f; }

$refsGrouped = [];
foreach ($refs as $f) { $refsGrouped[$f['folder']][] = $f; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>e-Lista Completion Tracker</title>
    <link rel="stylesheet" href="FP_style.css">
</head>
<body>

<div class="layout">

    <!-- TOP BAR -->
    <header class="topbar">
        <div class="top-left">
            <strong>e-Lista Completion Tracker</strong>
        </div>
        <div class="top-center">
            Welcome <?php echo htmlspecialchars($loggedInUsername); ?>
        </div>
        <div class="top-right">
            <div class="municipalityBox">
                Municipality:
                <span id="currentMunicipalityLabel">---</span>
            </div>
            <div class="notifWrap">
                <button class="notifBtn" id="notifBtn" type="button" title="Notifications">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill="white"/>
                        <path d="M18 16v-5c0-3.1-1.6-5.6-4.5-6.3V4a1.5 1.5 0 10-3 0v.7C7.6 5.4 6 7.9 6 11v5l-2 2v1h16v-1l-2-2z" fill="white"/>
                    </svg>
                    <span class="notifBadge" id="notifBadge" style="display:none;">0</span>
                </button>
                <div class="notifDropdown" id="notifDropdown">
                    <div class="notifHeader">Notifications</div>
                    <div class="notifItem">No new notifications</div>
                </div>
            </div>
        </div>
    </header>

    <div class="app">

        <!-- SIDEBAR -->
        <aside class="sidebar">
            <div class="filterWrap">

                <button type="button" class="filterBtn" id="goToAnalyticsBtn" style="width:100%;">
                    📊 Dashboard Analytics
                </button>

                <button type="button" class="filterBtn" id="goToTrackerBtn" style="margin-top:16px; width:100%;">
                    📋 Completion Tracker
                </button>

                <button type="button" class="filterBtn" id="goToFormsBtn" style="margin-top:16px; width:100%;">
                    📄 Forms
                </button>

                <button type="button" class="filterBtn" id="goToRefsBtn" style="margin-top:16px; width:100%;">
                    📚 References
                </button>

                <button onclick="window.close();" class="filterBtn" style="width:100%; margin-top:16px;">
                    Close
                </button>

            </div>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="main">

            <!-- FP DASHBOARD / TRACKER PANEL -->
            <div class="panel" id="fpPanel">
                <div class="overall" id="overallText">
                    Percentage of Overall Completion:
                    <small>0.00%</small>
                </div>

                <div class="trackerTopActions">
                    <div class="trackerFilterWrap">
                        <button class="filterBtn" id="filterBtn" type="button" style="width:100%;">
                            Filter <span id="caret">▼</span>
                        </button>
                        <div class="dropdown" id="dropdown">
                            <label>Municipality</label>
                            <select id="municipalitySelect"></select>
                            <label style="margin-top:10px;">Cycle</label>
                            <select id="cycleSelect">
                                <option value="0">Loading cycles…</option>
                            </select>
                        </div>
                    </div>

                    <button class="filterBtn finalFormBtn" id="finalFormBtn" type="button">
                        📄 Final Form
                    </button>
                </div>

                <div class="tableWrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Forms</th>
                                <th>Social</th>
                                <th>Economic</th>
                                <th>Infrastructure</th>
                                <th>Environmental</th>
                                <th>Institutional</th>
                                <th>Completion %</th>
                            </tr>
                        </thead>
                        <tbody id="tbody"></tbody>
                    </table>
                </div>
            </div>

            <!-- ANALYTICS PANEL (hidden by default) -->
            <div id="analyticsPanel" style="display:none;">
                <div class="analyticsCards" id="analyticsCards">
                    <div class="analyticsCard"><div class="analyticsCardLabel">reviewed</div><div class="analyticsCardValue" id="aCardReviewed">—</div></div>
                    <div class="analyticsCard"><div class="analyticsCardLabel">pending</div><div class="analyticsCardValue" id="aCardPending">—</div></div>
                    <div class="analyticsCard"><div class="analyticsCardLabel">for revision</div><div class="analyticsCardValue" id="aCardRevision">—</div></div>
                    <div class="analyticsCard"><div class="analyticsCardLabel">total tracked</div><div class="analyticsCardValue" id="aCardTotal">—</div></div>
                </div>

                <div class="analyticsGrid">
                    <section class="panel analyticsTablePanel">
                        <div class="analyticsTableHead">
                            <span>Submissions</span>

                            <div class="analyticsFilterWrap">
                                <div class="analyticsFilterControls">

                                    <!-- Municipality Filter -->
                                    <button class="analyticsFilterBtn" id="analyticsFilterToggle" type="button">
                                        🏘 Municipality: <span id="analyticsFilterLabel">All Municipalities</span>
                                    </button>

                                    <!-- Cycle Filter -->
                                    <button class="analyticsFilterBtn" id="analyticsCycleToggle" type="button">
                                        📅 Cycle: <span id="analyticsCycleLabel">All Cycles</span>
                                    </button>

                                </div>

                                <!-- Municipality Dropdown -->
                                <div class="analyticsFilterDropdown" id="analyticsFilterDropdown">
                                    <div class="analyticsFilterSearch">🔎
                                        <input id="analyticsMuniSearch" type="text" placeholder="Search municipality..." autocomplete="off" />
                                    </div>
                                    <ul class="analyticsMuniList" id="analyticsMuniList">
                                        <li><a href="#" class="active" data-mid="0" data-name="all municipalities">All Municipalities</a></li>
                                    </ul>
                                </div>

                                <!-- Cycle Dropdown -->
                                <div class="analyticsFilterDropdown" id="analyticsCycleDropdown" style="right:0; top:calc(100% + 6px);">
                                    <ul class="analyticsMuniList" id="analyticsCycleList">
                                        <li><a href="#" class="active" data-cid="0" data-name="all cycles">All Cycles</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="analyticsTableWrap">
                            <table class="analyticsTable">
                                <thead>
                                    <tr>
                                        <th>Municipal</th>
                                        <th>Reviewed</th>
                                        <th>Pending</th>
                                        <th>For Revision</th>
                                    </tr>
                                </thead>
                                <tbody id="analyticsTbody">
                                    <tr><td colspan="4" style="padding:14px;text-align:center;">Loading…</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <aside class="panel analyticsChartPanel">
                        <div class="analyticsChartBox">
                            <div class="analyticsChartTitle">Percentage of Completion</div>
                            <canvas id="analyticsChart" height="260"></canvas>
                            <div class="analyticsChartNote">Complete: <span id="analyticsPctText">0</span>%</div>
                        </div>
                    </aside>
                </div>
            </div>

            <!-- USERS PANEL (hidden by default) -->
            <div class="panel" id="usersPanel" style="display:none;">
                <div class="usersCard">
                    <div class="usersCardHeader">Create New User</div>
                    <div class="usersForm">
                        <div class="usersRow">
                            <label>Username:</label>
                            <input type="text" id="newUsername" autocomplete="off">
                        </div>
                        <div class="usersRow">
                            <label>Password:</label>
                            <input type="password" id="newPassword" autocomplete="new-password">
                        </div>
                        <div class="usersRow">
                            <label>Role:</label>
                            <select id="newRole">
                                <option value="">Select Role</option>
                                <option value="encoder">ENCODER</option>
                                <option value="mlgoo">MLGOO</option>
                            </select>
                        </div>
                        <div class="usersRow" id="newMuniRow" style="display:none;">
                            <label>Municipality:</label>
                            <select id="newMuni">
                                <option value="">Select Municipality</option>
                            </select>
                        </div>
                        <div class="usersActions">
                            <button type="button" class="usersPrimaryBtn" id="createUserBtn">Create User</button>
                            <button type="button" class="usersGhostBtn" id="clearUserBtn">Clear</button>
                        </div>
                    </div>
                </div>
                <div class="usersCard">
                    <div class="usersCardHeader usersHeaderRow">
                        <span>Current Users</span>
                        <div class="usersSearch">
                            <span>Search:</span>
                            <input type="text" id="userSearch" placeholder="Search username or role...">
                            <button type="button" class="usersSearchBtn" id="searchBtn">Search</button>
                        </div>
                    </div>
                    <div class="usersTableWrap">
                        <table class="usersTable">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Municipality</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="usersTbody">
                                <tr><td colspan="5" style="text-align:center; padding:18px;">No users found.</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="usersPager">
                        <div>Page <b id="pageNow">1</b> of <b id="pageTotal">1</b></div>
                        <div class="usersPagerBtns">
                            <button type="button" class="usersGhostBtn" id="prevPageBtn">Previous</button>
                            <button type="button" class="usersPageBtn isActive" id="pageBtn1">1</button>
                            <button type="button" class="usersGhostBtn" id="nextPageBtn">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FORMS PANEL -->
            <div id="formsPanel" style="display:none;">

                <div class="panelTitleRow">
                    <div class="panelTitleGroup">
                        <h2>📄 CDP Forms</h2>
                        <p>Download official CDP Forms for your municipality.</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                        <div class="totalBadge">
                            <?php echo count($forms); ?> file<?php echo count($forms) !== 1 ? 's' : ''; ?>
                        </div>
                    </div>
                </div>

                <div class="searchWrap">
                    <input id="formsSearchBox" class="searchInput" type="text"
                           placeholder="Search form file name…" autocomplete="off" />
                    <span class="searchHint" id="formsSearchHint"></span>
                </div>

                <?php if (!is_dir($formsBase)): ?>
                    <div class="emptyState">
                        Folder not found: <code>elista/templates/cdp_forms</code><br>
                        Create it and extract your CDP Forms zip there.
                    </div>
                <?php elseif (count($forms) === 0): ?>
                    <div class="emptyState">
                        No files found in <code>elista/templates/cdp_forms</code>
                    </div>
                <?php else: ?>
                    <div id="formsAllCards">
                        <?php foreach ($formsGrouped as $folder => $files): ?>
                            <div class="sectionGroup" data-forms-group>
                                <div class="sectionGroupTitle"><?php echo htmlspecialchars($folder); ?></div>
                                <div class="fileGrid">
                                    <?php foreach ($files as $f): ?>
                                        <div class="fileCard"
                                             data-forms-name="<?php echo htmlspecialchars(strtolower($f['name'] . ' ' . $f['folder'])); ?>">
                                            <div class="fileCardTop">
                                                <div class="fileBadge <?php echo htmlspecialchars($f['ext']); ?>">
                                                    <?php echo strtoupper(htmlspecialchars($f['ext'])); ?>
                                                </div>
                                                <div class="fileInfo">
                                                    <div class="fileName"><?php echo htmlspecialchars($f['name']); ?></div>
                                                    <div class="fileMeta">
                                                        <span><?php echo htmlspecialchars($f['folder']); ?></span>
                                                        <span>•</span>
                                                        <span><?php echo human_filesize((int)$f['size']); ?></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <a class="downloadBtn"
                                               href="download_template.php?type=forms&file=<?php echo rawurlencode($f['rel']); ?>">
                                                ⬇ Download
                                            </a>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <div class="emptyState" id="formsNoResults" style="display:none;">No forms match your search.</div>
                <?php endif; ?>

            </div>

            <!-- REFERENCES PANEL -->
            <div id="refsPanel" style="display:none;">

                <div class="panelTitleRow">
                    <div class="panelTitleGroup">
                        <h2>📚 CDP References</h2>
                        <p>Download official CDP Reference files for your municipality.</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                        <div class="totalBadge">
                            <?php echo count($refs); ?> file<?php echo count($refs) !== 1 ? 's' : ''; ?>
                        </div>
                    </div>
                </div>

                <div class="searchWrap">
                    <input id="refsSearchBox" class="searchInput" type="text"
                           placeholder="Search reference file name…" autocomplete="off" />
                    <span class="searchHint" id="refsSearchHint"></span>
                </div>

                <?php if (!is_dir($refsBase)): ?>
                    <div class="emptyState">
                        Folder not found: <code>elista/templates/cdp_references</code><br>
                        Create it and extract your CDP References zip there.
                    </div>
                <?php elseif (count($refs) === 0): ?>
                    <div class="emptyState">
                        No files found in <code>elista/templates/cdp_references</code>
                    </div>
                <?php else: ?>
                    <div id="refsAllCards">
                        <?php foreach ($refsGrouped as $folder => $files): ?>
                            <div class="sectionGroup" data-refs-group>
                                <div class="sectionGroupTitle"><?php echo htmlspecialchars($folder); ?></div>
                                <div class="fileGrid">
                                    <?php foreach ($files as $f): ?>
                                        <div class="fileCard"
                                             data-refs-name="<?php echo htmlspecialchars(strtolower($f['name'] . ' ' . $f['folder'])); ?>">
                                            <div class="fileCardTop">
                                                <div class="fileBadge <?php echo htmlspecialchars($f['ext']); ?>">
                                                    <?php echo strtoupper(htmlspecialchars($f['ext'])); ?>
                                                </div>
                                                <div class="fileInfo">
                                                    <div class="fileName"><?php echo htmlspecialchars($f['name']); ?></div>
                                                    <div class="fileMeta">
                                                        <span><?php echo htmlspecialchars($f['folder']); ?></span>
                                                        <span>•</span>
                                                        <span><?php echo human_filesize((int)$f['size']); ?></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <a class="downloadBtn"
                                               href="download_template.php?type=refs&file=<?php echo rawurlencode($f['rel']); ?>">
                                                ⬇ Download
                                            </a>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <div class="emptyState" id="refsNoResults" style="display:none;">No references match your search.</div>
                <?php endif; ?>

            </div>

        </main>

    </div>

</div>

<!-- FILE VIEWER MODAL -->
<div id="fileModal" class="fileModal">
  <div class="fileModalBox">
    <div class="fileModalHeader">
      <div id="fileModalTitle" class="fileModalTitle">View File</div>
      <button id="fileModalClose" class="fileModalClose" type="button">✕</button>
    </div>
    <div id="fileModalBody" class="fileModalBody"></div>
    <div id="fileModalFooter" style="
      display: none; align-items: center; gap: 16px;
      padding: 12px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb;
    "></div>
  </div>
</div>

<!-- HISTORY MODAL -->
<div id="historyModal" class="historyModal">
  <div class="historyModalBox">
    <div class="historyModalHeader">
      <div id="historyModalTitle" class="historyModalTitle">History</div>
      <button id="historyModalClose" class="historyModalClose" type="button">✕</button>
    </div>
    <div id="historyModalBody" class="historyModalBody"></div>
  </div>
</div>

<!-- SUBMIT CONFIRMATION MODAL -->
<div id="submitConfirmModal" class="submitConfirmModal">
  <div class="submitConfirmBox">
    <div id="submitConfirmTitle" class="submitConfirmTitle">Confirm Submission</div>
    <div id="submitConfirmMessage" class="submitConfirmMessage">
      Are you sure you want to continue?
    </div>
    <div class="submitConfirmActions">
      <button id="submitConfirmCancel" type="button" class="submitConfirmCancelBtn">Cancel</button>
      <button id="submitConfirmOk" type="button" class="submitConfirmOkBtn">Confirm</button>
    </div>
  </div>
</div>

<!-- FINAL FORM MODAL -->
<div id="finalFormModal" class="fileModal">
  <div class="fileModalBox" style="width:min(1040px, 94vw); height:min(84vh, 760px);">
    <div class="fileModalHeader">
      <div id="finalFormModalTitle" class="fileModalTitle">Final Form</div>
      <button id="finalFormModalClose" class="fileModalClose" type="button">✕</button>
    </div>
    <div id="finalFormModalBody" class="fileModalBody"></div>
    <div id="finalFormModalFooter" style="
      display:none;
      align-items:center;
      gap:16px;
      padding:12px 16px;
      border-top:1px solid #e5e7eb;
      background:#f9fafb;
    "></div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js"></script>
<script src="FP_script.js"></script>

</body>
</html>
