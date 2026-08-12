<?php
require __DIR__ . "/../core/auth.php";
require __DIR__ . "/../core/config.php";

// ✅ Only MLGOO + LGU/Responder
$role = strtolower(trim((string)($_SESSION['role'] ?? '')));
if (!in_array($role, ['mlgoo', 'responder', 'encoder'], true)) {
  header('Location: /core/portal.php');
  exit;
}

$username = $_SESSION['username'] ?? ($_SESSION['name'] ?? 'User');

// municipality label
$municipalityName = 'Not Assigned';
$municipalityId = (int)($_SESSION['municipality_id'] ?? 0);
if ($municipalityId > 0) {
  $q = $pdo->prepare('SELECT name FROM municipalities WHERE id = ? LIMIT 1');
  $q->execute([$municipalityId]);
  $municipalityName = (string)($q->fetchColumn() ?? $municipalityName);
}

// Forms directory
$formsBase = __DIR__ . "/templates/cdp_forms";

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
    if ($fc !== 0) return $fc;
    return strcmp($a['name'], $b['name']);
  });

  return $out;
}

function human_filesize(int $bytes): string {
  $units = ['B','KB','MB','GB'];
  $i = 0;
  $size = (float)$bytes;
  while ($size >= 1024 && $i < count($units)-1) {
    $size /= 1024;
    $i++;
  }
  return ($i === 0) ? ($bytes . ' B') : (number_format($size, 2) . ' ' . $units[$i]);
}

$forms = list_files_recursive($formsBase, ['docx','xlsx','xls','pdf']);

// Group by folder
$grouped = [];
foreach ($forms as $f) {
  $grouped[$f['folder']][] = $f;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FP Forms – CDP Forms</title>
  <link rel="stylesheet" href="FP_style.css">
  <style>
    /* ── Search bar ── */
    .searchWrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 20px 0;
    }
    .searchInput {
      flex: 1;
      max-width: 360px;
      padding: 8px 14px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      transition: border-color .18s;
    }
    .searchInput:focus { border-color: #4f7cdc; }
    .searchHint { font-size: 13px; color: #6b7280; }

    /* ── Section group ── */
    .sectionGroup { margin-bottom: 28px; }
    .sectionGroupTitle {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .06em;
      text-transform: uppercase;
      color: #6b7280;
      padding: 0 0 8px 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 14px;
    }

    /* ── File card grid ── */
    .fileGrid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }
    .fileCard {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: box-shadow .18s, border-color .18s;
    }
    .fileCard:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,.08);
      border-color: #bfcfe8;
    }
    .fileCardTop {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .fileBadge {
      flex-shrink: 0;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .04em;
      color: #fff;
      background: #4f7cdc;
    }
    .fileBadge.pdf  { background: #e53e3e; }
    .fileBadge.docx { background: #2b6cb0; }
    .fileBadge.xlsx,
    .fileBadge.xls  { background: #276749; }
    .fileInfo { flex: 1; min-width: 0; }
    .fileName {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      word-break: break-word;
      line-height: 1.35;
    }
    .fileMeta {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 3px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .downloadBtn {
      display: inline-block;
      align-self: flex-start;
      padding: 6px 16px;
      background: #4f7cdc;
      color: #fff;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: background .18s;
    }
    .downloadBtn:hover { background: #3a62b8; }

    /* ── Empty state ── */
    .emptyState {
      color: #6b7280;
      font-size: 14px;
      padding: 32px 0;
      text-align: center;
    }
    .emptyState code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }

    /* ── Panel title row ── */
    .panelTitleRow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .panelTitleGroup h2 {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 2px 0;
    }
    .panelTitleGroup p {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .totalBadge {
      background: #eef2fb;
      color: #4f7cdc;
      font-size: 13px;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 20px;
    }
  </style>
</head>
<body>

<div class="layout">

  <!-- TOP BAR -->
  <header class="topbar">
    <div class="top-left">
      <strong>E-lista Completion Tracker</strong>
    </div>
    <div class="top-center">
      Welcome <?php echo htmlspecialchars($username); ?>
    </div>
    <div class="top-right">
      <div class="municipalityBox">
        Municipality: <span><?php echo htmlspecialchars($municipalityName); ?></span>
      </div>
    </div>
  </header>

  <div class="app">

    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="filterWrap">

        <button type="button" class="filterBtn" onclick="location.href='FP_dashboard.php'" style="width:100%;">
          📊 Back to Progress
        </button>

        <button type="button" class="filterBtn" onclick="location.href='FP_forms.php'" style="width:100%; margin-top:16px; background:#4f7cdc; color:#fff;">
          📄 Forms
        </button>

        <button type="button" class="filterBtn" onclick="location.href='FP_references.php'" style="width:100%; margin-top:16px;">
          📚 References
        </button>

        <button type="button" class="filterBtn" onclick="window.close();" style="width:100%; margin-top:16px;">
          Close
        </button>

      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="main">
      <div class="panel">

        <!-- Title row -->
        <div class="panelTitleRow">
          <div class="panelTitleGroup">
            <h2>📄 CDP Forms</h2>
            <p>Download official CDP Forms for your municipality.</p>
          </div>
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <div class="totalBadge"><?php echo count($forms); ?> file<?php echo count($forms) !== 1 ? 's' : ''; ?></div>
          </div>
        </div>

        <!-- Search -->
        <div class="searchWrap">
          <input id="searchBox" class="searchInput" type="text" placeholder="Search form file name…" autocomplete="off" />
          <span class="searchHint" id="searchHint"></span>
        </div>

        <!-- Content -->
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
          <div id="allCards">
            <?php foreach ($grouped as $folder => $files): ?>
              <div class="sectionGroup" data-group>
                <div class="sectionGroupTitle"><?php echo htmlspecialchars($folder); ?></div>
                <div class="fileGrid">
                  <?php foreach ($files as $f): ?>
                    <div class="fileCard" data-name="<?php echo htmlspecialchars(strtolower($f['name'] . ' ' . $f['folder'])); ?>">
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
          <div class="emptyState" id="noResults" style="display:none;">No forms match your search.</div>
        <?php endif; ?>

      </div>
    </main>

  </div>
</div>

<script>
  const searchBox = document.getElementById('searchBox');
  const hint      = document.getElementById('searchHint');
  const noResults = document.getElementById('noResults');

  function applySearch() {
    const q = (searchBox.value || '').trim().toLowerCase();
    const cards = document.querySelectorAll('.fileCard');
    let shown = 0;

    cards.forEach(card => {
      const name = card.getAttribute('data-name') || '';
      const ok = q === '' || name.includes(q);
      card.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });

    // hide empty groups
    document.querySelectorAll('[data-group]').forEach(group => {
      const visible = group.querySelectorAll('.fileCard:not([style*="display: none"])').length;
      group.style.display = visible ? '' : 'none';
    });

    hint.textContent = q ? `${shown} match(es)` : '';
    if (noResults) noResults.style.display = (q && shown === 0) ? '' : 'none';
  }

  searchBox.addEventListener('input', applySearch);
</script>

</body>
</html>