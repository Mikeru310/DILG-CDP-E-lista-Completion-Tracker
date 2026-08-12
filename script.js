document.addEventListener("DOMContentLoaded", () => {
  const IS_MLGOO = window.MLGOO_MODE === true;

  const categories = [
    "Social",
    "Economic",
    "Infrastructure",
    "Environmental",
    "Institutional"
  ];

  const ALLOWED_EXTS = ["pdf", "docx", "txt"];
  const ACCEPT_ATTR = ".pdf,.docx,.txt";

  const SKIP_STEPS = [14, 15, 16];
  const SKIP_CATS = ["Social", "Economic", "Infrastructure", "Environmental"];

  const SPECIAL_STEPS = [14, 15, 16];
  const SPECIAL_CATEGORY = "Institutional";
  const SPECIAL_BONUS_PER = 5;
  const SPECIAL_TOTAL_BONUS = SPECIAL_STEPS.length * SPECIAL_BONUS_PER;
  const NORMAL_TOTAL_PERCENT = 100 - SPECIAL_TOTAL_BONUS;

  const stepTitles = [
    "Vision Elements Descriptors",
    "Vision Reality Gap (VRG) Analysis",
    "Expanded Problem Solution Finding Matrix and Goals and Objectives Matrix",
    "Annex B. Form 1c. Ecological Profile",
    "Annex B. Form 1d. Local Development Indicator System (LDIS)/RaPIDS",
    "Annex B. Form 2a. Structured List of PPAs per Sector (Long List)",
    "Annex B. Form 2b. Structured List of PPAs per Sector and Development Indicator (Long List)",
    "Identifying Projects and Non Projects",
    "Sifting by Ownership",
    "Ranked List of Projects (using the Urgency Test)",
    "Goal Achievement Matrix (GAM)",
    "Annex B. Form 3a. Ranked List of PPAs for Investment Programming",
    "Annex B. Form 3b. Project Brief for Each PPA",
    "Annex B. Form 3c. Projection of New Development Investment Financing Potential",
    "Annex B. Form 3d. Medium-Term Financing Plan",
    "Annex B. Form 3e. LDIP Summary Form",
    "Annex B. Form 4. AIP Summary Form",
    "Annex B. Form 5a. CapDev Program Summary Form",
    "Annex B. Form 5b. Priority Legislative Requirements Summary Form",
    "Annex B. Form 6b. Monitoring & Evaluation Strategy Template"
  ];

  const stepsContainer = document.getElementById("stepsContainer");
  if (!stepsContainer) {
    console.error("stepsContainer not found!");
    return;
  }

  let pendingUpload = {
    input: null,
    card: null,
    file: null,
    stepNo: null,
    category: null
  };

  let currentCycleId = null;
  let allCycles = [];
  let currentFinalFormData = null;
  let finalFormSelectedFile = null;

  function safeId(text) {
    return text.toLowerCase().replace(/\s+/g, "_");
  }

  function getExt(filename) {
    const parts = String(filename || "").split(".");
    return (parts.length > 1 ? parts.pop() : "").toLowerCase().trim();
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDT(val) {
    if (!val) return "—";
    const s = String(val).trim().replace(" ", "T");
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString();
  }

  function formatBytes(bytes) {
    const n = Number(bytes || 0);
    if (!n) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let value = n;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
      value /= 1024;
      idx++;
    }
    return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
  }

  function buildZipTree(items) {
    const root = { name: "", type: "dir", children: {} };

    items.forEach(item => {
      const rawPath = String(item.name || "").replace(/^\/+/, "").replace(/\/+$/, item.is_dir ? "" : "");
      if (!rawPath) return;

      const parts = rawPath.split("/").filter(Boolean);
      let current = root;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const shouldBeDir = !isLast || item.is_dir;

        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            type: shouldBeDir ? "dir" : "file",
            children: shouldBeDir ? {} : undefined,
            size: shouldBeDir ? 0 : item.size || 0,
            compressed_size: shouldBeDir ? 0 : item.compressed_size || 0,
            modified: item.modified || null,
            fullPath: parts.slice(0, index + 1).join("/")
          };
        }

        const node = current.children[part];

        if (isLast && !item.is_dir) {
          node.type = "file";
          node.size = item.size || 0;
          node.compressed_size = item.compressed_size || 0;
          node.modified = item.modified || null;
          node.fullPath = parts.join("/");
        }

        current = node;
      });
    });

    return root;
  }

  function renderZipNode(node, level = 0) {
    const entries = Object.values(node.children || {}).sort((a, b) => {
  if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: "base"
  });
});

    return entries.map(entry => {
      if (entry.type === "dir") {
        const childHtml = renderZipNode(entry, level + 1);
        return `
          <details class="zipTreeFolder" ${level < 2 ? "open" : ""}>
            <summary class="zipTreeRow zipTreeFolderRow">
              <span class="zipTreeIcon">📁</span>
              <span class="zipTreeName">${escapeHtml(entry.name)}</span>
            </summary>
            <div class="zipTreeChildren">
              ${childHtml || `<div class="zipTreeEmpty">Empty folder</div>`}
            </div>
          </details>
        `;
      }

      return `
        <div class="zipTreeRow zipTreeFileRow zipTreeFileClickable"
             data-entry="${escapeHtml(entry.fullPath)}"
             title="Double-click to preview">
          <span class="zipTreeIcon">📄</span>
          <span class="zipTreeName">${escapeHtml(entry.name)}</span>
          <span class="zipTreeMeta">${formatBytes(entry.size)}</span>
          <span class="zipTreeDblHint">dbl-click to preview</span>
        </div>
      `;
    }).join("");
  }

  async function loadZipBrowser(previewEl, filePath) {
    previewEl.innerHTML = `<div class="reviewNoFile">Loading ZIP contents...</div>`;

    try {
      const res = await fetch(`list_zip_contents.php?file_path=${encodeURIComponent(filePath)}`, {
        cache: "no-store"
      });

      const data = await res.json();

      if (!res.ok || !data.ok || !Array.isArray(data.items)) {
        previewEl.innerHTML = `<div class="reviewNoFile">Could not load ZIP contents.</div>`;
        return;
      }

      const filesOnly = data.items.filter(x => !x.is_dir);
      const tree = buildZipTree(data.items);
      const treeHtml = renderZipNode(tree);

      previewEl.innerHTML = `
        <div class="zipBrowser" data-zip-path="${escapeHtml(filePath)}">
          <div class="zipBrowserHeader">
            <div class="zipBrowserTitle">ZIP Contents</div>
            <div class="zipBrowserCount">${filesOnly.length} file${filesOnly.length === 1 ? "" : "s"}</div>
          </div>
          <div class="zipBrowserBody">
            ${treeHtml || `<div class="zipTreeEmpty">No files found in ZIP.</div>`}
          </div>
        </div>
      `;

      // Attach dblclick listeners so users can preview individual files
      previewEl.querySelectorAll(".zipTreeFileClickable").forEach(row => {
        row.addEventListener("dblclick", () => {
          const entry = row.dataset.entry || "";
          if (entry && entry.toLowerCase() !== "readme.txt") {
            openZipEntryPreview(filePath, entry);
          }
        });
      });
    } catch (err) {
      previewEl.innerHTML = `<div class="reviewNoFile">Failed to load ZIP contents.</div>`;
    }
  }

  function getCycleStatusText(cycle) {
    if (Number(cycle?.is_expired) === 1) return "Expired";
    return "Active";
  }

  function getCycleDisplayLabel(cycle) {
    return `${cycle.cycle_start} - ${cycle.cycle_end} (${getCycleStatusText(cycle)})`;
  }

  async function loadCycles() {
    const label = document.getElementById("activeCycleLabel");
    const list = document.getElementById("cycleFilterList");

    if (!label || !list) return;

    try {
      const res = await fetch("get_cycles.php", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data.ok || !Array.isArray(data.cycles)) {
        label.textContent = "Not set";
        list.innerHTML = `<div class="cycle-filter-empty">Failed to load cycles</div>`;
        return;
      }

      allCycles = data.cycles;

      const savedCycleId = parseInt(localStorage.getItem("selected_cycle_id") || "0", 10);
      const activeCycle =
        allCycles.find(c => Number(c.is_active) === 1 && Number(c.is_expired) !== 1) ||
        allCycles.find(c => Number(c.is_active) === 1) ||
        allCycles[0] ||
        null;

      if (savedCycleId && !allCycles.find(c => Number(c.id) === savedCycleId)) {
        localStorage.removeItem("selected_cycle_id");
      }

      const selectedCycle =
        allCycles.find(c => Number(c.id) === savedCycleId) ||
        activeCycle;

      if (!selectedCycle) {
        currentCycleId = null;
        label.textContent = "No cycles";
        list.innerHTML = `<div class="cycle-filter-empty">No cycles found</div>`;
        updateProgress();   // lock all steps immediately
        return;
      }

      currentCycleId = Number(selectedCycle.id);
      label.textContent = getCycleDisplayLabel(selectedCycle);

      renderCycleOptions();
    } catch (e) {
      currentCycleId = null;
      label.textContent = "Error";
      list.innerHTML = `<div class="cycle-filter-empty">Error loading cycles</div>`;
      console.error("loadCycles error:", e);
    }
  }

  function renderCycleOptions() {
    const list = document.getElementById("cycleFilterList");
    if (!list) return;

    if (!allCycles.length) {
      list.innerHTML = `<div class="cycle-filter-empty">No cycles found</div>`;
      return;
    }

    list.innerHTML = allCycles.map(c => {
      const id = Number(c.id);
      const isSelected = id === currentCycleId;
      const statusText = getCycleStatusText(c);
      const statusClass =
        statusText === "Expired"
          ? "status-expired"
          : "status-active";

      return `
        <button
          type="button"
          class="cycle-option ${isSelected ? "active" : ""}"
          data-cycle-id="${id}"
        >
          <span>${c.cycle_start} - ${c.cycle_end}</span>
          <span class="cycle-status-badge ${statusClass}">${statusText}</span>
        </button>
      `;
    }).join("");

    list.querySelectorAll(".cycle-option").forEach(btn => {
      btn.addEventListener("click", () => {
        const selectedId = Number(btn.dataset.cycleId);
        const cycle = allCycles.find(c => Number(c.id) === selectedId);
        if (!cycle) return;

        currentCycleId = selectedId;
        localStorage.setItem("selected_cycle_id", String(selectedId));

        const label = document.getElementById("activeCycleLabel");
        if (label) label.textContent = getCycleDisplayLabel(cycle);

        renderCycleOptions();

        const dropdown = document.getElementById("cycleFilterDropdown");
        if (dropdown) dropdown.classList.add("hidden");

        resetCardsToDefault();
        syncFromDatabase();
      });
    });
  }

  function initCycleFilterUI() {
    const wrap = document.getElementById("cycleFilterWrap");
    const btn = document.getElementById("cycleFilterBtn");
    const dropdown = document.getElementById("cycleFilterDropdown");

    if (!wrap || !btn || !dropdown) return;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.classList.contains("hidden") && !wrap.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    });
  }

  // ------------------------------------------------------------------
  // New Cycle Modal
  // ------------------------------------------------------------------

  function injectNewCycleModal() {
    if (document.getElementById("newCycleModal")) return;

    const currentYear = new Date().getFullYear();

    const modal = document.createElement("div");
    modal.id = "newCycleModal";
    modal.className = "ncm-overlay hidden";
    modal.innerHTML = `
      <div class="ncm-dialog" role="dialog" aria-modal="true" aria-labelledby="ncmTitle">
        <div class="ncm-header">
          <h2 class="ncm-title" id="ncmTitle">➕ Create New Planning Cycle</h2>
          <button class="ncm-close" id="ncmClose" type="button" aria-label="Close">✕</button>
        </div>

        <div class="ncm-body">
          <p class="ncm-desc">
            Choose the <strong>start year</strong> for your municipality's new planning cycle.
            The end year is automatically set 6 years later.
          </p>

          <div class="ncm-field">
            <label class="ncm-label" for="ncmStartYear">Start Year</label>
            <input
              class="ncm-input"
              id="ncmStartYear"
              type="number"
              min="${currentYear - 50}"
              max="${currentYear + 50}"
              value="${currentYear}"
              placeholder="e.g. ${currentYear}"
            >
          </div>

          <div class="ncm-preview" id="ncmPreview">
            <span class="ncm-preview-label">Planning Period:</span>
            <span class="ncm-preview-range" id="ncmPreviewRange">${currentYear} – ${currentYear + 6}</span>
          </div>

          <div class="ncm-warning" id="ncmWarning"></div>
        </div>

        <div class="ncm-footer">
          <button class="ncm-btn ncm-btn-cancel" id="ncmCancel" type="button">Cancel</button>
          <button class="ncm-btn ncm-btn-create" id="ncmSubmit" type="button">Create Cycle</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const startInput   = document.getElementById("ncmStartYear");
    const previewRange = document.getElementById("ncmPreviewRange");
    const warning      = document.getElementById("ncmWarning");
    const submitBtn    = document.getElementById("ncmSubmit");

    function updatePreview() {
      const val = parseInt(startInput.value, 10);
      if (!val || isNaN(val) || val < 1900 || val > 2200) {
        previewRange.textContent = "—";
        warning.textContent = "Please enter a valid 4-digit year.";
        submitBtn.disabled = true;
        return;
      }
      previewRange.textContent = `${val} – ${val + 6}`;

      // Check for overlap with existing cycles
      const overlap = allCycles.find(c => {
        const cs = Number(c.cycle_start);
        const ce = Number(c.cycle_end);
        return val < ce && (val + 6) > cs;
      });

      if (overlap) {
        warning.textContent = `⚠️ Overlaps with existing cycle ${overlap.cycle_start}–${overlap.cycle_end}.`;
        submitBtn.disabled = false; // server will reject duplicate exact matches; warn only
      } else {
        warning.textContent = "";
        submitBtn.disabled = false;
      }
    }

    startInput.addEventListener("input", updatePreview);
    updatePreview();

    function closeModal() {
      modal.classList.add("hidden");
      warning.textContent = "";
    }

    document.getElementById("ncmClose").addEventListener("click", closeModal);
    document.getElementById("ncmCancel").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
    });

    submitBtn.addEventListener("click", async () => {
      const val = parseInt(startInput.value, 10);
      if (!val || isNaN(val)) {
        warning.textContent = "Please enter a valid start year.";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Creating…";

      try {
        const body = new URLSearchParams({ start_year: String(val) });
        const res  = await fetch("create_cycle.php", {
          method: "POST",
          cache:  "no-store",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          warning.textContent = "❌ " + (data.error || "Failed to create cycle.");
          submitBtn.disabled = false;
          submitBtn.textContent = "Create Cycle";
          return;
        }

        localStorage.removeItem("selected_cycle_id");
        closeModal();
        location.reload();
      } catch (e) {
        console.error("createNewCycle error:", e);
        warning.textContent = "❌ Error: " + e.message;
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Cycle";
      }
    });

    return modal;
  }

  function openNewCycleModal() {
    injectNewCycleModal();
    const modal     = document.getElementById("newCycleModal");
    const startInput = document.getElementById("ncmStartYear");
    const warning   = document.getElementById("ncmWarning");
    const submitBtn = document.getElementById("ncmSubmit");

    // Reset state
    startInput.value = String(new Date().getFullYear());
    warning.textContent = "";
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Cycle";

    const previewRange = document.getElementById("ncmPreviewRange");
    const yr = parseInt(startInput.value, 10);
    previewRange.textContent = `${yr} – ${yr + 6}`;

    modal.classList.remove("hidden");
    startInput.focus();
  }

  const createCycleBtn = document.getElementById("createCycleBtn");
  if (createCycleBtn) createCycleBtn.addEventListener("click", openNewCycleModal);

  function resetFinalFormButtonState() {
    const finalBtn = document.getElementById("finalFormBtn");
    if (!finalBtn) return;

    currentFinalFormData = null;
    finalBtn.textContent = "📋 Final Form";
    finalBtn.classList.remove("submitted");
    finalBtn.classList.add("locked");
    finalBtn.disabled = true;
    finalBtn.title = "All forms must be approved before submitting the Final Form";
  }

  function resetCardsToDefault() {
    document.querySelectorAll(".card").forEach(card => {
      if (card.classList.contains("no-submit") || card.classList.contains("noSubmission")) return;

      const step = card.dataset.step;
      const cat = card.dataset.category;
      const inputId = `file_${step}_${safeId(cat)}`;

      card.classList.remove("pending", "approved", "with-revision");
      card.classList.add("missing");

      const mark = card.querySelector(".mark");
      if (mark) mark.textContent = "✕";

      const remarksBtn = card.querySelector(".remarksBtn");
      if (remarksBtn) {
        remarksBtn.classList.add("hidden");
        remarksBtn.onclick = null;
      }

      const previewPendingBtn = card.querySelector(".previewPendingBtn");
      if (previewPendingBtn) {
        previewPendingBtn.classList.add("hidden");
        previewPendingBtn.onclick = null;
      }

      const reviewedBtn = card.querySelector(".reviewedBtn");
      if (reviewedBtn) {
        if (IS_MLGOO) {
          // mlgoo: just remove the reviewedBtn with no replacement
          reviewedBtn.remove();
        } else {
          const replacementUploadBtn = document.createElement("button");
          replacementUploadBtn.type = "button";
          replacementUploadBtn.className = "uploadBtn";
          replacementUploadBtn.dataset.file = inputId;
          replacementUploadBtn.textContent = "Upload File";
          replacementUploadBtn.addEventListener("click", () => {
            const targetInput = document.getElementById(replacementUploadBtn.dataset.file);
            if (targetInput) targetInput.click();
          });
          reviewedBtn.replaceWith(replacementUploadBtn);
        }
      }

      const label = document.getElementById(inputId + "_name");
      if (label) label.textContent = "No file selected";
    });

    resetFinalFormButtonState();
    updateProgress();
  }

  const NOTIF_STORAGE_KEY = "elista_seen_verdicts";
  let allNotifications = [];

  function notifKey(stepNo, category, status, reviewedAt) {
    return `${stepNo}:${category}:${status}:${reviewedAt || ""}`;
  }

  function loadSeenKeys() {
    try {
      return new Set(JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }

  function saveSeenKeys(set) {
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify([...set]));
    } catch {}
  }

  function markKeyAsSeen(key) {
    const seen = loadSeenKeys();
    seen.add(key);
    saveSeenKeys(seen);
  }

  function markAllSeen() {
    const seen = loadSeenKeys();
    allNotifications.forEach(n => seen.add(n.key));
    saveSeenKeys(seen);
    allNotifications.forEach(n => { n.unread = false; });
    renderNotifDropdown();
    updateNotifBadge();
  }

  function buildNotifications(rows) {
    const seen = loadSeenKeys();
    const fresh = [];

    rows.forEach(r => {
      const status = (r.status || "").toLowerCase().trim();
      const isVerdict = status === "approved" || isRevisionStatus(status);
      if (!isVerdict) return;

      const key = notifKey(r.step_no, r.category, status, r.reviewed_at);
      const unread = !seen.has(key);

      fresh.push({
        key,
        step: Number(r.step_no),
        category: r.category,
        status,
        fileName: r.file_name || "",
        filePath: (r.file_path || "").trim(),
        uploadedAt: r.uploaded_at || null,
        reviewedAt: r.reviewed_at || null,
        revisionRemarks: r.revision_remarks || "",
        unread
      });
    });

    fresh.sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      if (a.step !== b.step) return a.step - b.step;
      return a.category.localeCompare(b.category);
    });

    allNotifications = fresh;
  }

  function updateNotifBadge() {
    const badge = document.getElementById("notifBadge");
    if (!badge) return;
    const count = allNotifications.filter(n => n.unread).length;
    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : count;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  function renderNotifDropdown() {
    const list = document.getElementById("notifList");
    if (!list) return;

    if (allNotifications.length === 0) {
      list.innerHTML = `<div class="notif-empty">No notifications yet</div>`;
      return;
    }

    list.innerHTML = allNotifications.map(n => {
      const isApproved = n.status === "approved";
      const icon = isApproved ? "✅" : "⚠️";
      const typeClass = isApproved ? "type-approved" : "type-revision";
      const unreadClass = n.unread ? "unread" : "";
      const title = isApproved
        ? `Step ${n.step} — ${n.category}: Approved`
        : `Step ${n.step} — ${n.category}: Needs Revision`;
      const sub = n.fileName
        ? `📄 ${escapeHtml(n.fileName)}`
        : `Reviewed ${formatDT(n.reviewedAt) || ""}`;

      return `
        <button class="notif-item ${typeClass} ${unreadClass}" data-key="${escapeHtml(n.key)}" type="button">
          <span class="notif-icon">${icon}</span>
          <span class="notif-content">
            <span class="notif-title">${escapeHtml(title)}</span>
            <span class="notif-sub">${sub}</span>
          </span>
          <span class="notif-dot"></span>
        </button>
      `;
    }).join("");

    list.querySelectorAll(".notif-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.key;
        const notif = allNotifications.find(n => n.key === key);
        if (!notif) return;

        markKeyAsSeen(key);
        notif.unread = false;
        renderNotifDropdown();
        updateNotifBadge();

        const dropdown = document.getElementById("notifDropdown");
        if (dropdown) dropdown.classList.add("hidden");

        if (notif.status === "approved") {
          openReviewModal({
            step: notif.step,
            category: notif.category,
            filePath: notif.filePath,
            fileName: notif.fileName,
            uploadedAt: notif.uploadedAt,
            reviewedAt: notif.reviewedAt,
            remarks: notif.revisionRemarks
          });
        } else {
          const previewEl = document.getElementById("remarksFilePreview");
          document.getElementById("remarksStepLabel").textContent = `Step ${notif.step} — ${notif.category}`;
          previewEl.innerHTML = "";

          const ext2 = getExt(notif.fileName);
          const filePath = notif.filePath;

          if (filePath) {
            if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext2)) {
              previewEl.innerHTML = `<img src="${filePath}" alt="${escapeHtml(notif.fileName)}" class="remarksFileImg">`;
            } else if (ext2 === "pdf") {
              previewEl.innerHTML = `<iframe src="${filePath}" class="remarksFilePdf" title="${escapeHtml(notif.fileName)}"></iframe>`;
            } else {
              previewEl.innerHTML = `
                <div class="remarksFileIcon">📎</div>
                <div class="remarksFileName">${escapeHtml(notif.fileName)}</div>
                <a href="${filePath}" download class="remarksDownloadBtn">⬇ Download File</a>
              `;
            }
          } else {
            previewEl.innerHTML = `<div class="remarksNoFile">No file available</div>`;
          }

          document.getElementById("remarksBody").textContent = notif.revisionRemarks.trim() || "No remarks text provided.";
          document.getElementById("remarksModal").classList.remove("hidden");
        }
      });
    });
  }

  function initNotifUI() {
    const bell = document.getElementById("notifBell");
    const dropdown = document.getElementById("notifDropdown");
    const markAllBtn = document.getElementById("notifMarkAll");
    const wrap = document.getElementById("notifWrap");

    if (!bell || !dropdown || !wrap) return;

    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.classList.contains("hidden") && !wrap.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    });

    if (markAllBtn) {
      markAllBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        markAllSeen();
      });
    }
  }

  initNotifUI();

  document.body.insertAdjacentHTML("beforeend", `
    <div id="remarksModal" class="remarksOverlay hidden">
      <div class="remarksDialog">
        <div class="remarksHeader">
          <div class="remarksHeaderTitle">
            <span>⚠️ Revision Review</span>
            <span id="remarksStepLabel" class="remarksStepLabel"></span>
          </div>
          <button id="remarksClose" type="button">✕</button>
        </div>
        <div class="remarksContent">
          <div class="remarksFileSection">
            <div class="remarksSectionTitle">📄 Uploaded File</div>
            <div id="remarksFilePreview" class="remarksFilePreview"></div>
          </div>
          <div class="remarksDivider"></div>
          <div class="remarksTextSection">
            <div class="remarksSectionTitle">💬 Remarks from Reviewer</div>
            <div id="remarksBody" class="remarksBody"></div>
          </div>
        </div>
      </div>
    </div>
  `);

  document.getElementById("remarksClose").addEventListener("click", () => {
    document.getElementById("remarksModal").classList.add("hidden");
  });
  document.getElementById("remarksModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById("remarksModal").classList.add("hidden");
    }
  });

  document.body.insertAdjacentHTML("beforeend", `
    <div id="reviewModal" class="reviewOverlay hidden">
      <div class="reviewDialog">
        <div class="reviewHeader">
          <div class="reviewHeaderTitle">
            <span>✅ Form Reviewed</span>
            <span id="reviewStepLabel" class="reviewStepLabel"></span>
          </div>
          <button id="reviewClose" type="button">✕</button>
        </div>
        <div class="reviewBody">
          <div class="reviewMeta">
            <div class="reviewMetaLeft">
              <div class="reviewFileName" id="reviewFileName"></div>
              <div class="reviewDates">
                <div class="reviewDateRow">
                  <span class="reviewDateLabel">Uploaded:</span>
                  <span id="reviewUploadedAt">—</span>
                </div>
                <div class="reviewDateRow">
                  <span class="reviewDateLabel">Reviewed:</span>
                  <span id="reviewReviewedAt">—</span>
                </div>
              </div>
            </div>
            <a class="reviewDownloadBtn" id="reviewDownloadBtn" href="#" download>⬇ Download</a>
          </div>
          <div class="reviewRemarksWrap">
            <div class="reviewRemarksTitle">💬 Encoder Remarks</div>
            <div id="reviewRemarks" class="reviewRemarksBody">—</div>
          </div>
          <div id="reviewPreview" class="reviewPreview"></div>
        </div>
      </div>
    </div>
  `);

  document.body.insertAdjacentHTML("beforeend", `
    <div id="pendingPreviewModal" class="reviewOverlay hidden">
      <div class="reviewDialog">
        <div class="reviewHeader pendingPreviewHeader">
          <div class="reviewHeaderTitle">
            <span>⏳ Pending Submission Preview</span>
            <span id="pendingPreviewStepLabel" class="reviewStepLabel"></span>
          </div>
          <button id="pendingPreviewClose" type="button">✕</button>
        </div>
        <div class="reviewBody">
          <div class="reviewMeta">
            <div class="reviewMetaLeft">
              <div class="reviewFileName" id="pendingPreviewFileName"></div>
              <div class="reviewDates">
                <div class="reviewDateRow">
                  <span class="reviewDateLabel">Uploaded:</span>
                  <span id="pendingPreviewUploadedAt">—</span>
                </div>
                <div class="reviewDateRow">
                  <span class="reviewDateLabel">Status:</span>
                  <span id="pendingPreviewStatus">PENDING</span>
                </div>
              </div>
            </div>
            <a class="reviewDownloadBtn" id="pendingPreviewDownloadBtn" href="#" download>⬇ Download</a>
          </div>
          <div class="reviewRemarksWrap">
            <div class="reviewRemarksTitle">💬 Your Remarks</div>
            <div id="pendingPreviewRemarks" class="reviewRemarksBody">—</div>
          </div>
          <div id="pendingPreviewViewer" class="reviewPreview"></div>
        </div>
      </div>
    </div>
  `);

  document.body.insertAdjacentHTML("beforeend", `
    <div id="finalFormViewModal" class="reviewOverlay hidden">
      <div class="reviewDialog">
        <div class="reviewHeader">
          <div class="reviewHeaderTitle">
            <span>📋 Final Form</span>
            <span id="finalFormViewLabel" class="reviewStepLabel"></span>
          </div>
          <button id="finalFormViewClose" type="button">✕</button>
        </div>
        <div class="reviewBody">
          <div class="reviewMeta">
            <div class="reviewMetaLeft">
              <div class="reviewFileName" id="finalFormViewFileName"></div>
              <div class="reviewDates">
                <div class="reviewDateRow">
                  <span class="reviewDateLabel">Uploaded:</span>
                  <span id="finalFormViewUploadedAt">—</span>
                </div>
                <div class="reviewDateRow">
                  <span class="reviewDateLabel">Status:</span>
                  <span id="finalFormViewStatus">—</span>
                </div>
              </div>
            </div>
            <a class="reviewDownloadBtn" id="finalFormViewDownloadBtn" href="#" download>⬇ Download</a>
          </div>
          <div class="reviewRemarksWrap">
            <div class="reviewRemarksTitle">💬 Remarks</div>
            <div id="finalFormViewRemarks" class="reviewRemarksBody">—</div>
          </div>
          <div id="finalFormViewPreview" class="reviewPreview"></div>
        </div>
      </div>
    </div>
  `);

  document.getElementById("reviewClose").addEventListener("click", () => {
    document.getElementById("reviewModal").classList.add("hidden");
  });
  document.getElementById("reviewModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) document.getElementById("reviewModal").classList.add("hidden");
  });

  document.getElementById("pendingPreviewClose").addEventListener("click", () => {
    document.getElementById("pendingPreviewModal").classList.add("hidden");
  });
  document.getElementById("pendingPreviewModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) document.getElementById("pendingPreviewModal").classList.add("hidden");
  });

  document.getElementById("finalFormViewClose").addEventListener("click", () => {
    document.getElementById("finalFormViewModal").classList.add("hidden");
  });
  document.getElementById("finalFormViewModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) document.getElementById("finalFormViewModal").classList.add("hidden");
  });

  document.body.insertAdjacentHTML("beforeend", `
    <div id="uploadPreviewModal" class="uploadPreviewOverlay hidden">
      <div class="uploadPreviewDialog">
        <div class="uploadPreviewHeader">
          <div class="uploadPreviewHeaderTitle">
            <span>📤 Review Upload Before Submit</span>
            <span id="uploadPreviewStepLabel" class="uploadPreviewStepLabel"></span>
          </div>
          <button id="uploadPreviewClose" type="button">✕</button>
        </div>
        <div class="uploadPreviewBody">
          <div class="uploadPreviewFileWrap">
            <div class="uploadPreviewSectionTitle">Selected File</div>
            <div id="uploadPreviewFileName" class="uploadPreviewFileName"></div>
            <div id="uploadPreviewViewer" class="uploadPreviewViewer"></div>
          </div>
          <div class="uploadPreviewRemarksWrap">
            <div class="uploadPreviewSectionTitle">Remarks</div>
            <textarea id="uploadPreviewRemarks" class="uploadPreviewRemarks" placeholder="Add remarks here before submitting..."></textarea>
          </div>
        </div>
        <div class="uploadPreviewFooter">
          <button type="button" id="uploadPreviewCancel" class="uploadPreviewCancelBtn">Cancel</button>
          <button type="button" id="uploadPreviewSubmit" class="uploadPreviewSubmitBtn">Submit File</button>
        </div>
      </div>
    </div>
  `);

  document.body.insertAdjacentHTML("beforeend", `
    <div id="confirmUploadModal" class="confirmUploadOverlay hidden">
      <div class="confirmUploadDialog">
        <div class="confirmUploadHeader">
          <div class="confirmUploadTitle">Confirm Submission</div>
          <button id="confirmUploadClose" type="button">✕</button>
        </div>
        <div class="confirmUploadBody">
          <div class="confirmUploadText">
            Are you sure you want to submit this file?
          </div>
          <div class="confirmUploadSummary">
            <div class="confirmUploadRow">
              <span class="confirmUploadLabel">File:</span>
              <span id="confirmUploadFile">—</span>
            </div>
            <div class="confirmUploadRow">
              <span class="confirmUploadLabel">Step:</span>
              <span id="confirmUploadStep">—</span>
            </div>
            <div class="confirmUploadRow">
              <span class="confirmUploadLabel">Category:</span>
              <span id="confirmUploadCategory">—</span>
            </div>
          </div>
        </div>
        <div class="confirmUploadFooter">
          <button type="button" id="confirmUploadCancel" class="confirmUploadCancelBtn">Go Back</button>
          <button type="button" id="confirmUploadProceed" class="confirmUploadProceedBtn">Confirm Submit</button>
        </div>
      </div>
    </div>
  `);

  document.body.insertAdjacentHTML("beforeend", `
    <div id="finalFormModal" class="finalFormOverlay hidden">
      <div class="finalFormDialog">
        <div class="finalFormHeader">
          <div class="finalFormHeaderTitle">
            <span>📋 Submit Final Form</span>
          </div>
          <button id="finalFormClose" type="button">✕</button>
        </div>
        <div class="finalFormBody">
          <div class="finalFormFileWrap">
            <div class="finalFormSectionTitle">Upload Final Form File</div>
            <input type="file" id="finalFormFileInput" accept=".pdf,.docx,.txt" style="display:none">
            <div class="finalFormDropZone" id="finalFormDropZone">
              <div class="uploadPreviewFallbackIcon">📂</div>
              <div class="finalFormDropText">Drag &amp; drop your file here, or</div>
              <button type="button" class="finalFormBrowseBtn" id="finalFormBrowseBtn">Browse File</button>
              <div class="finalFormDropNote">Accepted: PDF, DOCX, TXT</div>
            </div>
            <div id="finalFormFileName" class="finalFormFileName hidden"></div>
            <div id="finalFormViewer" class="finalFormViewer"></div>
          </div>
          <div class="finalFormRemarksWrap">
            <div class="finalFormSectionTitle">Remarks (optional)</div>
            <textarea id="finalFormRemarks" class="finalFormRemarks" placeholder="Add any final remarks..."></textarea>
          </div>
        </div>
        <div class="finalFormFooter">
          <button type="button" id="finalFormCancel" class="finalFormCancelBtn">Cancel</button>
          <button type="button" id="finalFormSubmit" class="finalFormSubmitBtn" disabled>Submit Final Form</button>
        </div>
      </div>
    </div>
  `);

  document.body.insertAdjacentHTML("beforeend", `
    <div id="finalFormConfirmModal" class="finalFormConfirmOverlay hidden">
      <div class="finalFormConfirmDialog">
        <div class="finalFormConfirmHeader">
          <div class="finalFormConfirmTitle">Confirm Final Submission</div>
          <button id="finalFormConfirmClose" type="button">✕</button>
        </div>
        <div class="finalFormConfirmBody">
          <div class="finalFormConfirmText">
            ⚠️ You are about to submit the <strong>Final Form</strong>. Are you sure you want to proceed?
          </div>
          <div class="finalFormConfirmSummary">
            <div class="finalFormConfirmRow">
              <span class="finalFormConfirmLabel">File:</span>
              <span id="finalFormConfirmFile">—</span>
            </div>
          </div>
        </div>
        <div class="finalFormConfirmFooter">
          <button type="button" id="finalFormConfirmCancel" class="finalFormCancelBtn">Go Back</button>
          <button type="button" id="finalFormConfirmProceed" class="finalFormSubmitBtn">Confirm Submit</button>
        </div>
      </div>
    </div>
  `);

  // ── ZIP Entry Preview Modal ──────────────────────────────────────────────
  document.body.insertAdjacentHTML("beforeend", `
    <div id="zipEntryPreviewModal" class="reviewOverlay hidden">
      <div class="reviewDialog zipEntryPreviewDialog">
        <div class="reviewHeader zipEntryPreviewHeader">
          <div class="reviewHeaderTitle">
            <span>🔍 File Preview</span>
            <span id="zipEntryPreviewLabel" class="reviewStepLabel"></span>
          </div>
          <div class="zipEntryPreviewHeaderActions">
            <a id="zipEntryPreviewDownload" class="reviewDownloadBtn" href="#" download>⬇ Download</a>
            <button id="zipEntryPreviewClose" type="button">✕</button>
          </div>
        </div>
        <div class="reviewBody">
          <div id="zipEntryPreviewContent" class="reviewPreview zipEntryPreviewContent">
            <div class="reviewNoFile">Loading preview…</div>
          </div>
        </div>
      </div>
    </div>
  `);

  // Close handlers for ZIP entry preview modal
  document.getElementById("zipEntryPreviewClose").addEventListener("click", () => {
    document.getElementById("zipEntryPreviewModal").classList.add("hidden");
    // Clear iframe src to stop any ongoing load
    const content = document.getElementById("zipEntryPreviewContent");
    if (content) content.innerHTML = "";
  });
  document.getElementById("zipEntryPreviewModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.add("hidden");
      const content = document.getElementById("zipEntryPreviewContent");
      if (content) content.innerHTML = "";
    }
  });

  /**
   * Opens the ZIP entry preview modal for a single file inside a final-form ZIP.
   * @param {string} zipFilePath - Server-relative path to the ZIP (e.g. uploads/user_1/final_form_...zip)
   * @param {string} entryPath   - Internal ZIP path (e.g. "Form 01: .../Social/document.pdf")
   */
  async function openZipEntryPreview(zipFilePath, entryPath) {
    const modal      = document.getElementById("zipEntryPreviewModal");
    const labelEl    = document.getElementById("zipEntryPreviewLabel");
    const contentEl  = document.getElementById("zipEntryPreviewContent");
    const dlBtn      = document.getElementById("zipEntryPreviewDownload");

    const entryName = entryPath.split("/").pop() || entryPath;
    const ext       = getExt(entryName);

    labelEl.textContent = entryName;
    contentEl.innerHTML = `<div class="reviewNoFile zipEntryLoading">⏳ Loading preview…</div>`;

    const serveUrl = `serve_zip_entry.php?file_path=${encodeURIComponent(zipFilePath)}&entry=${encodeURIComponent(entryPath)}`;
    dlBtn.href     = serveUrl;
    dlBtn.download = entryName;

    modal.classList.remove("hidden");

    // Render based on file type
    if (ext === "pdf") {
      contentEl.innerHTML = `<iframe class="reviewPdf" src="${serveUrl}" title="${escapeHtml(entryName)}"></iframe>`;
      return;
    }

    if (ext === "txt") {
      try {
        const res = await fetch(serveUrl, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const txt = await res.text();
        contentEl.innerHTML = `<pre class="reviewTxt">${escapeHtml(txt)}</pre>`;
      } catch {
        contentEl.innerHTML = `<div class="reviewNoFile">Could not load TXT preview. Use the Download button above.</div>`;
      }
      return;
    }

    if (ext === "docx") {
      if (typeof mammoth === "undefined") {
        contentEl.innerHTML = `<div class="reviewNoFile">DOCX preview requires mammoth.js (not loaded).</div>`;
        return;
      }
      try {
        const res = await fetch(serveUrl, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        contentEl.innerHTML = `<div class="reviewDocx">${result.value || "<em>Empty document.</em>"}</div>`;
      } catch {
        contentEl.innerHTML = `<div class="reviewNoFile">Could not load DOCX preview. Use the Download button above.</div>`;
      }
      return;
    }

    // Unsupported type — show a nice fallback
    contentEl.innerHTML = `
      <div class="uploadPreviewFallback">
        <div class="uploadPreviewFallbackIcon">📎</div>
        <div class="uploadPreviewFallbackName">${escapeHtml(entryName)}</div>
        <div class="uploadPreviewFallbackNote">Preview not available for .${escapeHtml(ext) || "unknown"} files. Use the Download button above.</div>
      </div>
    `;
  }

  function openFinalFormModal() {
    // Reset file state
    finalFormSelectedFile = null;
    const fileInput  = document.getElementById("finalFormFileInput");
    const dropZone   = document.getElementById("finalFormDropZone");
    const fileNameEl = document.getElementById("finalFormFileName");
    const viewer     = document.getElementById("finalFormViewer");
    const submitBtn  = document.getElementById("finalFormSubmit");

    if (fileInput)  fileInput.value = "";
    if (dropZone)   dropZone.classList.remove("drop-active");
    if (fileNameEl) { fileNameEl.textContent = ""; fileNameEl.classList.add("hidden"); }
    if (viewer)     viewer.innerHTML = "";
    if (submitBtn)  submitBtn.disabled = true;

    document.getElementById("finalFormRemarks").value = "";
    document.getElementById("finalFormModal").classList.remove("hidden");
  }

  function closeFinalFormModal() {
    document.getElementById("finalFormModal").classList.add("hidden");
    closeFinalFormConfirmModal();
  }

  function openFinalFormConfirmModal() {
    const name = finalFormSelectedFile ? finalFormSelectedFile.name : "—";
    document.getElementById("finalFormConfirmFile").textContent = name;
    document.getElementById("finalFormConfirmModal").classList.remove("hidden");
  }

  function closeFinalFormConfirmModal() {
    document.getElementById("finalFormConfirmModal").classList.add("hidden");
  }

  async function openFinalFormViewModal(data) {
    const modal = document.getElementById("finalFormViewModal");
    const label = document.getElementById("finalFormViewLabel");
    const fileNameEl = document.getElementById("finalFormViewFileName");
    const uploadedEl = document.getElementById("finalFormViewUploadedAt");
    const statusEl = document.getElementById("finalFormViewStatus");
    const remarksEl = document.getElementById("finalFormViewRemarks");
    const previewEl = document.getElementById("finalFormViewPreview");
    const dlBtn = document.getElementById("finalFormViewDownloadBtn");

    label.textContent = currentCycleId ? `Cycle ${currentCycleId}` : "";
    fileNameEl.textContent = data.file_name || "Final Form";
    uploadedEl.textContent = formatDT(data.uploaded_at);
    statusEl.textContent = (data.status || "pending").toUpperCase();
    remarksEl.textContent = String(data.upload_remarks || data.revision_remarks || "").trim() || "—";

    previewEl.innerHTML = "";

    if (data.file_path) {
      dlBtn.href = data.file_path;
      dlBtn.classList.remove("hidden");
    } else {
      dlBtn.href = "#";
      dlBtn.classList.add("hidden");
    }

    if (!data.file_path) {
      previewEl.innerHTML = `<div class="reviewNoFile">No file available.</div>`;
      modal.classList.remove("hidden");
      return;
    }

    const ext = getExt(data.file_name);

    if (ext === "zip") {
      await loadZipBrowser(previewEl, data.file_path);
      modal.classList.remove("hidden");
      return;
    }

    if (ext === "pdf") {
      previewEl.innerHTML = `<iframe class="reviewPdf" src="${data.file_path}" title="${escapeHtml(data.file_name)}"></iframe>`;
      modal.classList.remove("hidden");
      return;
    }

    if (ext === "txt") {
      try {
        const res = await fetch(data.file_path, { cache: "no-store" });
        const txt = await res.text();
        previewEl.innerHTML = `<pre class="reviewTxt">${escapeHtml(txt)}</pre>`;
      } catch {
        previewEl.innerHTML = `<div class="reviewNoFile">Could not load TXT preview. You can still download it.</div>`;
      }
      modal.classList.remove("hidden");
      return;
    }

    if (ext === "docx") {
      if (typeof mammoth === "undefined") {
        previewEl.innerHTML = `<div class="reviewNoFile">DOCX preview requires mammoth.js.</div>`;
        modal.classList.remove("hidden");
        return;
      }

      try {
        const res = await fetch(data.file_path, { cache: "no-store" });
        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        previewEl.innerHTML = `<div class="reviewDocx">${result.value || ""}</div>`;
      } catch {
        previewEl.innerHTML = `<div class="reviewNoFile">Could not load DOCX preview. You can still download it.</div>`;
      }

      modal.classList.remove("hidden");
      return;
    }

    previewEl.innerHTML = `<div class="reviewNoFile">Preview not supported for this file type. Please download to view.</div>`;
    modal.classList.remove("hidden");
  }

  const finalFormBtn = document.getElementById("finalFormBtn");
  if (finalFormBtn) {
    finalFormBtn.addEventListener("click", () => {
      if (finalFormBtn.disabled) return;

      if (finalFormBtn.classList.contains("submitted") && currentFinalFormData) {
        openFinalFormViewModal(currentFinalFormData);
        return;
      }

      openFinalFormModal();
    });
  }

  document.getElementById("finalFormClose").addEventListener("click", closeFinalFormModal);
  document.getElementById("finalFormCancel").addEventListener("click", closeFinalFormModal);
  document.getElementById("finalFormModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeFinalFormModal();
  });

  // ── Final Form file picker / drag-drop wiring ─────────────────────────────
  (function initFinalFormFilePicker() {
    const FINAL_ALLOWED_EXTS = ["pdf", "docx", "txt"];

    async function applyFinalFormFile(file) {
      if (!file) return;

      const ext = getExt(file.name);
      if (!FINAL_ALLOWED_EXTS.includes(ext)) {
        alert("Only PDF, DOCX, and TXT files are allowed.");
        return;
      }

      finalFormSelectedFile = file;

      const dropZone   = document.getElementById("finalFormDropZone");
      const fileNameEl = document.getElementById("finalFormFileName");
      const viewer     = document.getElementById("finalFormViewer");
      const submitBtn  = document.getElementById("finalFormSubmit");

      if (dropZone)   dropZone.classList.add("drop-active");
      if (fileNameEl) { fileNameEl.textContent = file.name; fileNameEl.classList.remove("hidden"); }
      if (submitBtn)  submitBtn.disabled = false;

      // Preview the file exactly like the regular upload preview
      if (!viewer) return;
      viewer.innerHTML = `<div class="uploadPreviewLoading">Loading preview...</div>`;

      try {
        if (ext === "pdf") {
          const url = URL.createObjectURL(file);
          viewer.innerHTML = `<iframe src="${url}" class="uploadPreviewPdf" title="${escapeHtml(file.name)}"></iframe>`;
        } else if (ext === "txt") {
          const text = await file.text();
          viewer.innerHTML = `<pre class="uploadPreviewText">${escapeHtml(text)}</pre>`;
        } else if (ext === "docx") {
          if (typeof mammoth === "undefined") {
            viewer.innerHTML = `
              <div class="uploadPreviewFallback">
                <div class="uploadPreviewFallbackIcon">⚠️</div>
                <div class="uploadPreviewFallbackName">${escapeHtml(file.name)}</div>
                <div class="uploadPreviewFallbackNote">DOCX preview requires mammoth.js.</div>
              </div>`;
          } else {
            const arrayBuffer = await file.arrayBuffer();
            const result      = await mammoth.convertToHtml({ arrayBuffer });
            viewer.innerHTML  = `<div class="uploadPreviewDocx">${result.value || "<em>No preview.</em>"}</div>`;
          }
        } else {
          viewer.innerHTML = `
            <div class="uploadPreviewFallback">
              <div class="uploadPreviewFallbackIcon">📎</div>
              <div class="uploadPreviewFallbackName">${escapeHtml(file.name)}</div>
              <div class="uploadPreviewFallbackNote">Preview not available for this file type.</div>
            </div>`;
        }
      } catch {
        viewer.innerHTML = `
          <div class="uploadPreviewFallback">
            <div class="uploadPreviewFallbackIcon">⚠️</div>
            <div class="uploadPreviewFallbackName">${escapeHtml(file.name)}</div>
            <div class="uploadPreviewFallbackNote">Could not generate a preview.</div>
          </div>`;
      }
    }

    // Hidden file input → browse button
    const fileInput  = document.getElementById("finalFormFileInput");
    const browseBtn  = document.getElementById("finalFormBrowseBtn");
    const dropZoneEl = document.getElementById("finalFormDropZone");

    browseBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (file) applyFinalFormFile(file);
    });

    // Drag-and-drop onto drop zone
    dropZoneEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZoneEl.classList.add("drag-over");
    });

    dropZoneEl.addEventListener("dragleave", () => {
      dropZoneEl.classList.remove("drag-over");
    });

    dropZoneEl.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZoneEl.classList.remove("drag-over");
      const file = e.dataTransfer?.files?.[0];
      if (file) applyFinalFormFile(file);
    });
  })();

  document.getElementById("finalFormConfirmClose").addEventListener("click", closeFinalFormConfirmModal);
  document.getElementById("finalFormConfirmCancel").addEventListener("click", closeFinalFormConfirmModal);
  document.getElementById("finalFormConfirmModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeFinalFormConfirmModal();
  });

  document.getElementById("finalFormSubmit").addEventListener("click", () => {
    if (!finalFormSelectedFile) {
      alert("Please select a file to upload first.");
      return;
    }
    openFinalFormConfirmModal();
  });

  document.getElementById("finalFormConfirmProceed").addEventListener("click", async () => {
    const submitBtn  = document.getElementById("finalFormSubmit");
    const proceedBtn = document.getElementById("finalFormConfirmProceed");
    const remarks    = document.getElementById("finalFormRemarks").value.trim();

    if (!finalFormSelectedFile) {
      alert("No file selected. Please choose a file first.");
      closeFinalFormConfirmModal();
      return;
    }

    const formData = new FormData();
    formData.append("file",     finalFormSelectedFile);
    formData.append("remarks",  remarks);
    formData.append("cycle_id", currentCycleId || "");

    try {
      submitBtn.disabled  = true;
      proceedBtn.disabled = true;
      submitBtn.textContent  = "Uploading...";
      proceedBtn.textContent = "Uploading...";

      const res  = await fetch("upload_final.php", { method: "POST", body: formData });
      const text = await res.text();
      let data   = null;

      try { data = JSON.parse(text); } catch { data = null; }

      if (!res.ok || !data || !data.ok) {
        alert("Final Form submission failed: " + (data?.error || text || "Unknown error"));
        return;
      }

      closeFinalFormConfirmModal();
      closeFinalFormModal();
      alert("✅ Final Form submitted successfully! It is now pending for review.");

      currentFinalFormData = {
        submitted:        true,
        status:           data.status         || "pending",
        file_name:        data.file_name       || finalFormSelectedFile.name,
        file_path:        data.file_path       || "",
        uploaded_at:      data.uploaded_at     || new Date().toISOString(),
        upload_remarks:   remarks,
        revision_remarks: ""
      };

      finalFormSelectedFile = null;

      if (finalFormBtn) {
        finalFormBtn.textContent = "📋 Final Form Submitted";
        finalFormBtn.classList.add("submitted");
        finalFormBtn.classList.remove("locked");
        finalFormBtn.disabled = false;
        finalFormBtn.title    = "Click to view submitted Final Form";
      }
    } catch (err) {
      alert("Final Form upload error: " + err.message);
    } finally {
      submitBtn.disabled  = false;
      proceedBtn.disabled = false;
      submitBtn.textContent  = "Submit Final Form";
      proceedBtn.textContent = "Confirm Submit";
    }
  });

  document.getElementById("uploadPreviewClose").addEventListener("click", closeUploadPreviewModal);
  document.getElementById("uploadPreviewCancel").addEventListener("click", closeUploadPreviewModal);
  document.getElementById("uploadPreviewModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeUploadPreviewModal();
  });

  document.getElementById("confirmUploadClose").addEventListener("click", closeConfirmUploadModal);
  document.getElementById("confirmUploadCancel").addEventListener("click", closeConfirmUploadModal);
  document.getElementById("confirmUploadModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeConfirmUploadModal();
  });

  function closeUploadPreviewModal() {
    document.getElementById("uploadPreviewModal").classList.add("hidden");
    closeConfirmUploadModal();
  }

  function openConfirmUploadModal() {
    if (!pendingUpload.file) return;
    document.getElementById("confirmUploadFile").textContent = pendingUpload.file.name || "—";
    document.getElementById("confirmUploadStep").textContent = pendingUpload.stepNo || "—";
    document.getElementById("confirmUploadCategory").textContent = pendingUpload.category || "—";
    document.getElementById("confirmUploadModal").classList.remove("hidden");
  }

  function closeConfirmUploadModal() {
    document.getElementById("confirmUploadModal").classList.add("hidden");
  }

  async function openUploadPreviewModal({ file, stepNo, category }) {
    const viewer = document.getElementById("uploadPreviewViewer");
    const fileNameEl = document.getElementById("uploadPreviewFileName");
    const remarksEl = document.getElementById("uploadPreviewRemarks");
    const stepLabel = document.getElementById("uploadPreviewStepLabel");
    const ext = getExt(file.name);

    stepLabel.textContent = `Step ${stepNo} — ${category}`;
    fileNameEl.textContent = file.name;
    remarksEl.value = "";
    viewer.innerHTML = `<div class="uploadPreviewLoading">Loading preview...</div>`;

    try {
      if (ext === "pdf") {
        const url = URL.createObjectURL(file);
        viewer.innerHTML = `<iframe src="${url}" class="uploadPreviewPdf" title="${escapeHtml(file.name)}"></iframe>`;
      } else if (ext === "txt") {
        const text = await file.text();
        viewer.innerHTML = `<pre class="uploadPreviewText">${escapeHtml(text)}</pre>`;
      } else if (ext === "docx") {
        if (typeof mammoth === "undefined") {
          viewer.innerHTML = `
            <div class="uploadPreviewFallback">
              <div class="uploadPreviewFallbackIcon">⚠️</div>
              <div class="uploadPreviewFallbackName">${escapeHtml(file.name)}</div>
              <div class="uploadPreviewFallbackNote">DOCX preview requires mammoth.js.</div>
            </div>
          `;
        } else {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          viewer.innerHTML = `<div class="uploadPreviewDocx">${result.value || "<em>No preview available.</em>"}</div>`;
        }
      } else {
        viewer.innerHTML = `
          <div class="uploadPreviewFallback">
            <div class="uploadPreviewFallbackIcon">📎</div>
            <div class="uploadPreviewFallbackName">${escapeHtml(file.name)}</div>
            <div class="uploadPreviewFallbackNote">Preview not available for this file type.</div>
          </div>
        `;
      }
    } catch {
      viewer.innerHTML = `
        <div class="uploadPreviewFallback">
          <div class="uploadPreviewFallbackIcon">⚠️</div>
          <div class="uploadPreviewFallbackName">${escapeHtml(file.name)}</div>
          <div class="uploadPreviewFallbackNote">Could not preview file.</div>
        </div>
      `;
    }

    document.getElementById("uploadPreviewModal").classList.remove("hidden");
  }

  async function openReviewModal({ step, category, filePath, fileName, uploadedAt, reviewedAt, remarks }) {
    const modal = document.getElementById("reviewModal");
    const preview = document.getElementById("reviewPreview");
    const label = document.getElementById("reviewStepLabel");
    const nameEl = document.getElementById("reviewFileName");
    const dlBtn = document.getElementById("reviewDownloadBtn");
    const upEl = document.getElementById("reviewUploadedAt");
    const revEl = document.getElementById("reviewReviewedAt");
    const remEl = document.getElementById("reviewRemarks");

    label.textContent = `Step ${step} — ${category}`;
    nameEl.textContent = fileName || "Untitled file";
    preview.innerHTML = "";
    if (upEl) upEl.textContent = formatDT(uploadedAt);
    if (revEl) revEl.textContent = formatDT(reviewedAt);
    if (remEl) remEl.textContent = String(remarks || "").trim() || "—";

    if (filePath) {
      dlBtn.href = filePath;
      dlBtn.classList.remove("hidden");
    } else {
      dlBtn.href = "#";
      dlBtn.classList.add("hidden");
    }

    if (!filePath) {
      preview.innerHTML = `<div class="reviewNoFile">No file available.</div>`;
      modal.classList.remove("hidden");
      return;
    }

    const ext = getExt(fileName);

    if (ext === "pdf") {
      preview.innerHTML = `<iframe class="reviewPdf" src="${filePath}" title="${escapeHtml(fileName)}"></iframe>`;
      modal.classList.remove("hidden");
      return;
    }

    if (ext === "txt") {
      try {
        const res = await fetch(filePath, { cache: "no-store" });
        const txt = await res.text();
        preview.innerHTML = `<pre class="reviewTxt">${escapeHtml(txt)}</pre>`;
      } catch {
        preview.innerHTML = `<div class="reviewNoFile">Could not load TXT preview. You can still download it.</div>`;
      }
      modal.classList.remove("hidden");
      return;
    }

    if (ext === "docx") {
      if (typeof mammoth === "undefined") {
        preview.innerHTML = `<div class="reviewNoFile">DOCX preview requires mammoth.js.</div>`;
        modal.classList.remove("hidden");
        return;
      }

      try {
        const res = await fetch(filePath, { cache: "no-store" });
        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        preview.innerHTML = `<div class="reviewDocx">${result.value || ""}</div>`;
      } catch {
        preview.innerHTML = `<div class="reviewNoFile">Could not load DOCX preview. You can still download it.</div>`;
      }

      modal.classList.remove("hidden");
      return;
    }

    preview.innerHTML = `<div class="reviewNoFile">Preview not supported for this file type. Please download to view.</div>`;
    modal.classList.remove("hidden");
  }

  async function openPendingPreviewModal({ step, category, filePath, fileName, uploadedAt, remarks }) {
    const modal = document.getElementById("pendingPreviewModal");
    const preview = document.getElementById("pendingPreviewViewer");
    const label = document.getElementById("pendingPreviewStepLabel");
    const nameEl = document.getElementById("pendingPreviewFileName");
    const dlBtn = document.getElementById("pendingPreviewDownloadBtn");
    const upEl = document.getElementById("pendingPreviewUploadedAt");
    const remEl = document.getElementById("pendingPreviewRemarks");
    const statusEl = document.getElementById("pendingPreviewStatus");

    label.textContent = `Step ${step} — ${category}`;
    nameEl.textContent = fileName || "Untitled file";
    upEl.textContent = formatDT(uploadedAt);
    remEl.textContent = String(remarks || "").trim() || "—";
    statusEl.textContent = "PENDING";
    preview.innerHTML = "";

    if (filePath) {
      dlBtn.href = filePath;
      dlBtn.classList.remove("hidden");
    } else {
      dlBtn.href = "#";
      dlBtn.classList.add("hidden");
    }

    if (!filePath) {
      preview.innerHTML = `<div class="reviewNoFile">No file available.</div>`;
      modal.classList.remove("hidden");
      return;
    }

    const ext = getExt(fileName);

    if (ext === "pdf") {
      preview.innerHTML = `<iframe class="reviewPdf" src="${filePath}" title="${escapeHtml(fileName)}"></iframe>`;
      modal.classList.remove("hidden");
      return;
    }

    if (ext === "txt") {
      try {
        const res = await fetch(filePath, { cache: "no-store" });
        const txt = await res.text();
        preview.innerHTML = `<pre class="reviewTxt">${escapeHtml(txt)}</pre>`;
      } catch {
        preview.innerHTML = `<div class="reviewNoFile">Could not load TXT preview. You can still download it.</div>`;
      }
      modal.classList.remove("hidden");
      return;
    }

    if (ext === "docx") {
      if (typeof mammoth === "undefined") {
        preview.innerHTML = `<div class="reviewNoFile">DOCX preview requires mammoth.js.</div>`;
        modal.classList.remove("hidden");
        return;
      }

      try {
        const res = await fetch(filePath, { cache: "no-store" });
        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        preview.innerHTML = `<div class="reviewDocx">${result.value || ""}</div>`;
      } catch {
        preview.innerHTML = `<div class="reviewNoFile">Could not load DOCX preview. You can still download it.</div>`;
      }

      modal.classList.remove("hidden");
      return;
    }

    preview.innerHTML = `<div class="reviewNoFile">Preview not supported for this file type. Please download to view.</div>`;
    modal.classList.remove("hidden");
  }

  function createCard(step, category) {
    const stepNo = Number(step);

    if (SKIP_STEPS.includes(stepNo) && SKIP_CATS.includes(category)) {
      return `
        <div class="card no-submit noSubmission" data-step="${stepNo}" data-category="${category}">
          <div class="cardLabel">${category}</div>
          <div class="noSubmitText">No submission needed</div>
        </div>
      `;
    }

    const inputId = `file_${stepNo}_${safeId(category)}`;

    // MLGOO: view-only — no file input, no upload button
    if (IS_MLGOO) {
      return `
        <div class="card missing" data-step="${stepNo}" data-category="${category}">
          <div class="cardLabel">${category}</div>
          <div class="mark">✕</div>
          <button class="previewPendingBtn hidden" type="button">View Submission</button>
          <button class="remarksBtn hidden" type="button">📋 View Remarks</button>
          <div class="fileName" id="${inputId}_name">No file submitted</div>
        </div>
      `;
    }

    return `
      <div class="card missing" data-step="${stepNo}" data-category="${category}">
        <div class="cardLabel">${category}</div>
        <div class="mark">✕</div>
        <input type="file" class="fileInput" id="${inputId}" accept="${ACCEPT_ATTR}">
        <button class="uploadBtn" type="button" data-file="${inputId}">Upload File</button>
        <button class="previewPendingBtn hidden" type="button">View Submission</button>
        <button class="remarksBtn hidden" type="button">📋 View Remarks</button>
        <div class="fileName" id="${inputId}_name">No file selected</div>
      </div>
    `;
  }

  for (let step = 1; step <= 20; step++) {
    const cardsHTML = categories.map(cat => createCard(step, cat)).join("");
    const title = stepTitles[step - 1] || `Step ${step}`;

    stepsContainer.insertAdjacentHTML("beforeend", `
      <div class="step" data-step="${step}">
        <div class="stepHeader">
          <div class="stepName">${step}. ${title}</div>
        </div>
        <div class="cards">${cardsHTML}</div>
      </div>
    `);
  }

  document.querySelectorAll(".uploadBtn").forEach(button => {
    if (IS_MLGOO) return;
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.file);
      if (input) input.click();
    });
  });

  document.querySelectorAll(".fileInput").forEach(input => {
    if (IS_MLGOO) return;
    input.addEventListener("change", async () => {
      if (!input.files.length) return;

      const card = input.closest(".card");
      const label = document.getElementById(input.id + "_name");
      const file = input.files[0];
      const ext = getExt(file.name);

      if (!ALLOWED_EXTS.includes(ext)) {
        alert("⚠️ Only PDF, DOCX, and TXT files are allowed.");
        input.value = "";
        if (label) label.textContent = "No file selected";
        return;
      }

      const stepNo = card.dataset.step;
      const category = card.dataset.category;

      pendingUpload = { input, card, file, stepNo, category };
      await openUploadPreviewModal({ file, stepNo, category });
    });
  });

  document.getElementById("uploadPreviewSubmit").addEventListener("click", () => {
    if (!pendingUpload.file || !pendingUpload.card) return;
    openConfirmUploadModal();
  });

  document.getElementById("confirmUploadProceed").addEventListener("click", async () => {
    if (!pendingUpload.file || !pendingUpload.card) return;

    const { input, card, file, stepNo, category } = pendingUpload;
    const remarks = document.getElementById("uploadPreviewRemarks").value.trim();
    const label = document.getElementById(input.id + "_name");
    const submitBtn = document.getElementById("uploadPreviewSubmit");
    const confirmBtn = document.getElementById("confirmUploadProceed");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("step_no", stepNo);
    formData.append("category", category);
    formData.append("remarks", remarks);
    formData.append("cycle_id", currentCycleId || "");

    try {
      submitBtn.disabled = true;
      confirmBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
      confirmBtn.textContent = "Submitting...";

      const res = await fetch("upload.php", {
        method: "POST",
        body: formData
      });

      const text = await res.text();
      if (!res.ok) {
        alert("Upload failed: " + text);
        return;
      }

      const uploadData = JSON.parse(text);
      if (label) label.textContent = file.name;

      const existingReviewedBtn = card.querySelector(".reviewedBtn");
      if (existingReviewedBtn) {
        const inputId = input.id;
        const replacementUploadBtn = document.createElement("button");
        replacementUploadBtn.type = "button";
        replacementUploadBtn.className = "uploadBtn";
        replacementUploadBtn.dataset.file = inputId;
        replacementUploadBtn.textContent = "Upload File";
        replacementUploadBtn.addEventListener("click", () => {
          const targetInput = document.getElementById(replacementUploadBtn.dataset.file);
          if (targetInput) targetInput.click();
        });
        existingReviewedBtn.replaceWith(replacementUploadBtn);
      }

      card.classList.remove("missing", "approved", "with-revision");
      card.classList.add("pending");

      const mark = card.querySelector(".mark");
      if (mark) mark.textContent = "⋯";

      const remarksBtn = card.querySelector(".remarksBtn");
      if (remarksBtn) remarksBtn.classList.add("hidden");

      const previewPendingBtn = card.querySelector(".previewPendingBtn");
      if (previewPendingBtn) {
        previewPendingBtn.classList.remove("hidden");
        previewPendingBtn.onclick = () => {
          openPendingPreviewModal({
            step: stepNo,
            category,
            filePath: uploadData.file_path || "",
            fileName: uploadData.file_name || file.name,
            uploadedAt: new Date().toISOString(),
            remarks
          });
        };
      }

      closeConfirmUploadModal();
      closeUploadPreviewModal();
      updateProgress();

      alert("Upload successful! Your submission is now pending for review.");

      input.value = "";
      pendingUpload = { input: null, card: null, file: null, stepNo: null, category: null };
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      submitBtn.disabled = false;
      confirmBtn.disabled = false;
      submitBtn.textContent = "Submit File";
      confirmBtn.textContent = "Confirm Submit";
    }
  });

  function isRevisionStatus(status) {
    const s = (status || "").toLowerCase().trim();
    return (
      s === "with revisions" ||
      s === "with revision" ||
      s === "with_revision" ||
      s === "with-revision" ||
      s === "revision" ||
      s === "revisions" ||
      s === "needs revision" ||
      s === "needs revisions"
    );
  }

  async function syncFromDatabase() {
    try {
      const url = currentCycleId
        ? `load_progress.php?cycle_id=${encodeURIComponent(currentCycleId)}`
        : "load_progress.php";

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;

      const rows = await res.json();
      if (!Array.isArray(rows)) {
        console.error("load_progress.php returned unexpected data:", rows);
        return;
      }

      rows.forEach(r => {
        const step = String(r.step_no);
        const cat = r.category;
        const status = (r.status || "").toLowerCase().trim();
        const fileName = r.file_name || null;

        const card = document.querySelector(`.card[data-step="${step}"][data-category="${cat}"]`);
        if (!card) return;
        if (card.classList.contains("no-submit") || card.classList.contains("noSubmission")) return;

        const inputId = `file_${step}_${safeId(cat)}`;
        const label = document.getElementById(inputId + "_name");
        if (label && fileName) label.textContent = fileName;

        card.classList.remove("missing", "pending", "approved", "with-revision");

        const remarksBtn = card.querySelector(".remarksBtn");
        const remarks = (r.revision_remarks || "").trim();
        const previewPendingBtn = card.querySelector(".previewPendingBtn");
        const uploadRemarks = (r.upload_remarks || "").trim();

        if (status === "approved") {
          card.classList.add("approved");
          card.querySelector(".mark").textContent = "✓";
          if (remarksBtn) remarksBtn.classList.add("hidden");
          if (previewPendingBtn) {
            previewPendingBtn.classList.add("hidden");
            previewPendingBtn.onclick = null;
          }

          const oldReviewed = card.querySelector(".reviewedBtn");
if (!oldReviewed) {
  const uploadBtn = card.querySelector(".uploadBtn");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "reviewedBtn";
  btn.textContent = "Form Reviewed";
  btn.addEventListener("click", () => {
    openReviewModal({
      step,
      category: cat,
      filePath: (r.file_path || "").trim(),
      fileName: (r.file_name || "").trim(),
      uploadedAt: r.uploaded_at || null,
      reviewedAt: r.reviewed_at || null,
      remarks: r.revision_remarks || ""
    });
  });
  if (uploadBtn) {
    uploadBtn.replaceWith(btn);
  } else {
    // MLGOO cards have no uploadBtn — insert after .mark
    const mark = card.querySelector(".mark");
    if (mark) mark.insertAdjacentElement("afterend", btn);
  }
}
        } 
        
        else if (isRevisionStatus(status)) {
          card.classList.add("with-revision");
          card.querySelector(".mark").textContent = "⚠";
          if (previewPendingBtn) {
            previewPendingBtn.classList.add("hidden");
            previewPendingBtn.onclick = null;
          }

          const reviewedBtn = card.querySelector(".reviewedBtn");
          if (reviewedBtn) {
            if (IS_MLGOO) {
              reviewedBtn.remove();
            } else {
              const replacementUploadBtn = document.createElement("button");
              replacementUploadBtn.type = "button";
              replacementUploadBtn.className = "uploadBtn";
              replacementUploadBtn.dataset.file = inputId;
              replacementUploadBtn.textContent = "Upload File";
              replacementUploadBtn.addEventListener("click", () => {
                const targetInput = document.getElementById(replacementUploadBtn.dataset.file);
                if (targetInput) targetInput.click();
              });
              reviewedBtn.replaceWith(replacementUploadBtn);
            }
          }

          if (remarksBtn) {
            remarksBtn.classList.remove("hidden");
            remarksBtn.onclick = () => {
              const filePath = (r.file_path || "").trim();
              const fileName2 = (r.file_name || "").trim();
              const ext2 = getExt(fileName2);
              const previewEl = document.getElementById("remarksFilePreview");

              document.getElementById("remarksStepLabel").textContent = `Step ${step} — ${cat}`;
              previewEl.innerHTML = "";

              if (filePath) {
                if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext2)) {
                  previewEl.innerHTML = `<img src="${filePath}" alt="${escapeHtml(fileName2)}" class="remarksFileImg">`;
                } else if (ext2 === "pdf") {
                  previewEl.innerHTML = `<iframe src="${filePath}" class="remarksFilePdf" title="${escapeHtml(fileName2)}"></iframe>`;
                } else {
                  previewEl.innerHTML = `
                    <div class="remarksFileIcon">📎</div>
                    <div class="remarksFileName">${escapeHtml(fileName2)}</div>
                    <a href="${filePath}" download class="remarksDownloadBtn">⬇ Download File</a>
                  `;
                }
              } else {
                previewEl.innerHTML = `<div class="remarksNoFile">No file available</div>`;
              }

              document.getElementById("remarksBody").textContent = remarks || "No remarks text provided.";
              document.getElementById("remarksModal").classList.remove("hidden");
            };
          }
        } else {
          card.classList.add("pending");
          card.querySelector(".mark").textContent = "⋯";
          if (remarksBtn) remarksBtn.classList.add("hidden");

          const reviewedBtn = card.querySelector(".reviewedBtn");
          if (reviewedBtn) {
            if (IS_MLGOO) {
              reviewedBtn.remove();
            } else {
              const replacementUploadBtn = document.createElement("button");
              replacementUploadBtn.type = "button";
              replacementUploadBtn.className = "uploadBtn";
              replacementUploadBtn.dataset.file = inputId;
              replacementUploadBtn.textContent = "Upload File";
              replacementUploadBtn.addEventListener("click", () => {
                const targetInput = document.getElementById(replacementUploadBtn.dataset.file);
                if (targetInput) targetInput.click();
              });
              reviewedBtn.replaceWith(replacementUploadBtn);
            }
          }

          const previewBtnNow = card.querySelector(".previewPendingBtn");
          if (previewBtnNow) {
            previewBtnNow.classList.remove("hidden");
            previewBtnNow.onclick = () => {
              openPendingPreviewModal({
                step,
                category: cat,
                filePath: (r.file_path || "").trim(),
                fileName: (r.file_name || "").trim(),
                uploadedAt: r.uploaded_at || null,
                remarks: uploadRemarks
              });
            };
          }
        }
      });

      updateProgress();
      buildNotifications(rows);
      renderNotifDropdown();
      updateNotifBadge();
      checkFinalFormStatus();
    } catch (e) {
      console.error("syncFromDatabase error:", e);
    }
  }

  function updateProgress() {
    const cards = document.querySelectorAll(".card");

    const requiredCards = [...cards].filter(c =>
      !c.classList.contains("no-submit") && !c.classList.contains("noSubmission")
    );

    const isSpecial = (card) => {
      const step = Number(card.dataset.step);
      const cat = String(card.dataset.category || "");
      return SPECIAL_STEPS.includes(step) && cat === SPECIAL_CATEGORY;
    };

    const specialCards = requiredCards.filter(isSpecial);
    const normalCards = requiredCards.filter(c => !isSpecial(c));

    const specialApproved = specialCards.filter(c => c.classList.contains("approved")).length;
    const normalApproved = normalCards.filter(c => c.classList.contains("approved")).length;

    const bonusPct = specialApproved * SPECIAL_BONUS_PER;
    const normalPct = normalCards.length > 0
      ? (normalApproved / normalCards.length) * NORMAL_TOTAL_PERCENT
      : 0;

    let pct = Math.round(normalPct + bonusPct);
    if (pct > 100) pct = 100;
    if (pct < 0) pct = 0;

    const overallPercent = document.getElementById("overallPercent");
    const overallNote = document.getElementById("overallNote");

    if (overallPercent) overallPercent.textContent = pct + "%";
    if (overallNote) overallNote.textContent = `${normalApproved + specialApproved} of ${requiredCards.length} approved`;

    const ringFill = document.getElementById("progressRingFill");
    const ringPercent = document.getElementById("ringPercent");
    if (ringFill) {
      const circumference = 571.77;
      ringFill.style.strokeDashoffset = circumference - (pct / 100) * circumference;
    }
    if (ringPercent) ringPercent.textContent = pct + "%";

    // No cycle = everything locked, including step 1
    if (!currentCycleId) {
      for (let step = 1; step <= 20; step++) {
        const el = document.querySelector(`.step[data-step="${step}"]`);
        if (el) el.classList.add("locked");
      }

      // Show a banner prompting the user to create a cycle
      let banner = document.getElementById("noCycleBanner");
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "noCycleBanner";
        banner.className = "no-cycle-banner";
        banner.innerHTML = `
          <span class="no-cycle-icon">🔒</span>
          <span>No planning cycle found for your municipality.
            ${IS_MLGOO ? "" : `<button type="button" class="no-cycle-create-btn" id="noCycleBannerBtn">
              Create a Cycle
            </button>
            to get started.`}
          </span>
        `;
        const stepsEl = document.getElementById("stepsContainer");
        if (stepsEl) stepsEl.parentNode.insertBefore(banner, stepsEl);

        if (!IS_MLGOO) {
          document.getElementById("noCycleBannerBtn")?.addEventListener("click", () => {
            openNewCycleModal();
          });
        }
      }
      banner.classList.remove("hidden");
      return;
    }

    // Hide banner if a cycle now exists
    const banner = document.getElementById("noCycleBanner");
    if (banner) banner.classList.add("hidden");

    for (let step = 1; step <= 20; step++) {
      const currentStepEl = document.querySelector(`.step[data-step="${step}"]`);
      if (!currentStepEl) continue;

      if (step === 1) {
        currentStepEl.classList.remove("locked");
        continue;
      }

      const prevStepEl = document.querySelector(`.step[data-step="${step - 1}"]`);
      if (!prevStepEl) continue;

      const prevRequiredCards = [...prevStepEl.querySelectorAll(".card")].filter(c =>
        !c.classList.contains("no-submit") && !c.classList.contains("noSubmission")
      );

      const allApproved = prevRequiredCards.every(card => card.classList.contains("approved"));

      if (allApproved) currentStepEl.classList.remove("locked");
      else currentStepEl.classList.add("locked");
    }

    const allRequiredCards = [...document.querySelectorAll(".card")].filter(c =>
      !c.classList.contains("no-submit") && !c.classList.contains("noSubmission")
    );
    const allApprovedOverall = allRequiredCards.length > 0 &&
      allRequiredCards.every(c => c.classList.contains("approved"));

    const finalBtn = document.getElementById("finalFormBtn");
    if (finalBtn && !finalBtn.classList.contains("submitted")) {
      if (allApprovedOverall) {
        finalBtn.disabled = false;
        finalBtn.classList.remove("locked");
        finalBtn.title = "Generate the Final Form";
      } else {
        finalBtn.disabled = true;
        finalBtn.classList.add("locked");
        finalBtn.title = "All forms must be approved before submitting the Final Form";
      }
    }
  }

  async function checkFinalFormStatus() {
    const finalBtn = document.getElementById("finalFormBtn");
    if (!finalBtn) return;

    if (!currentCycleId) {
      resetFinalFormButtonState();
      return;
    }

    try {
      const res = await fetch(`load_final_form_status.php?cycle_id=${encodeURIComponent(currentCycleId)}`, {
        cache: "no-store"
      });
      if (!res.ok) return;

      const data = await res.json();

      if (data.submitted) {
        currentFinalFormData = data;
        finalBtn.textContent = data.status === "approved"
          ? "📋 Final Form Approved"
          : "📋 Final Form Submitted";
        finalBtn.classList.add("submitted");
        finalBtn.classList.remove("locked");
        finalBtn.disabled = false;
        finalBtn.title = "Click to view submitted Final Form";
      } else {
        currentFinalFormData = null;
        finalBtn.classList.remove("submitted");
        finalBtn.textContent = "📋 Final Form";
        updateProgress();
      }
    } catch {
      currentFinalFormData = null;
      finalBtn.classList.remove("submitted");
      finalBtn.textContent = "📋 Final Form";
      updateProgress();
    }
  }

  initCycleFilterUI();

  loadCycles().then(() => {
    updateProgress();
    syncFromDatabase();
    setInterval(syncFromDatabase, 10000);
  });
});