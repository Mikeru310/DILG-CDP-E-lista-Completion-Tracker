<?php
require __DIR__ . "/../core/auth.php";
require __DIR__ . "/../core/config.php";

// ✅ Only MLGOO + LGU/Responder
$role = strtolower(trim((string)($_SESSION['role'] ?? '')));
if (!in_array($role, ['mlgoo', 'responder'], true)) {
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

// Helpers
function list_files_recursive(string $baseDir, array $allowedExt): array {
  $out = [];
  if (!is_dir($baseDir)) return $out;

  $it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($baseDir, FilesystemIterator::SKIP_DOTS)
  );

  foreach ($it as $file) {
    /** @var SplFileInfo $file */
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
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Forms - CDP Forms</title>

  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="templates.css">
</head>
<body>

<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-title">Menu</div>

    <button class="sidebar-btn" onclick="location.href='progress.php'">
      Back to Progress
    </button>

    <button class="sidebar-btn" onclick="location.href='forms.php'">
      Forms
    </button>

    <button class="sidebar-btn" onclick="location.href='references.php'">
      References
    </button>

    <form style="margin:0;">
      <button type="button" onclick="window.close();" class="sidebar-btn logout">
        Close
      </button>
    </form>
  </aside>

  <main class="main-content">
    <div class="topbar">
      <div class="topbar-left"></div>

      <div class="topbar-center">
        Welcome, <strong><?php echo htmlspecialchars($username); ?></strong>
      </div>

      <div class="topbar-right">
        Municipality: <strong><?php echo htmlspecialchars($municipalityName); ?></strong>
      </div>
    </div>

    <div class="page">
      <div class="panel templatesPanel">
        <div class="templatesHeader">
          <div>
            <div class="templatesTitle">Forms</div>
            <div class="templatesSub">
              Download official <strong>CDP Forms</strong>.
            </div>
          </div>

          <div class="templatesSearchWrap">
            <input id="searchBox" class="templatesSearch" type="text" placeholder="Search forms file name..." />
            <div class="templatesHint" id="searchHint"></div>
          </div>
        </div>
      </div>

      <div class="panel templatesPanel">
        <div class="sectionHead">
          <div class="sectionTitle">CDP Forms</div>
          <div class="sectionMeta"><?php echo count($forms); ?> files</div>
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
          <div class="templateGrid" id="formsGrid">
            <?php foreach ($forms as $f): ?>
              <div class="templateCard" data-name="<?php echo htmlspecialchars(strtolower($f['name'] . ' ' . $f['folder'])); ?>">
                <div class="templateTop">
                  <div class="fileBadge"><?php echo strtoupper(htmlspecialchars($f['ext'])); ?></div>
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
                   Download
                </a>
              </div>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </div>
    </div>

    <script>
      const searchBox = document.getElementById('searchBox');
      const hint = document.getElementById('searchHint');

      function applySearch() {
        const q = (searchBox.value || '').trim().toLowerCase();
        const cards = document.querySelectorAll('.templateCard');
        let shown = 0;

        cards.forEach(card => {
          const name = card.getAttribute('data-name') || '';
          const ok = q === '' || name.includes(q);
          card.style.display = ok ? '' : 'none';
          if (ok) shown++;
        });

        hint.textContent = q ? `${shown} match(es)` : '';
      }

      searchBox.addEventListener('input', applySearch);
    </script>
  </main>
</div>

</body>
</html>