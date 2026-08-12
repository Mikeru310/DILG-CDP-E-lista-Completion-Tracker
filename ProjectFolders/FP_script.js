const municipalities = [
  "Altavas","Balete","Banga","Batan","Buruanga","Ibajay","Kalibo","Lezo","Libacao",
  "Madalag","Makato","Malay","Malinao","Nabas","New Washington","Numancia","Tangalan"
];

const municipalityIds = {
  "Altavas": 1,
  "Balete": 2,
  "Banga": 3,
  "Batan": 4,
  "Buruanga": 5,
  "Ibajay": 6,
  "Kalibo": 7,
  "Lezo": 8,
  "Libacao": 9,
  "Madalag": 10,
  "Makato": 11,
  "Malay": 12,
  "Malinao": 13,
  "Nabas": 14,
  "New Washington": 15,
  "Numancia": 16,
  "Tangalan": 17
};

const steps = Array.from({ length: 20 }, (_, i) => `Step ${i + 1}`);

/* ✅ UI category key = institutional (keep this) */
const categories = ["social", "economic", "infrastructure", "environmental", "institutional"];

/* ✅ Titles shown under the label (display only) */
const stepTitles = {
  "Step 1": "Vision Elements Descriptors",
  "Step 2": "Vision Reality Gap (VRG) Analysis",
  "Step 3": "Expanded Problem Solution Finding Matrix and Goals and Objectives Matrix",
  "Step 4": "Annex B. Form 1c. Ecological Profile",
  "Step 5": "Annex B. Form 1d. Local Development Indicator System (LDIS)/RaPIDS",
  "Step 6": "Annex B. Form 2a. Structured List of PPAs per Sector (Long List)",
  "Step 7": "Annex B. Form 2b. Structured List of PPAs per Sector and Development Indicator (Long List)",
  "Step 8": "Identifying Projects and Non Projects",
  "Step 9": "Sifting by Ownership",
  "Step 10": "Ranked List of Projects (using the Urgency Test)",
  "Step 11": "Goal Achievement Matrix (GAM)",
  "Step 12": "Annex B. Form 3a. Ranked List of PPAs for Investment Programming",
  "Step 13": "Annex B. Form 3b. Project Brief for Each PPA",
  "Step 14": "Annex B. Form 3c. Projection of New Development Investment Financing Potential",
  "Step 15": "Annex B. Form 3d. Medium-Term Financing Plan",
  "Step 16": "Annex B. Form 3e. LDIP Summary Form",
  "Step 17": "Annex B. Form 4. AIP Summary Form",
  "Step 18": "Annex B. Form 5a. CapDev Program Summary Form",
  "Step 19": "Annex B. Form 5b. Priority Legislative Requirements Summary Form",
  "Step 20": "Annex B. Form 6b. Monitoring & Evaluation Strategy Template"
};

/* ============================= */
/* ✅ DATA STORE */
/* ============================= */

const data = {};
municipalities.forEach(m => {
  data[m] = {};
  steps.forEach(s => {
    data[m][s] = {};
    categories.forEach(c => {
      data[m][s][c] = { status: "missing", approved_at: null };
    });
  });
});

/* ============================= */
/* ✅ DOM */
/* ============================= */

const filterBtn = document.getElementById("filterBtn");
const dropdown = document.getElementById("dropdown");
const caret = document.getElementById("caret");
const municipalitySelect = document.getElementById("municipalitySelect");
const cycleSelect = document.getElementById("cycleSelect");
const tbody = document.getElementById("tbody");
const overallText = document.getElementById("overallText");
const muniLabel = document.getElementById("currentMunicipalityLabel");

/* ✅ Final Form */
const finalFormBtn = document.getElementById("finalFormBtn");
const finalFormModal = document.getElementById("finalFormModal");
const finalFormModalClose = document.getElementById("finalFormModalClose");
const finalFormModalTitle = document.getElementById("finalFormModalTitle");
const finalFormModalBody = document.getElementById("finalFormModalBody");
const finalFormModalFooter = document.getElementById("finalFormModalFooter");

// Tracker cycle id
let currentCycleId = 0;

// 🔔 Notifications
const notifBtn = document.getElementById("notifBtn");
const notifDropdown = document.getElementById("notifDropdown");
const notifBadge = document.getElementById("notifBadge");

/* ✅ Navigation buttons */
const goToAnalyticsBtn = document.getElementById("goToAnalyticsBtn");
const goToTrackerBtn   = document.getElementById("goToTrackerBtn");

/* ✅ Users panel DOM */
const manageUsersBtn = document.getElementById("manageUsersBtn");
const fpPanel = document.getElementById("fpPanel");
const usersPanel = document.getElementById("usersPanel");

/* Analytics panel DOM */
const analyticsPanel = document.getElementById("analyticsPanel");
const analyticsFilterToggle = document.getElementById("analyticsFilterToggle");
const analyticsFilterDropdown = document.getElementById("analyticsFilterDropdown");
const analyticsCycleToggle = document.getElementById("analyticsCycleToggle");
const analyticsCycleDropdown = document.getElementById("analyticsCycleDropdown");
const analyticsCycleList = document.getElementById("analyticsCycleList");
const analyticsCycleLabel = document.getElementById("analyticsCycleLabel");

/* ============================= */
/* ✅ HELPERS */
/* ============================= */

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function prettyStatus(s) {
  const raw = String(s || "").trim();
  if (!raw) return "—";

  const normalized = normalizeStatus(raw);
  if (normalized === "with-revision") return "Needs Revision";
  if (normalized === "approved") return "Approved";
  if (normalized === "pending") return "Pending";
  if (normalized === "missing") return "Missing";

  return raw
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, ch => ch.toUpperCase());
}

function safeDisplayText(v, fallback = "—") {
  const s = String(v ?? "").trim();
  return s ? escapeHtml(s) : fallback;
}

function backendCategoryKey(cat) {
  const s = String(cat || "").toLowerCase().trim();
  if (s === "institutional") return "individual";
  return s;
}

function normalizeCategory(cat) {
  const s = String(cat || "").toLowerCase().trim();
  if (categories.includes(s)) return s;

  const map = {
    "social": "social",
    "economic": "economic",
    "infrastructure": "infrastructure",
    "environmental": "environmental",
    "individual": "institutional",
    "institutional": "institutional"
  };
  return map[s] || s;
}

function normalizeStatus(raw) {
  const s = String(raw || "").toLowerCase().trim();

  if (["missing","pending","approved","rejected","with-revision"].includes(s)) {
    return (s === "rejected") ? "with-revision" : s;
  }

  if (
    s === "with revisions" ||
    s === "with revision" ||
    s === "revision" ||
    s === "revisions" ||
    s === "revisal" ||
    s === "needs revision" ||
    s === "needs revisions" ||
    s === "for revision" ||
    s === "for revisal" ||
    s === "for_revisal" ||
    s === "for_revision" ||
    s === "needs_revision" ||
    s === "with_revision" ||
    s === "with-revisions"
  ) return "with-revision";

  if (raw === 1 || raw === "1" || raw === true) return "approved";
  if (raw === 0 || raw === "0" || raw === false) return "pending";

  return "pending";
}

function getFormLabel(stepKey) {
  const n = parseInt(String(stepKey).replace("Step ", ""), 10);
  if (!isNaN(n)) return `${n}.`;
  return stepKey;
}

function renderStepCell(stepKey) {
  const title = stepTitles[stepKey] || "";
  const formLabel = getFormLabel(stepKey);
  const full = title ? `${formLabel} ${title}` : formLabel;

  return `
    <div style="display:flex;flex-direction:column;gap:2px;align-items:flex-start;">
      <div style="font-weight:800;">${escapeHtml(formLabel)}</div>
      ${
        title
          ? `<div title="${escapeHtml(full)}"
                 style="
                   font-size:12px;
                   color:#6b7280;
                   line-height:1.25;
                   display:-webkit-box;
                   -webkit-line-clamp:2;
                   -webkit-box-orient:vertical;
                   overflow:hidden;
                   max-width:260px;">
                ${escapeHtml(title)}
              </div>`
          : ""
      }
    </div>
  `;
}

function getCycleStatusLabel(c) {
  if (Number(c?.is_expired) === 1) return "Expired";
  return "Active";
}

/* ============================= */
/* ✅ MODALS: APPROVE / REJECT */
/* ============================= */

async function executeApprove(step, cat, remarks = "", closeModal = true) {
  const municipality = currentMunicipality;
  const prev = { ...data[municipality][step][cat] };

  data[municipality][step][cat] = {
    status: "approved",
    approved_at: new Date().toISOString()
  };
  render();

  const saved = await setStatusDB(municipality, step, cat, "approve", remarks);
  if (!saved) {
    data[municipality][step][cat] = prev;
    render();
    return false;
  }

  await loadMunicipality(municipality);
  render();

  if (closeModal) closeFileModal();
  return true;
}

async function executeReject(step, cat, remarks) {
  const municipality = currentMunicipality;
  const prev = { ...data[municipality][step][cat] };

  data[municipality][step][cat] = {
    status: "with-revision",
    approved_at: prev.approved_at
  };
  render();

  const saved = await setStatusDB(municipality, step, cat, "reject", remarks);
  if (!saved) {
    data[municipality][step][cat] = prev;
    render();
    return false;
  }

  await loadMunicipality(municipality);
  render();

  closeFileModal();
  return true;
}

/* ============================= */
/* ✅ MODALS: FILE VIEWER */
/* ============================= */

const fileModal = document.getElementById("fileModal");
const fileModalClose = document.getElementById("fileModalClose");
const fileModalTitle = document.getElementById("fileModalTitle");
const fileModalBody = document.getElementById("fileModalBody");

let fileModalContext = null;
let fileModalMeta = null;
let finalFormMeta = null;

function openFileModal(title, step, cat) {
  if (fileModalTitle) fileModalTitle.textContent = title || "View File";
  fileModalContext = (step && cat) ? { step, cat } : null;

  if (fileModal) fileModal.classList.add("show");
  renderFileModalFooter();
}

function closeFileModal() {
  closeSubmitConfirmModal();

  if (fileModal) fileModal.classList.remove("show");
  if (fileModalBody) fileModalBody.innerHTML = "";
  if (fileModalTitle) fileModalTitle.textContent = "View File";
  fileModalContext = null;
  fileModalMeta = null;

  renderFileModalFooter();
}

/* ============================= */
/* ✅ MODALS: FINAL FORM */
/* ============================= */

function openFinalFormModal(title = "Final Form") {
  if (finalFormModalTitle) finalFormModalTitle.textContent = title;
  finalFormModal?.classList.add("show");
}

function closeFinalFormModal() {
  closeSubmitConfirmModal();

  if (finalFormModal) finalFormModal.classList.remove("show");
  if (finalFormModalBody) finalFormModalBody.innerHTML = "";
  if (finalFormModalTitle) finalFormModalTitle.textContent = "Final Form";

  if (finalFormModalFooter) {
    finalFormModalFooter.style.display = "none";
    finalFormModalFooter.innerHTML = "";
    finalFormModalFooter.classList.remove("isRejecting");
  }

  finalFormMeta = null;
}

finalFormModalClose?.addEventListener("click", closeFinalFormModal);
finalFormModal?.addEventListener("click", (e) => {
  if (e.target === finalFormModal) closeFinalFormModal();
});

function buildFinalFormMetaHtml(meta) {
  const uploadRemarks = String(meta?.upload_remarks ?? "").trim();
  const revisionRemarks = String(meta?.revision_remarks ?? "").trim();
  const status = prettyStatus(meta?.status);
  const uploadedAt = safeDisplayText(meta?.uploaded_at);
  const approvedAt = safeDisplayText(meta?.approved_at);
  const fileName = safeDisplayText(meta?.file_name);
  const cycleLabel = (meta?.cycle_start && meta?.cycle_end)
    ? `${escapeHtml(String(meta.cycle_start))}–${escapeHtml(String(meta.cycle_end))}`
    : "—";

  return `
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:14px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;">
          <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:4px;">File Name</div>
          <div style="font-size:14px;font-weight:800;color:#0f172a;word-break:break-word;">${fileName}</div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;">
          <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:4px;">Cycle</div>
          <div style="font-size:14px;font-weight:800;color:#0f172a;">${cycleLabel}</div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;">
          <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:4px;">Status</div>
          <div style="font-size:14px;font-weight:800;color:#0f172a;">${escapeHtml(status)}</div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;">
          <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:4px;">Uploaded At</div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;word-break:break-word;">${uploadedAt}</div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;">
          <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:4px;">Reviewed At</div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;word-break:break-word;">${approvedAt}</div>
        </div>
      </div>

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:12px 14px;">
        <div style="font-weight:800;color:#1e3a8a;margin-bottom:6px;">LGU Remarks</div>
        <div style="color:#1f2937;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word;">
          ${uploadRemarks ? escapeHtml(uploadRemarks) : `<span style="color:#6b7280;">No remarks provided.</span>`}
        </div>
      </div>

      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:12px;padding:12px 14px;">
        <div style="font-weight:800;color:#9a3412;margin-bottom:6px;">Encoder Remarks</div>
        <div style="color:#1f2937;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word;">
          ${revisionRemarks ? escapeHtml(revisionRemarks) : `<span style="color:#6b7280;">No remarks provided.</span>`}
        </div>
      </div>
    </div>
  `;
}

function renderFinalFormFooter() {
  if (currentStatus === "approved") {
  finalFormModalFooter.innerHTML = `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:6px;
      padding:14px;
      border-radius:12px;
      background:#f0fdf4;
      border:1px solid rgba(34,197,94,0.25);
    ">
      <div style="font-size:22px;font-weight:900;color:#22c55e;">✔</div>
      <div style="font-weight:800;color:#15803d;">
        Final Form Reviewed
      </div>
    </div>
  `;
  return; 
}
  if (!finalFormModalFooter) return;

  if (!finalFormMeta) {
    finalFormModalFooter.style.display = "none";
    finalFormModalFooter.innerHTML = "";
    finalFormModalFooter.classList.remove("isRejecting");
    return;
  }

  finalFormModalFooter.style.display = "block";
  finalFormModalFooter.classList.remove("isRejecting");

  const currentStatus = normalizeStatus(finalFormMeta.status);
  const existingRemarks = String(finalFormMeta.revision_remarks ?? "");

  finalFormModalFooter.innerHTML = `
    <div class="statusRow" style="display:flex; align-items:center; gap:10px; padding:10px 14px;">
      <span class="statusLabel" style="font-weight:600;">Status:</span>

      <select id="finalFormStatusSelect" class="statusSelect" style="flex:1; min-width:220px;">
        <option value="approved">Approved</option>
        <option value="revisal">For Revision</option>
      </select>

      <button id="finalFormSubmitBtn" class="statusSubmitBtn" type="button">Submit</button>
    </div>

    <div class="revisalBox" style="padding:0 14px 14px 14px;">
      <div id="finalFormRemarksHint" class="rejectHint" style="margin:0 0 6px 0;">
        Remarks (optional):
      </div>

      <textarea
        id="finalFormRemarks"
        class="rejectRemarks"
        rows="3"
        placeholder="Type remarks here..."
        style="width:100%;"
      >${escapeHtml(existingRemarks)}</textarea>
    </div>
  `;

  const sel = document.getElementById("finalFormStatusSelect");
  const remarksEl = document.getElementById("finalFormRemarks");
  const hintEl = document.getElementById("finalFormRemarksHint");

  if (sel) sel.value = (currentStatus === "with-revision") ? "revisal" : "approved";

  const syncUI = () => {
    const isRevisal = String(sel?.value || "").toLowerCase() === "revisal";
    finalFormModalFooter.classList.toggle("isRejecting", isRevisal);

    if (hintEl) {
      hintEl.textContent = isRevisal
        ? "Write remarks for changes (required):"
        : "Remarks (optional):";
    }
  };

  syncUI();
  sel?.addEventListener("change", syncUI);

  document.getElementById("finalFormSubmitBtn")?.addEventListener("click", async () => {
    const actionValue = String(sel?.value || "").toLowerCase();
    const remarks = (remarksEl?.value || "").trim();

    if (actionValue === "revisal" && !remarks) {
      alert("Please add remarks before setting For Revision.");
      return;
    }

    const action = actionValue === "approved" ? "approve" : "reject";

    openSubmitConfirmModal({
      title: action === "approve" ? "Confirm Final Form Approval" : "Confirm Send for Revision",
      message: action === "approve"
        ? "Are you sure you want to approve this final form?"
        : "Are you sure you want to send this final form for revision?",
      onConfirm: async () => {
        const ok = await saveFinalFormVerdict(action, remarks);
        if (!ok) {
          alert("Failed to save final form verdict. Please try again.");
          return;
        }
        await openFinalForm();
      }
    });
  });
}

async function fetchFinalFormSubmission(muni) {
  try {
    const res = await fetch(
      `get_final_form.php?municipality=${encodeURIComponent(muni)}&cycle_id=${encodeURIComponent(currentCycleId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function saveFinalFormVerdict(action, remarks = "") {
  try {
    const res = await fetch("save_final_form.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        municipality: currentMunicipality,
        cycle_id: currentCycleId,
        action,
        remarks
      })
    });

    if (!res.ok) return false;

    const out = await res.json();
    if (!out.ok) return false;

    // ✅ refresh notifications after verdict clears matching notif in backend
    await loadNotificationsIntoDropdown();
    await updateNotifBadgeOnly();

    return true;
  } catch {
    return false;
  }
}

async function openFinalForm() {
  openFinalFormModal(`Final Form • ${currentMunicipality}`);

  if (finalFormModalBody) {
    finalFormModalBody.innerHTML = `<div class="fileLoading">Loading…</div>`;
  }

  const payload = await fetchFinalFormSubmission(currentMunicipality);

  if (!payload || payload.ok !== true) {
    if (finalFormModalBody) {
      finalFormModalBody.innerHTML = `<div class="fileError">Failed to load final form submission.</div>`;
    }
    if (finalFormModalFooter) {
      finalFormModalFooter.style.display = "none";
      finalFormModalFooter.innerHTML = "";
    }
    return;
  }

  if (!payload.exists || !payload.submission) {
    finalFormMeta = null;
    if (finalFormModalBody) {
      finalFormModalBody.innerHTML = `
        <div class="fileWarn">No final form submission found for this municipality and cycle.</div>
      `;
    }
    if (finalFormModalFooter) {
      finalFormModalFooter.style.display = "none";
      finalFormModalFooter.innerHTML = "";
    }
    return;
  }

  finalFormMeta = payload.submission;

  const filePath = String(finalFormMeta.file_path || "");
  const ext = getExtFromPath(filePath);

  if (!filePath) {
    if (finalFormModalBody) {
      finalFormModalBody.innerHTML = `
        ${buildFinalFormMetaHtml(finalFormMeta)}
        <div class="fileError">No file path found for this final form submission.</div>
      `;
    }
    renderFinalFormFooter();
    return;
  }

  if (ext === "pdf") {
    finalFormModalBody.innerHTML = `
      ${buildFinalFormMetaHtml(finalFormMeta)}
      <iframe
        class="fileFrame"
        src="${escapeHtml(filePath)}"
        title="Final Form PDF preview"
        style="height:calc(100vh - 360px); min-height:420px;"
      ></iframe>
      <div class="fileFallback">
        <a href="${escapeHtml(filePath)}" target="_blank" rel="noopener">Open in new tab</a>
      </div>
    `;
    renderFinalFormFooter();
    return;
  }

  if (ext === "txt") {
    try {
      const res = await fetch(filePath, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load text file.");

      const txt = await res.text();
      finalFormModalBody.innerHTML = `
        ${buildFinalFormMetaHtml(finalFormMeta)}
        <pre class="filePre">${escapeHtml(txt)}</pre>
      `;
    } catch (e) {
      finalFormModalBody.innerHTML = `
        ${buildFinalFormMetaHtml(finalFormMeta)}
        <div class="fileError">${escapeHtml(e?.message || "Failed to preview text file.")}</div>
      `;
    }
    renderFinalFormFooter();
    return;
  }

  if (ext === "docx") {
    if (typeof window.mammoth === "undefined") {
      finalFormModalBody.innerHTML = `
        ${buildFinalFormMetaHtml(finalFormMeta)}
        <div class="fileError">DOCX viewer library not loaded.</div>
        <div class="fileFallback">
          <a href="${escapeHtml(filePath)}" target="_blank" rel="noopener">Open / Download</a>
        </div>
      `;
      renderFinalFormFooter();
      return;
    }

    try {
      const res = await fetch(filePath, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load DOCX file.");

      const arrayBuffer = await res.arrayBuffer();
      const result = await window.mammoth.convertToHtml({ arrayBuffer });

      finalFormModalBody.innerHTML = `
        ${buildFinalFormMetaHtml(finalFormMeta)}
        <div class="docxHtml">${result.value || ""}</div>
        <div class="fileFallback">
          <a href="${escapeHtml(filePath)}" target="_blank" rel="noopener">Open / Download</a>
        </div>
      `;
    } catch (e) {
      finalFormModalBody.innerHTML = `
        ${buildFinalFormMetaHtml(finalFormMeta)}
        <div class="fileError">${escapeHtml(e?.message || "Failed to preview DOCX file.")}</div>
      `;
    }
    renderFinalFormFooter();
    return;
  }

  finalFormModalBody.innerHTML = `
    ${buildFinalFormMetaHtml(finalFormMeta)}
    <div class="fileError">Unsupported final file type. Please upload PDF or DOCX only.</div>
    <div class="fileFallback">
      <a href="${escapeHtml(filePath)}" target="_blank" rel="noopener">Open / Download</a>
    </div>
  `;
  renderFinalFormFooter();
}

finalFormBtn?.addEventListener("click", async () => {
  await openFinalForm();
});

/* ============================= */
/* ✅ MODALS: SUBMIT CONFIRMATION */
/* ============================= */

const submitConfirmModal = document.getElementById("submitConfirmModal");
const submitConfirmTitle = document.getElementById("submitConfirmTitle");
const submitConfirmMessage = document.getElementById("submitConfirmMessage");
const submitConfirmCancel = document.getElementById("submitConfirmCancel");
const submitConfirmOk = document.getElementById("submitConfirmOk");

let submitConfirmAction = null;
let submitConfirmBusy = false;

function openSubmitConfirmModal({
  title = "Confirm Submission",
  message = "Are you sure you want to continue?",
  onConfirm = null
} = {}) {
  submitConfirmAction = typeof onConfirm === "function" ? onConfirm : null;
  submitConfirmBusy = false;

  if (submitConfirmTitle) submitConfirmTitle.textContent = title;
  if (submitConfirmMessage) submitConfirmMessage.textContent = message;
  if (submitConfirmOk) {
    submitConfirmOk.disabled = false;
    submitConfirmOk.textContent = "Confirm";
  }
  if (submitConfirmCancel) submitConfirmCancel.disabled = false;

  submitConfirmModal?.classList.add("show");
}

function closeSubmitConfirmModal() {
  submitConfirmBusy = false;
  submitConfirmAction = null;

  if (submitConfirmOk) {
    submitConfirmOk.disabled = false;
    submitConfirmOk.textContent = "Confirm";
  }
  if (submitConfirmCancel) submitConfirmCancel.disabled = false;

  submitConfirmModal?.classList.remove("show");
}

submitConfirmCancel?.addEventListener("click", closeSubmitConfirmModal);

submitConfirmOk?.addEventListener("click", async () => {
  if (submitConfirmBusy) return;
  if (typeof submitConfirmAction !== "function") {
    closeSubmitConfirmModal();
    return;
  }

  submitConfirmBusy = true;
  if (submitConfirmOk) {
    submitConfirmOk.disabled = true;
    submitConfirmOk.textContent = "Submitting...";
  }
  if (submitConfirmCancel) submitConfirmCancel.disabled = true;

  const action = submitConfirmAction;
  try {
    await action();
  } finally {
    closeSubmitConfirmModal();
  }
});

submitConfirmModal?.addEventListener("click", (e) => {
  if (e.target === submitConfirmModal && !submitConfirmBusy) {
    closeSubmitConfirmModal();
  }
});

function renderFileModalFooter() {
  const footer = document.getElementById("fileModalFooter");
  if (!footer) return;

  if (!fileModalContext) {
    footer.style.display = "none";
    footer.innerHTML = "";
    footer.classList.remove("isRejecting");
    return;
  }

  const { step, cat } = fileModalContext;
  const cellData = data[currentMunicipality]?.[step]?.[cat];
  const st = cellData?.status || "missing";

  if (st === "missing" || st === "approved") {
    footer.style.display = "none";
    footer.innerHTML = "";
    footer.classList.remove("isRejecting");
    return;
  }

  footer.style.display = "block";
  footer.classList.remove("isRejecting");

  const existingRemarks = String(fileModalMeta?.revision_remarks ?? "");

  footer.innerHTML = `
    <div class="statusRow" style="display:flex; align-items:center; gap:10px; padding:10px 14px;">
      <span class="statusLabel" style="font-weight:600;">Status:</span>

      <select id="statusSelect" class="statusSelect" style="flex:1; min-width:220px;">
        <option value="approved">Approved</option>
        <option value="revisal">For Revision</option>
      </select>

      <button id="statusSubmit" class="statusSubmitBtn" type="button">Submit</button>
    </div>

    <div class="revisalBox" style="padding:0 14px 14px 14px;">
      <div id="remarksHint" class="rejectHint" style="margin:0 0 6px 0;">
        Remarks (optional):
      </div>

      <textarea
        id="remarksText"
        class="rejectRemarks"
        rows="3"
        placeholder="Type remarks here..."
        style="width:100%;"
      >${escapeHtml(existingRemarks)}</textarea>
    </div>
  `;

  const sel = document.getElementById("statusSelect");
  const remarksEl = document.getElementById("remarksText");
  const hintEl = document.getElementById("remarksHint");

  if (sel) sel.value = (st === "with-revision") ? "revisal" : "approved";

  const syncUI = () => {
    const v = String(sel?.value || "").toLowerCase();
    const isRevisal = v === "revisal";

    footer.classList.toggle("isRejecting", isRevisal);

    if (hintEl) {
      hintEl.textContent = isRevisal
        ? "Write remarks for changes (required):"
        : "Remarks (optional):";
    }

    if (isRevisal) setTimeout(() => remarksEl?.focus(), 0);
  };

  syncUI();
  sel?.addEventListener("change", syncUI);

  const submitBtn = document.getElementById("statusSubmit");
  if (submitBtn) {
    submitBtn.onclick = async () => {
      const v = String(sel?.value || "").toLowerCase();
      const txt = (remarksEl?.value || "").trim();

      if (v === "revisal") {
        if (!txt) {
          alert("Please add remarks before setting For Revision.");
          return;
        }

        openSubmitConfirmModal({
          title: "Confirm Send for Revision",
          message: "Are you sure you want to send this submission for revision?",
          onConfirm: async () => {
            const ok = await executeReject(step, cat, txt);
            if (!ok) alert("Failed to submit For Revision. Please try again.");
          }
        });
        return;
      }

      if (v === "approved") {
        openSubmitConfirmModal({
          title: "Confirm Mark as Reviewed",
          message: "Are you sure you want to mark this submission as reviewed?",
          onConfirm: async () => {
            const ok = await executeApprove(step, cat, txt, true);
            if (!ok) alert("Failed to submit Approved. Please try again.");
          }
        });
        return;
      }

      alert("Invalid option.");
    };
  }
}

if (fileModalClose) fileModalClose.addEventListener("click", closeFileModal);
if (fileModal) {
  fileModal.addEventListener("click", (e) => {
    if (e.target === fileModal) closeFileModal();
  });
}

/* ============================= */
/* ✅ MODALS: HISTORY (ALL UPLOADS) */
/* ============================= */

const historyModal = document.getElementById("historyModal");
const historyModalClose = document.getElementById("historyModalClose");
const historyModalTitle = document.getElementById("historyModalTitle");
const historyModalBody = document.getElementById("historyModalBody");

function openHistoryModal(title) {
  if (historyModalTitle) historyModalTitle.textContent = title || "History";
  if (historyModalBody) historyModalBody.innerHTML = "";
  historyModal?.classList.add("show");
}

function closeHistoryModal() {
  historyModal?.classList.remove("show");
  if (historyModalBody) historyModalBody.innerHTML = "";
  if (historyModalTitle) historyModalTitle.textContent = "History";
}

if (historyModalClose) historyModalClose.addEventListener("click", closeHistoryModal);
if (historyModal) {
  historyModal.addEventListener("click", (e) => {
    if (e.target === historyModal) closeHistoryModal();
  });
}

async function openHistory(muni, step, cat) {
  const stepNumber = parseInt(String(step).replace("Step ", ""), 10);
  const backendCat = backendCategoryKey(cat);

  const niceCat = String(cat || "").charAt(0).toUpperCase() + String(cat || "").slice(1);
  openHistoryModal(`History • ${muni} • Form ${stepNumber} • ${niceCat}`);

  if (!historyModalBody) return;
  historyModalBody.innerHTML = `<div class="fileLoading">Loading…</div>`;

  let payload;
  try {
    const res = await fetch(
      `get_file_history.php?municipality=${encodeURIComponent(muni)}&step=${stepNumber}&category=${encodeURIComponent(backendCat)}`,
      { cache: "no-store" }
    );
    payload = await res.json();
  } catch {
    historyModalBody.innerHTML = `<div class="fileError">Failed to contact server.</div>`;
    return;
  }

  if (!payload || payload.ok !== true) {
    historyModalBody.innerHTML = `<div class="fileError">${escapeHtml(payload?.error || "Failed to load history.")}</div>`;
    return;
  }

  const files = Array.isArray(payload.files) ? payload.files : [];
  if (files.length === 0) {
    historyModalBody.innerHTML = `<div class="fileWarn">No previous uploads found for this form/category.</div>`;
    return;
  }

  historyModalBody.innerHTML = `
    <table class="historyTable">
      <thead>
        <tr>
          <th style="width:70px;">#</th>
          <th>File</th>
          <th style="width:160px;">Uploaded</th>
          <th style="width:160px;">Reviewed</th>
          <th style="width:110px;">Status</th>
          <th style="width:120px;">Download</th>
        </tr>
      </thead>
      <tbody>
        ${files.map((f, i) => {
          const filePath = String(f.file_path || "");
          const fileName = String(f.file_name || "").trim() || filePath.split("/").pop() || "File";
          const uploaded = f.uploaded_at ? String(f.uploaded_at) : "—";
          const reviewed = f.approved_at ? String(f.approved_at) : (f.updated_at ? String(f.updated_at) : "—");
          const st = String(f.status || "").toLowerCase() || "—";

          const openLink = filePath
            ? `<a href="${escapeHtml(filePath)}" target="_blank" rel="noopener">${escapeHtml(fileName)}</a>`
            : `${escapeHtml(fileName)}`;

          const dl = filePath
            ? `<a class="historyDownloadBtn" href="${escapeHtml(filePath)}" download>Download</a>`
            : `<span style="opacity:.6;">—</span>`;

          return `
            <tr>
              <td>${i + 1}</td>
              <td>
                <div class="historyFile">
                  ${openLink}
                  ${f.upload_remarks ? `<div class="historyMeta">LGU Remarks: ${escapeHtml(String(f.upload_remarks))}</div>` : ``}
                  ${f.revision_remarks ? `<div class="historyMeta">Encoder Remarks: ${escapeHtml(String(f.revision_remarks))}</div>` : ``}
                </div>
              </td>
              <td>${escapeHtml(uploaded)}</td>
              <td>${escapeHtml(reviewed)}</td>
              <td style="text-transform:capitalize; font-weight:800;">${escapeHtml(st.replace(/-/g," "))}</td>
              <td>${dl}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (submitConfirmModal?.classList.contains("show")) {
      closeSubmitConfirmModal();
      return;
    }

    closeFileModal();
    closeHistoryModal();
    closeFinalFormModal();

    if (notifDropdown) notifDropdown.classList.remove("open");
    analyticsFilterDropdown?.classList.remove("open");
    analyticsCycleDropdown?.classList.remove("open");
  }
});

/* ============================= */
/* ✅ FILE PREVIEW HELPERS */
/* ============================= */

function getExtFromPath(path) {
  const clean = String(path || "").split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  if (dot === -1) return "";
  return clean.slice(dot + 1).toLowerCase();
}

function setFileLoading() {
  if (!fileModalBody) return;
  fileModalBody.innerHTML = `<div class="fileLoading">Loading…</div>`;
}

function setFileError(msg, filePath) {
  if (!fileModalBody) return;
  const safeMsg = escapeHtml(msg || "Unable to preview this file.");
  const safePath = escapeHtml(filePath || "");

  fileModalBody.innerHTML = `
    <div class="fileError">${safeMsg}</div>
    ${safePath ? `<div class="fileFallback">
      <a href="${safePath}" target="_blank" rel="noopener">Open in new tab</a>
    </div>` : ""}
  `;
}

function buildFileMetaHtml() {
  const lguRemarks = String(fileModalMeta?.upload_remarks ?? "").trim();
  const encoderRemarks = String(fileModalMeta?.revision_remarks ?? "").trim();
  const status = prettyStatus(fileModalMeta?.status);
  const uploadedAt = safeDisplayText(fileModalMeta?.uploaded_at);
  const approvedAt = safeDisplayText(fileModalMeta?.approved_at);

  return `
    <div style="
      display:flex;
      flex-direction:column;
      gap:12px;
      margin-bottom:14px;
    ">
      <div style="
        background:#eff6ff;
        border:1px solid #bfdbfe;
        border-radius:12px;
        padding:12px 14px;
      ">
        <div style="
          font-weight:800;
          color:#1e3a8a;
          margin-bottom:6px;
        ">LGU Remarks</div>
        <div style="
          color:#1f2937;
          font-size:14px;
          line-height:1.45;
          white-space:pre-wrap;
          word-break:break-word;
        ">${lguRemarks ? escapeHtml(lguRemarks) : `<span style="color:#6b7280;">No remarks provided.</span>`}</div>
      </div>

      <div style="
        background:#fff7ed;
        border:1px solid #fdba74;
        border-radius:12px;
        padding:12px 14px;
      ">
        <div style="
          font-weight:800;
          color:#9a3412;
          margin-bottom:6px;
        ">Encoder Remarks</div>
        <div style="
          color:#1f2937;
          font-size:14px;
          line-height:1.45;
          white-space:pre-wrap;
          word-break:break-word;
        ">${encoderRemarks ? escapeHtml(encoderRemarks) : `<span style="color:#6b7280;">No remarks provided.</span>`}</div>
      </div>

      <div style="
        display:grid;
        grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));
        gap:10px;
      ">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;">
          <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:4px;">Status</div>
          <div style="font-size:14px;font-weight:800;color:#0f172a;">${escapeHtml(status)}</div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;">
          <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:4px;">Uploaded At</div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;word-break:break-word;">${uploadedAt}</div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;">
          <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:4px;">Reviewed At</div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;word-break:break-word;">${approvedAt}</div>
        </div>
      </div>
    </div>
  `;
}

function renderPdf(filePath) {
  if (!fileModalBody) return;
  fileModalBody.innerHTML = `
    ${buildFileMetaHtml()}
    <iframe
      class="fileFrame"
      src="${escapeHtml(filePath)}"
      title="PDF preview"
      style="height:calc(100vh - 360px); min-height:420px;"
    ></iframe>
  `;
}

async function renderTxt(filePath) {
  setFileLoading();
  try {
    const res = await fetch(filePath, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load text file.");
    const txt = await res.text();
    if (!fileModalBody) return;
    fileModalBody.innerHTML = `
      ${buildFileMetaHtml()}
      <pre class="filePre">${escapeHtml(txt)}</pre>
    `;
  } catch (e) {
    setFileError(e?.message || "Failed to preview text file.", filePath);
  }
}

async function renderDocx(filePath) {
  setFileLoading();

  if (typeof window.mammoth === "undefined") {
    setFileError("DOCX viewer library not loaded (Mammoth).", filePath);
    return;
  }

  try {
    const res = await fetch(filePath, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load DOCX file.");

    const arrayBuffer = await res.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer });

    if (!fileModalBody) return;

    const warnings = Array.isArray(result.messages) && result.messages.length
      ? `<div class="fileWarn">Some formatting may not display perfectly.</div>`
      : "";

    fileModalBody.innerHTML = `
      ${buildFileMetaHtml()}
      ${warnings}
      <div class="docxHtml">${result.value || ""}</div>
      <div class="fileFallback">
        <a href="${escapeHtml(filePath)}" target="_blank" rel="noopener">Open / Download</a>
      </div>
    `;
  } catch (e) {
    setFileError(e?.message || "Failed to preview DOCX file.", filePath);
  }
}

async function previewFileInModal(filePath, step, cat) {
  const ext = getExtFromPath(filePath);
  const title = (ext ? ext.toUpperCase() : "FILE") + " Preview";
  openFileModal(title, step, cat);

  if (!filePath) {
    setFileError("No file path.", "");
    return;
  }

  if (ext === "pdf") return renderPdf(filePath);
  if (ext === "txt") return renderTxt(filePath);
  if (ext === "docx") return renderDocx(filePath);

  if (fileModalBody) {
    fileModalBody.innerHTML = `
      ${buildFileMetaHtml()}
      <iframe
        class="fileFrame"
        src="${escapeHtml(filePath)}"
        title="File preview"
        style="height:calc(100vh - 360px); min-height:420px;"
      ></iframe>
      <div class="fileFallback">
        <a href="${escapeHtml(filePath)}" target="_blank" rel="noopener">Open in new tab</a>
      </div>
    `;
  }
}

/* ============================= */
/* ✅ FILTER / MUNICIPALITY */
/* ============================= */

if (filterBtn && dropdown && caret) {
  filterBtn.onclick = () => {
    dropdown.classList.toggle("open");
    caret.textContent = dropdown.classList.contains("open") ? "▲" : "▼";
  };
}

if (municipalitySelect) {
  municipalities.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    municipalitySelect.appendChild(opt);
  });
}

let currentMunicipality = municipalities[0];
if (municipalitySelect) municipalitySelect.value = currentMunicipality;
if (muniLabel) muniLabel.textContent = currentMunicipality;

if (municipalitySelect) {
  municipalitySelect.onchange = async () => {
    currentMunicipality = municipalitySelect.value;
    if (muniLabel) muniLabel.textContent = currentMunicipality;

    currentCycleId = 0;
    await loadCycles(currentMunicipality);
    await loadMunicipality(currentMunicipality);
    render();
  };
}

/* ============================= */
/* ✅ CYCLES FILTER */
/* ============================= */

async function loadCycles(selectedMunicipality = currentMunicipality) {
  try {
    if (!cycleSelect) return;

    const muniId = municipalityIds[selectedMunicipality] || 0;
    const url = muniId > 0
      ? `get_cycles.php?municipality_id=${encodeURIComponent(muniId)}`
      : "get_cycles.php";

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return;

    const payload = await res.json();
    if (!payload.ok || !Array.isArray(payload.cycles)) return;

    cycleSelect.innerHTML = "";

    if (payload.cycles.length === 0) {
      const opt = document.createElement("option");
      opt.value = "0";
      opt.textContent = "No cycles found";
      cycleSelect.appendChild(opt);
      currentCycleId = 0;
      return;
    }

    let selectedCycleFound = false;
    let activeCycleId = 0;

    payload.cycles.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;

      const statusLabel = getCycleStatusLabel(c);
      const label = `${c.cycle_start}–${c.cycle_end} (${statusLabel})`;
      opt.textContent = label;

      cycleSelect.appendChild(opt);

      if (Number(c.is_active) === 1 && Number(c.is_expired) === 0 && !activeCycleId) {
        activeCycleId = parseInt(c.id, 10) || 0;
      }

      if ((parseInt(c.id, 10) || 0) === currentCycleId) {
        selectedCycleFound = true;
      }
    });

    if (selectedCycleFound && currentCycleId > 0) {
      cycleSelect.value = String(currentCycleId);
    } else if (activeCycleId > 0) {
      cycleSelect.value = String(activeCycleId);
      currentCycleId = activeCycleId;
    } else if (cycleSelect.options.length > 0) {
      cycleSelect.selectedIndex = 0;
      currentCycleId = parseInt(cycleSelect.value, 10) || 0;
    }
  } catch {
    // keep silent
  }
}

if (cycleSelect) {
  cycleSelect.onchange = async () => {
    currentCycleId = parseInt(cycleSelect.value, 10) || 0;
    await loadMunicipality(currentMunicipality);
    render();
  };
}

/* ============================= */
/* ✅ LOAD MUNICIPALITY */
/* ============================= */

async function loadMunicipality(muni) {
  if (data[muni]) {
    steps.forEach(s => {
      categories.forEach(c => {
        data[muni][s][c] = { status: "missing", approved_at: null };
      });
    });
  }

  let res;
  try {
    res = await fetch(`load_fp.php?municipality=${encodeURIComponent(muni)}&cycle_id=${encodeURIComponent(currentCycleId)}`, { cache: "no-store" });
  } catch {
    return;
  }
  if (!res.ok) return;

  let rows;
  try { rows = await res.json(); } catch { return; }
  if (!Array.isArray(rows)) return;

  rows.forEach(r => {
    const stepName = `Step ${parseInt(r.step_number, 10)}`;
    const rawCat = String(r.category || "").toLowerCase().trim();
    const cat = normalizeCategory(rawCat);

    const st = normalizeStatus(r.status);
    const approvedAt = r.approved_at ?? null;

    if (data[muni]?.[stepName] && cat in data[muni][stepName]) {
      data[muni][stepName][cat] = { status: st, approved_at: approvedAt };
    }
  });
}

/* ============================= */
/* ✅ FILE OPEN */
/* ============================= */

async function openFile(muni, step, cat, cycleIdOverride = 0) {
  const stepNumber = parseInt(String(step).replace("Step ", ""), 10);
  const backendCat = backendCategoryKey(cat);
  const requestCycleId = parseInt(cycleIdOverride, 10) || parseInt(currentCycleId, 10) || 0;

  let res;
  try {
    res = await fetch(
      `get_file.php?municipality=${encodeURIComponent(muni)}&step=${stepNumber}&category=${encodeURIComponent(backendCat)}&cycle_id=${encodeURIComponent(requestCycleId)}`,
      { cache: "no-store" }
    );
  } catch {
    alert("Failed to contact server.");
    return;
  }

  let out;
  try {
    out = await res.json();
  } catch {
    alert("Invalid server response.");
    return;
  }

  if (!out || out.ok !== true) {
    alert(out?.error || "Failed to load file.");
    return;
  }

  if (!out.file_path) {
    alert("No file uploaded yet for this step/category.");
    return;
  }

  fileModalMeta = out;
  await previewFileInModal(out.file_path, step, cat);
  renderFileModalFooter();
}


function setTrackerCycleById(cycleId) {
  const cid = parseInt(cycleId, 10) || 0;
  if (!cycleSelect || !cid) return false;

  const optionExists = Array.from(cycleSelect.options).some(opt => (parseInt(opt.value, 10) || 0) === cid);
  if (!optionExists) return false;

  cycleSelect.value = String(cid);
  currentCycleId = cid;
  return true;
}

/* ============================= */
/* ✅ SAVE STATUS */
/* ============================= */

async function setStatusDB(muni, step, cat, action, remarks = "") {
  const stepNumber = parseInt(step.replace("Step ", ""), 10);
  const backendCat = backendCategoryKey(cat);

  const res = await fetch("save_fp.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      municipality: muni,
      step: stepNumber,
      category: backendCat,
      action,
      remarks,
      cycle_id: currentCycleId
    })
  });

  if (!res.ok) return false;

  try {
    const j = await res.json();
    if (!j.ok) return false;

    // ✅ refresh notifications after verdict clears matching notif in backend
    await loadNotificationsIntoDropdown();
    await updateNotifBadgeOnly();

    return true;
  } catch {
    return false;
  }
}

/* ============================= */
/* ✅ REVISION CARD (UI) */
/* ============================= */

function revisionCardHtml() {
  return `
    <div class="revisionCompact" title="Needs Revision"
         style="
           display:flex;
           flex-direction:column;
           align-items:center;
           justify-content:center;
           gap:4px;
           padding:6px;
           border-radius:10px;
           background:#fff7d6;
           border:1px solid rgba(245, 158, 11, .35);
           cursor:pointer;
         ">
      <div style="font-size:18px;font-weight:900;color:#f59e0b;line-height:1;">⚠</div>
      <div style="white-space:nowrap;font-size:11px;font-weight:800;color:#b45309;line-height:1;">
        Needs&nbsp;Revision
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;">
        <span class="revAct" data-act="view" title="View File" style="cursor:pointer;font-size:16px;">🔍</span>
        <span class="revAct" data-act="history" title="History" style="cursor:pointer;font-size:16px;">📘</span>
      </div>
    </div>
  `;
}

/* ============================= */
/* ✅ RENDER TABLE */
/* ============================= */

function render() {
  if (!tbody) return;
  tbody.innerHTML = "";

  steps.forEach(step => {
    const tr = document.createElement("tr");
    tr.dataset.step = step;

    tr.innerHTML = `<td>${renderStepCell(step)}</td>`;

    categories.forEach(cat => {
      const td = document.createElement("td");
      td.dataset.step = step;
      td.dataset.category = cat;
      td.classList.remove("withRevision");

      const cellData = data[currentMunicipality][step][cat];
      const st = cellData?.status || "missing";

      if (st === "missing") {
        const stepNum = parseInt(step.replace("Step ", ""), 10);
        const noSubmissionNeededCats = ["social", "economic", "infrastructure", "environmental"];
        const isNoSubmissionNeeded =
          stepNum >= 14 && stepNum <= 16 &&
          noSubmissionNeededCats.includes(cat);

        if (isNoSubmissionNeeded) {
          td.innerHTML = `
            <div class="noSubmissionNeeded">
              <span class="noNeededIcon">—</span>
              <span class="noNeededText">No submission needed</span>
            </div>
          `;
        } else {
          td.innerHTML = `
            <div class="noSubmission">
              <span class="noIcon">✕</span>
              <span class="noText">No Submission</span>
            </div>
          `;
        }
        tr.appendChild(td);
        return;
      }

      if (st === "approved") {
        const wrapper = document.createElement("div");

        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.alignItems = "center";
        wrapper.style.justifyContent = "center";
        wrapper.style.gap = "4px";
        wrapper.style.padding = "6px";
        wrapper.style.borderRadius = "10px";
        wrapper.style.background = "#f0fdf4";
        wrapper.style.border = "1px solid rgba(34,197,94,0.25)";

        const check = document.createElement("div");
        check.textContent = "✔";
        check.style.fontSize = "18px";
        check.style.fontWeight = "900";
        check.style.color = "#22c55e";
        check.style.lineHeight = "1";
        wrapper.appendChild(check);

        const label = document.createElement("div");
        label.textContent = "Form\u00A0Reviewed";
        label.style.whiteSpace = "nowrap";
        label.style.fontSize = "11px";
        label.style.fontWeight = "700";
        label.style.color = "#15803d";
        label.style.lineHeight = "1";
        wrapper.appendChild(label);

        const iconRow = document.createElement("div");
        iconRow.style.display = "flex";
        iconRow.style.alignItems = "center";
        iconRow.style.justifyContent = "center";
        iconRow.style.gap = "10px";

        const viewIcon = document.createElement("span");
        viewIcon.textContent = "🔍";
        viewIcon.style.cursor = "pointer";
        viewIcon.style.fontSize = "16px";
        viewIcon.title = "View File";
        viewIcon.onclick = () => openFile(currentMunicipality, step, cat);

        const historyIcon = document.createElement("span");
        historyIcon.textContent = "📘";
        historyIcon.style.cursor = "pointer";
        historyIcon.style.fontSize = "16px";
        historyIcon.title = "History";
        historyIcon.onclick = () => openHistory(currentMunicipality, step, cat);

        iconRow.appendChild(viewIcon);
        iconRow.appendChild(historyIcon);
        wrapper.appendChild(iconRow);

        td.appendChild(wrapper);
        tr.appendChild(td);
        return;
      }

      if (st === "with-revision") {
        td.innerHTML = revisionCardHtml();

        const card = td.querySelector(".revisionCompact");
        const viewBtn = td.querySelector('.revAct[data-act="view"]');
        const histBtn = td.querySelector('.revAct[data-act="history"]');

        card?.addEventListener("click", (e) => {
          if (e.target?.closest(".revAct")) return;
          openFile(currentMunicipality, step, cat);
        });

        viewBtn?.addEventListener("click", (e) => {
          e.stopPropagation();
          openFile(currentMunicipality, step, cat);
        });

        histBtn?.addEventListener("click", (e) => {
          e.stopPropagation();
          openHistory(currentMunicipality, step, cat);
        });

        tr.appendChild(td);
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "cellActionCol";

      const btn = document.createElement("button");
      btn.className = "checkFiles";
      btn.type = "button";
      btn.textContent = "Needs Action";
      btn.onclick = () => openFile(currentMunicipality, step, cat);

      wrapper.append(btn);
      td.innerHTML = "";
      td.appendChild(wrapper);
      tr.appendChild(td);
    });

    const pct = document.createElement("td");
    pct.textContent = calcStep(step) + "%";
    tr.appendChild(pct);

    tbody.appendChild(tr);
  });

  if (overallText) {
    overallText.innerHTML = `Percentage of Overall Completion: <small>${calcOverall()}%</small>`;
  }
}

/* ============================= */
/* ✅ CALCULATIONS */
/* ============================= */

const institutionalOnlySteps = [14, 15, 16];

function isInstitutionalOnly(step) {
  const n = parseInt(step.replace("Step ", ""), 10);
  return institutionalOnlySteps.includes(n);
}

function calcStep(step) {
  if (isInstitutionalOnly(step)) {
    return data[currentMunicipality][step]["institutional"]?.status === "approved" ? 100 : 0;
  }
  let done = 0;
  categories.forEach(c => {
    if (data[currentMunicipality][step][c]?.status === "approved") done++;
  });
  return Math.round((done / categories.length) * 100);
}

function calcOverall() {
  let done = 0;
  const total = steps.length;

  steps.forEach(s => {
    if (isInstitutionalOnly(s)) {
      if (data[currentMunicipality][s]["institutional"]?.status === "approved") done += 1;
    } else {
      let stepDone = 0;
      categories.forEach(c => {
        if (data[currentMunicipality][s][c]?.status === "approved") stepDone++;
      });
      done += stepDone / categories.length;
    }
  });

  return ((done / total) * 100).toFixed(2);
}

function requiredCountPerMunicipality() {
  let required = 0;
  steps.forEach(step => {
    required += isInstitutionalOnly(step) ? 1 : categories.length;
  });
  return required;
}

/* ============================= */
/* 🔔 NOTIFICATIONS */
/* ============================= */

function setBadgeCount(n) {
  if (!notifBadge) return;
  const count = Number(n) || 0;
  if (count > 0) {
    notifBadge.textContent = count > 99 ? "99+" : String(count);
    notifBadge.style.display = "block";
  } else {
    notifBadge.style.display = "none";
  }
}

async function fetchNotificationsPayload() {
  try {
    const res = await fetch("get_notifications.php", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function updateNotifBadgeOnly() {
  const payload = await fetchNotificationsPayload();
  if (!payload || payload.ok !== true) return;
  setBadgeCount(payload.unread_count ?? 0);
}

function highlightCell(stepNum, categoryKey) {
  if (!tbody) return;

  const stepLabel = `Step ${Number(stepNum)}`;
  const cat = normalizeCategory(categoryKey);

  const td = tbody.querySelector(`td[data-step="${stepLabel}"][data-category="${cat}"]`);
  if (!td) return;

  td.classList.add("cellHighlight");
  td.scrollIntoView({ behavior: "smooth", block: "center" });

  setTimeout(() => td.classList.remove("cellHighlight"), 1600);
}

async function markNotificationRead(id) {
  try {
    const res = await fetch("mark_notification_read.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function markAllNotificationsRead() {
  try {
    const res = await fetch("mark_notification_read.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all: true })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function formatNotifTime(val) {
  if (!val) return "";
  const s = String(val).trim().replace(" ", "T");
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleString();
}

async function handleNotificationClick(n) {
  const muni         = String(n.municipality || "").trim();
  const stepNum      = Number(n.step_number || 0);
  const rawCat       = String(n.category || "").trim();
  const cat          = normalizeCategory(rawCat);
  const stepLabel    = `Step ${stepNum}`;
  const notifCycleId = parseInt(n.cycle_id, 10) || 0;

  if (!muni || !municipalities.includes(muni)) {
    if (Number(n.is_read) === 0) {
      const out = await markNotificationRead(n.id);
      if (out && out.ok) setBadgeCount(out.unread_count ?? 0);
    }
    return;
  }

  showPanel("fp");

 currentMunicipality = muni;

if (municipalitySelect) municipalitySelect.value = muni;
if (muniLabel) muniLabel.textContent = muni;

currentCycleId = 0;
await loadCycles(muni);

if (notifCycleId > 0) {
  setTrackerCycleById(notifCycleId);
}

await loadMunicipality(muni);
render();

  await new Promise(resolve => requestAnimationFrame(resolve));

  if (stepNum > 0) {
    highlightCell(stepNum, cat);
    if (cat) {
      await openFile(muni, stepLabel, cat, notifCycleId);
    }
  } else {
    await openFinalForm();
  }

  if (Number(n.is_read) === 0) {
    const out = await markNotificationRead(n.id);
    if (out && out.ok) setBadgeCount(out.unread_count ?? 0);
  }
}

async function loadNotificationsIntoDropdown() {
  if (!notifDropdown) return;

  const payload = await fetchNotificationsPayload();
  if (!payload || payload.ok !== true) {
    renderNotifDropdownError();
    return;
  }

  setBadgeCount(payload.unread_count ?? 0);

  const all  = Array.isArray(payload.notifications) ? payload.notifications : [];
  const rows = all.filter(n => Number(n.is_read) === 0);

  renderNotifItems(rows);
}

function renderNotifDropdownError() {
  if (!notifDropdown) return;
  notifDropdown.innerHTML = `
    <div class="notifHeader"><span>Notifications</span></div>
    <div class="notifEmpty">Could not load notifications.</div>
  `;
}

function renderNotifItems(rows) {
  if (!notifDropdown) return;

  const header = `
    <div class="notifHeader">
      <span>Notifications</span>
      ${rows.length > 0 ? `<button class="notifMarkAll" id="notifMarkAllBtn" type="button">Mark all read</button>` : ""}
    </div>
  `;

  if (rows.length === 0) {
    notifDropdown.innerHTML = header + `<div class="notifEmpty">No new notifications</div>`;
    return;
  }

  const items = rows.map(n => {
  const muni      = escapeHtml(String(n.municipality || "").trim() || "—");
  const stepNum   = Number(n.step_number || 0);
  const rawCat    = String(n.category || "").trim();
  const cat       = normalizeCategory(rawCat);
  const cycleId   = parseInt(n.cycle_id, 10) || 0;
  const catLabel  = stepNum === 0
    ? "Final Form"
    : (cat ? (cat.charAt(0).toUpperCase() + cat.slice(1)) : "—");
  const stepLabel = stepNum ? `Form ${stepNum}` : "Final Form";
  const timeStr   = formatNotifTime(n.created_at);

  return `
    <button class="notifItem unread" data-id="${escapeHtml(String(n.id))}" type="button">
      <span class="notifItemIcon">📬</span>
      <span class="notifItemContent">
        <span class="notifItemTitle">${muni} — ${stepLabel} · ${catLabel}</span>
       <span class="notifItemMuni">
  ${escapeHtml(String(n.message || "").trim())}
</span>
        ${timeStr ? `<span class="notifItemTime">${escapeHtml(timeStr)}</span>` : ""}
      </span>
      <span class="notifItemDot"></span>
    </button>
  `;
}).join("");

  notifDropdown.innerHTML = header + `<div class="notifList">${items}</div>`;

  notifDropdown.querySelectorAll(".notifItem[data-id]").forEach(el => {
    el.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = Number(el.dataset.id);
      const n  = rows.find(x => Number(x.id) === id);
      if (!n) return;

      notifDropdown.classList.remove("open");

      el.classList.remove("unread");
      el.querySelector(".notifItemDot")?.remove();

      await handleNotificationClick(n);

      const remaining = notifDropdown.querySelectorAll(".notifItem.unread").length;
      setBadgeCount(remaining);
      if (remaining === 0) {
        const list = notifDropdown.querySelector(".notifList");
        if (list) list.innerHTML = `<div class="notifEmpty">No new notifications</div>`;
        const markAllBtn = document.getElementById("notifMarkAllBtn");
        if (markAllBtn) markAllBtn.remove();
      }
    });
  });

  const markAllBtn = document.getElementById("notifMarkAllBtn");
  if (markAllBtn) {
    markAllBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const out = await markAllNotificationsRead();
      if (out && out.ok) setBadgeCount(0);
      notifDropdown.innerHTML = `
        <div class="notifHeader"><span>Notifications</span></div>
        <div class="notifEmpty">No new notifications</div>
      `;
    });
  }
}

if (notifBtn && notifDropdown) {
  notifBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle("open");
    if (notifDropdown.classList.contains("open")) {
      await loadNotificationsIntoDropdown();
    }
  });

  document.addEventListener("click", (e) => {
    const clickedInside = notifDropdown.contains(e.target) || notifBtn.contains(e.target);
    if (!clickedInside) notifDropdown.classList.remove("open");
  });
}

/* ============================= */
/* ✅ PANEL TOGGLING */
/* ============================= */

const _fpPanel        = document.getElementById("fpPanel");
const _usersPanel     = document.getElementById("usersPanel");
const _analyticsPanel = document.getElementById("analyticsPanel");

let currentPanelView = "fp";

function showPanel(name) {
  currentPanelView = name;

  if (_fpPanel)        _fpPanel.style.display        = (name === "fp")        ? "block" : "none";
  if (_usersPanel)     _usersPanel.style.display     = (name === "users")     ? "block" : "none";
  if (_analyticsPanel) _analyticsPanel.style.display = (name === "analytics") ? "block" : "none";

  if (manageUsersBtn) manageUsersBtn.textContent = (name === "users") ? "Back to Dashboard" : "Manage Users";
}

function closeDropdownsAndModals() {
  if (dropdown) dropdown.classList.remove("open");
  if (caret) caret.textContent = "▼";
  if (notifDropdown) notifDropdown.classList.remove("open");
  analyticsFilterDropdown?.classList.remove("open");
  analyticsCycleDropdown?.classList.remove("open");
  closeSubmitConfirmModal();
  closeFileModal();
  closeHistoryModal();
  closeFinalFormModal();
}

/* ============================= */
/* ✅ DASHBOARD ANALYTICS PANEL */
/* ============================= */

let analyticsChart = null;
let analyticsSelectedMid = 0;
let analyticsSelectedCycleId = 0;
let analyticsAllRows = [];
let analyticsMunicipalities = [];
let analyticsCyclesLoaded = false;
let analyticsMuniListBuilt = false;

async function loadAnalyticsData(mid = 0, cycleId = 0) {
  const url = `get_analytics.php?municipality_id=${encodeURIComponent(mid)}&cycle_id=${encodeURIComponent(cycleId)}`;
  let payload;
  try {
    const res = await fetch(url, { cache: "no-store" });
    payload = await res.json();
  } catch {
    return null;
  }
  return payload;
}

function buildAnalyticsMuniList(munis) {
  if (analyticsMuniListBuilt) return;
  analyticsMuniListBuilt = true;

  const list = document.getElementById("analyticsMuniList");
  if (!list) return;

  let html = `<li><a href="#" data-mid="0" data-name="all municipalities">All Municipalities</a></li>`;
  munis.forEach(m => {
    html += `<li><a href="#" data-mid="${m.municipal_id}" data-name="${escapeHtml(String(m.name || "").toLowerCase())}">${escapeHtml(m.name)}</a></li>`;
  });
  list.innerHTML = html;

  list.addEventListener("click", async (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();

    const mid = parseInt(a.dataset.mid, 10) || 0;
    analyticsSelectedMid = mid;

    list.querySelectorAll("a").forEach(el => el.classList.remove("active"));
    a.classList.add("active");

    const lbl = document.getElementById("analyticsFilterLabel");
    if (lbl) lbl.textContent = mid === 0 ? "All Municipalities" : a.textContent.trim();

    analyticsFilterDropdown?.classList.remove("open");

    const searchEl = document.getElementById("analyticsMuniSearch");
    if (searchEl) searchEl.value = "";
    list.querySelectorAll("li").forEach(li => li.style.display = "");

    await refreshAnalyticsData(analyticsSelectedMid, analyticsSelectedCycleId);
  });
}

function setAnalyticsMuniActive(mid) {
  const list = document.getElementById("analyticsMuniList");
  if (!list) return;
  list.querySelectorAll("a").forEach(a => {
    const aMid = parseInt(a.dataset.mid, 10) || 0;
    a.classList.toggle("active", aMid === mid);
  });
}

function setAnalyticsCycleActive(cycleId) {
  if (!analyticsCycleList) return;
  analyticsCycleList.querySelectorAll("a").forEach(a => {
    const aCid = parseInt(a.dataset.cid, 10) || 0;
    a.classList.toggle("active", aCid === cycleId);
  });
}

async function loadAnalyticsCycles() {
  if (analyticsCyclesLoaded) return;
  analyticsCyclesLoaded = true;

  if (!analyticsCycleList) return;

  try {
    const res = await fetch("get_cycles.php", { cache: "no-store" });
    if (!res.ok) return;
    const payload = await res.json();
    if (!payload.ok || !Array.isArray(payload.cycles)) return;

    analyticsCycleList.innerHTML = `
      <li><a href="#" class="active" data-cid="0" data-name="all cycles">All Cycles</a></li>
    `;

    payload.cycles.forEach(c => {
      const cycleId = parseInt(c.id, 10) || 0;
      const statusLabel = getCycleStatusLabel(c);
      const label = `${c.cycle_start}–${c.cycle_end} (${statusLabel})`;

      analyticsCycleList.insertAdjacentHTML(
        "beforeend",
        `<li><a href="#" data-cid="${cycleId}" data-name="${escapeHtml(label.toLowerCase())}">${escapeHtml(label)}</a></li>`
      );
    });

    analyticsCycleList.addEventListener("click", async (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      e.preventDefault();

      analyticsSelectedCycleId = parseInt(a.dataset.cid, 10) || 0;

      analyticsCycleList.querySelectorAll("a").forEach(el => el.classList.remove("active"));
      a.classList.add("active");

      if (analyticsCycleLabel) analyticsCycleLabel.textContent = a.textContent.trim();

      analyticsCycleDropdown?.classList.remove("open");

      await refreshAnalyticsData(analyticsSelectedMid, analyticsSelectedCycleId);
    });
  } catch {
    // keep default "Active Cycle"
  }
}

function renderAnalyticsTable(rows) {
  const tbody = document.getElementById("analyticsTbody");
  if (!tbody) return;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding:14px;text-align:center;">No data.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${escapeHtml(r.municipality)}</td>
      <td>${parseInt(r.reviewed, 10) || 0}</td>
      <td>${parseInt(r.pending, 10) || 0}</td>
      <td>${parseInt(r.for_revision, 10) || 0}</td>
    </tr>
  `).join("");
}

function updateAnalyticsCards(rows) {
  let reviewed = 0, pending = 0, revision = 0;
  rows.forEach(r => {
    reviewed += parseInt(r.reviewed, 10) || 0;
    pending  += parseInt(r.pending, 10) || 0;
    revision += parseInt(r.for_revision, 10) || 0;
  });

  const submitted = reviewed + pending + revision;

  const setCard = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setCard("aCardReviewed", reviewed);
  setCard("aCardPending", pending);
  setCard("aCardRevision", revision);
  setCard("aCardTotal", submitted);

  const requiredPerMuni = requiredCountPerMunicipality();
  const isAll = (parseInt(analyticsSelectedMid, 10) || 0) === 0;

  const muniCount = isAll
    ? (Array.isArray(analyticsMunicipalities) && analyticsMunicipalities.length ? analyticsMunicipalities.length : rows.length)
    : 1;

  const requiredTotal = isAll ? (muniCount * requiredPerMuni) : requiredPerMuni;
  const unsubmitted = Math.max(0, requiredTotal - submitted);

  const pct = requiredTotal > 0 ? Math.round((submitted / requiredTotal) * 1000) / 10 : 0;
  const pctEl = document.getElementById("analyticsPctText");
  if (pctEl) pctEl.textContent = pct;

  const ctx = document.getElementById("analyticsChart");
  if (!ctx || !window.Chart) return;

  const labels = ["Submitted", "Unsubmitted"];
  const dataset = {
    data: [submitted, unsubmitted],
    backgroundColor: ["#3b82f6", "#ef4444"],
    borderWidth: 0
  };

  if (analyticsChart) {
    analyticsChart.data.labels = labels;
    analyticsChart.data.datasets[0] = dataset;
    analyticsChart.update();
  } else {
    analyticsChart = new Chart(ctx, {
      type: "pie",
      data: { labels, datasets: [dataset] },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: function(context) {
                const v = context.raw || 0;
                const t = (submitted + unsubmitted) || 1;
                const p = Math.round((v / t) * 1000) / 10;
                return `${context.label}: ${v} (${p}%)`;
              }
            }
          }
        }
      }
    });
  }
}

async function refreshAnalyticsData(mid = analyticsSelectedMid, cycleId = analyticsSelectedCycleId) {
  analyticsSelectedMid = parseInt(mid, 10) || 0;
  analyticsSelectedCycleId = parseInt(cycleId, 10) || 0;

  const payload = await loadAnalyticsData(analyticsSelectedMid, analyticsSelectedCycleId);
  if (!payload || !payload.ok) return;

  analyticsMunicipalities = Array.isArray(payload.municipalities) ? payload.municipalities : analyticsMunicipalities;

  analyticsAllRows = payload.rows || [];
  renderAnalyticsTable(analyticsAllRows);
  updateAnalyticsCards(analyticsAllRows);
  setAnalyticsMuniActive(analyticsSelectedMid);
  setAnalyticsCycleActive(analyticsSelectedCycleId);
}

async function refreshAnalytics(mid = analyticsSelectedMid, cycleId = analyticsSelectedCycleId) {
  analyticsSelectedMid = parseInt(mid, 10) || 0;
  analyticsSelectedCycleId = parseInt(cycleId, 10) || 0;

  await loadAnalyticsCycles();

  const payload = await loadAnalyticsData(analyticsSelectedMid, analyticsSelectedCycleId);
  if (!payload || !payload.ok) return;

  analyticsMunicipalities = Array.isArray(payload.municipalities) ? payload.municipalities : analyticsMunicipalities;

  analyticsAllRows = payload.rows || [];
  buildAnalyticsMuniList(payload.municipalities || []);
  setAnalyticsMuniActive(analyticsSelectedMid);
  setAnalyticsCycleActive(analyticsSelectedCycleId);
  renderAnalyticsTable(analyticsAllRows);
  updateAnalyticsCards(analyticsAllRows);
}

/* Analytics Municipality Filter */
analyticsFilterToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  analyticsCycleDropdown?.classList.remove("open");

  const isOpening = !analyticsFilterDropdown?.classList.contains("open");
  analyticsFilterDropdown?.classList.toggle("open");

  if (isOpening) {
    const searchEl = document.getElementById("analyticsMuniSearch");
    if (searchEl) searchEl.value = "";
    const list = document.getElementById("analyticsMuniList");
    if (list) list.querySelectorAll("li").forEach(li => li.style.display = "");
  }
});

/* Analytics Cycle Filter */
analyticsCycleToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  analyticsFilterDropdown?.classList.remove("open");
  analyticsCycleDropdown?.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (
    analyticsFilterDropdown &&
    analyticsFilterToggle &&
    !analyticsFilterDropdown.contains(e.target) &&
    !analyticsFilterToggle.contains(e.target)
  ) {
    analyticsFilterDropdown.classList.remove("open");
  }

  if (
    analyticsCycleDropdown &&
    analyticsCycleToggle &&
    !analyticsCycleDropdown.contains(e.target) &&
    !analyticsCycleToggle.contains(e.target)
  ) {
    analyticsCycleDropdown.classList.remove("open");
  }
});

const analyticsMuniSearch = document.getElementById("analyticsMuniSearch");
analyticsMuniSearch?.addEventListener("input", () => {
  const q = (analyticsMuniSearch.value || "").trim().toLowerCase();
  const list = document.getElementById("analyticsMuniList");
  if (!list) return;
  list.querySelectorAll("a").forEach(a => {
    const name = (a.dataset.name || "").toLowerCase();
    const li = a.closest("li");
    if (li) li.style.display = name.includes(q) ? "" : "none";
  });
});

/* ============================= */
/* ✅ NAV BUTTONS */
/* ============================= */

goToAnalyticsBtn?.addEventListener("click", async () => {
  closeDropdownsAndModals();
  showPanel("analytics");
  await refreshAnalytics(analyticsSelectedMid, analyticsSelectedCycleId);
});

goToTrackerBtn?.addEventListener("click", () => {
  closeDropdownsAndModals();
  showPanel("fp");
});

/* ✅ Manage Users toggle */
if (manageUsersBtn) {
  const newManageUsersBtn = manageUsersBtn.cloneNode(true);
  manageUsersBtn.parentNode.replaceChild(newManageUsersBtn, manageUsersBtn);

  newManageUsersBtn.addEventListener("click", () => {
    closeDropdownsAndModals();
    if (currentPanelView === "users") {
      showPanel("fp");
    } else {
      showPanel("users");
    }
  });
}

/* ============================= */
/* ✅ INIT */
/* ============================= */

(async () => {
  await loadCycles(currentMunicipality);
  await loadMunicipality(currentMunicipality);
  render();

  showPanel("analytics");
  await refreshAnalytics(0, 0);

  await updateNotifBadgeOnly();
  setInterval(updateNotifBadgeOnly, 15000);
})();

/* ═══════════════════════════════════════════════════════
   Panel switching — Forms & References buttons wired in
   to the same show/hide pattern used by FP_script.js
═══════════════════════════════════════════════════════ */
(function () {
  const ALL_PANELS = ['fpPanel', 'analyticsPanel', 'usersPanel', 'formsPanel', 'refsPanel'];

  function showPanelUI(id) {
    ALL_PANELS.forEach(p => {
      const el = document.getElementById(p);
      if (el) el.style.display = (p === id) ? '' : 'none';
    });

    document.querySelectorAll('.sidebar .filterBtn').forEach(btn => btn.classList.remove('isActive'));

    const map = {
      fpPanel:        'goToTrackerBtn',
      analyticsPanel: 'goToAnalyticsBtn',
      usersPanel:     null,
      formsPanel:     'goToFormsBtn',
      refsPanel:      'goToRefsBtn',
    };

    if (map[id]) {
      const btn = document.getElementById(map[id]);
      if (btn) btn.classList.add('isActive');
    }
  }

  document.getElementById('goToFormsBtn')?.addEventListener('click', function () {
    closeDropdownsAndModals();
    currentPanelView = "forms";
    showPanelUI('formsPanel');
  });

  document.getElementById('goToRefsBtn')?.addEventListener('click', function () {
    closeDropdownsAndModals();
    currentPanelView = "refs";
    showPanelUI('refsPanel');
  });

  /* ── Forms search ── */
  const formsBox  = document.getElementById('formsSearchBox');
  const formsHint = document.getElementById('formsSearchHint');
  const formsNone = document.getElementById('formsNoResults');

  if (formsBox) {
    formsBox.addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();
      let shown = 0;
      document.querySelectorAll('#formsAllCards .fileCard').forEach(card => {
        const name = card.getAttribute('data-forms-name') || '';
        const ok = q === '' || name.includes(q);
        card.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      document.querySelectorAll('[data-forms-group]').forEach(group => {
        const visible = group.querySelectorAll('.fileCard:not([style*="display: none"])').length;
        group.style.display = visible ? '' : 'none';
      });
      if (formsHint) formsHint.textContent = q ? `${shown} match(es)` : '';
      if (formsNone) formsNone.style.display = (q && shown === 0) ? '' : 'none';
    });
  }

  /* ── References search ── */
  const refsBox  = document.getElementById('refsSearchBox');
  const refsHint = document.getElementById('refsSearchHint');
  const refsNone = document.getElementById('refsNoResults');

  if (refsBox) {
    refsBox.addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();
      let shown = 0;
      document.querySelectorAll('#refsAllCards .fileCard').forEach(card => {
        const name = card.getAttribute('data-refs-name') || '';
        const ok = q === '' || name.includes(q);
        card.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      document.querySelectorAll('[data-refs-group]').forEach(group => {
        const visible = group.querySelectorAll('.fileCard:not([style*="display: none"])').length;
        group.style.display = visible ? '' : 'none';
      });
      if (refsHint) refsHint.textContent = q ? `${shown} match(es)` : '';
      if (refsNone) refsNone.style.display = (q && shown === 0) ? '' : 'none';
    });
  }

  ['goToAnalyticsBtn', 'goToTrackerBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.sidebar .filterBtn').forEach(b => b.classList.remove('isActive'));
        this.classList.add('isActive');
      });
    }
  });
})();

/* ═══════════════════════════════════════════════════════
   ZIP VIEWER
═══════════════════════════════════════════════════════ */

let _zipPreviewModal = null;
let _zipFolderCounter = 0;

function _getOrCreateZipPreviewModal() {
  if (_zipPreviewModal) return _zipPreviewModal;

  const overlay = document.createElement("div");
  overlay.id        = "zipPreviewModal";
  overlay.className = "zipPreviewModal";
  overlay.innerHTML = `
    <div class="zipPreviewBox">
      <div class="zipPreviewHeader">
        <button class="zipPreviewBack" id="zipPreviewBack" title="Back to ZIP viewer">← Back</button>
        <span class="zipPreviewTitle" id="zipPreviewTitle">File Preview</span>
        <button class="zipPreviewClose" id="zipPreviewClose" title="Close">✕</button>
      </div>
      <div class="zipPreviewBody" id="zipPreviewBody"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  _zipPreviewModal = overlay;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeZipPreviewModal();
  });
  document.getElementById("zipPreviewClose")
    ?.addEventListener("click", closeZipPreviewModal);
  document.getElementById("zipPreviewBack")
    ?.addEventListener("click", closeZipPreviewModal);

  return overlay;
}

function openZipPreviewModal(title) {
  const modal  = _getOrCreateZipPreviewModal();
  const titleEl = document.getElementById("zipPreviewTitle");
  const bodyEl  = document.getElementById("zipPreviewBody");
  if (titleEl) titleEl.textContent = title || "File Preview";
  if (bodyEl)  bodyEl.innerHTML    = `<div class="fileLoading">Loading…</div>`;
  modal.classList.add("show");
}

function closeZipPreviewModal() {
  if (!_zipPreviewModal) return;
  _zipPreviewModal.classList.remove("show");
  const bodyEl = document.getElementById("zipPreviewBody");
  if (bodyEl) bodyEl.innerHTML = "";
}

function _zipEntryIcon(entryName) {
  const ext = getExtFromPath(entryName);
  const map = {
    pdf: "📄", docx: "📝", doc: "📝",
    xlsx: "📊", xls: "📊", csv: "📊",
    pptx: "📑", ppt: "📑",
    txt: "📃",
    png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", webp: "🖼️", svg: "🖼️",
    zip: "🗜️", rar: "🗜️",
  };
  return map[ext] || "📎";
}

const _ZIP_PREVIEW_EXTS = new Set([
  "pdf", "txt", "docx", "png", "jpg", "jpeg", "gif", "webp", "svg"
]);

async function openZipEntryPreview(zipPath, entry) {
  const ext      = getExtFromPath(entry);
  const baseName = entry.split("/").pop() || entry;
  const serveUrl = `serve_zip_entry.php?file_path=${encodeURIComponent(zipPath)}&entry=${encodeURIComponent(entry)}`;

  openZipPreviewModal(baseName);

  const bodyEl = document.getElementById("zipPreviewBody");
  if (!bodyEl) return;

  if (ext === "pdf") {
    bodyEl.innerHTML = `
      <iframe class="fileFrame zipPreviewFrame"
              src="${escapeHtml(serveUrl)}"
              title="${escapeHtml(baseName)}"></iframe>`;
    return;
  }

  if (ext === "txt" || ext === "csv") {
    try {
      const res = await fetch(serveUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("Server returned " + res.status);
      const txt = await res.text();
      bodyEl.innerHTML = `
        <pre class="filePre zipPreviewPre">${escapeHtml(txt)}</pre>`;
    } catch (e) {
      bodyEl.innerHTML = `
        <div class="fileError">${escapeHtml(e?.message || "Failed to load.")}</div>
        <div class="fileFallback">
          <a href="${escapeHtml(serveUrl)}" target="_blank" rel="noopener">Open in new tab</a>
        </div>`;
    }
    return;
  }

  if (ext === "docx" && typeof window.mammoth !== "undefined") {
    try {
      const res = await fetch(serveUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("Server returned " + res.status);
      const buf    = await res.arrayBuffer();
      const result = await window.mammoth.convertToHtml({ arrayBuffer: buf });
      bodyEl.innerHTML = `
        <div class="docxHtml" style="padding:18px;">${result.value || ""}</div>
        <div class="fileFallback">
          <a href="${escapeHtml(serveUrl)}" download="${escapeHtml(baseName)}">⬇ Download</a>
        </div>`;
    } catch (e) {
      bodyEl.innerHTML = `
        <div class="fileError">${escapeHtml(e?.message || "Failed to preview DOCX.")}</div>
        <div class="fileFallback">
          <a href="${escapeHtml(serveUrl)}" target="_blank" rel="noopener">Open in new tab</a>
        </div>`;
    }
    return;
  }

  if (["png","jpg","jpeg","gif","webp","svg"].includes(ext)) {
    bodyEl.innerHTML = `
      <div class="zipPreviewImgWrap">
        <img src="${escapeHtml(serveUrl)}"
             alt="${escapeHtml(baseName)}"
             class="zipPreviewImg" />
      </div>`;
    return;
  }

  bodyEl.innerHTML = `
    <iframe class="fileFrame zipPreviewFrame"
            src="${escapeHtml(serveUrl)}"
            title="${escapeHtml(baseName)}"></iframe>
    <div class="fileFallback">
      <a href="${escapeHtml(serveUrl)}" target="_blank" rel="noopener">Open in new tab</a>
      &nbsp;·&nbsp;
      <a href="${escapeHtml(serveUrl)}" download="${escapeHtml(baseName)}">⬇ Download</a>
    </div>`;
}

function _buildZipTree(entries) {
  const root = {};
  entries.forEach(entry => {
    const parts = entry.split("/");
    let node    = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!node[part]) node[part] = { _type: "dir", _children: {} };
      node = node[part]._children;
    }
    const file = parts[parts.length - 1];
    if (file) node[file] = { _type: "file", _path: entry };
  });
  return root;
}

function _renderZipTree(tree, zipPath, depth = 0) {
  let html = "";
  const px = depth * 18;

  const dirs  = Object.keys(tree).filter(k => tree[k]._type === "dir" ).sort();
  const files = Object.keys(tree).filter(k => tree[k]._type === "file").sort();

  dirs.forEach(name => {
    const fid       = ++_zipFolderCounter;
    const childHtml = _renderZipTree(tree[name]._children, zipPath, depth + 1);
    html += `
      <div class="zipFolderRow" data-folder-id="${fid}" data-open="1"
           style="padding-left:${px + 14}px;">
        <span class="zipFolderCaret">▼</span>
        <span class="zipFolderIcon">📁</span>
        <span class="zipFolderName">${escapeHtml(name)}</span>
      </div>
      <div data-folder-children="${fid}">${childHtml}</div>`;
  });

  files.forEach(name => {
    const entry      = tree[name]._path;
    const ext        = getExtFromPath(name);
    const icon       = _zipEntryIcon(name);
    const canPreview = _ZIP_PREVIEW_EXTS.has(ext);
    const serveUrl   = `serve_zip_entry.php?file_path=${encodeURIComponent(zipPath)}&entry=${encodeURIComponent(entry)}`;

    html += `
      <div class="zipEntryFile${canPreview ? " zipEntryPreviewable" : ""}"
           data-entry="${escapeHtml(entry)}"
           style="padding-left:${px + 32}px;"
           title="${canPreview ? "Click to preview" : ""}">
        <span class="zipEntryIcon">${icon}</span>
        <span class="zipEntryName">${escapeHtml(name)}</span>
        ${canPreview
          ? `<span class="zipEntryBadge zipBadgePreview">👁 Preview</span>`
          : `<a  class="zipEntryBadge zipBadgeDownload"
                href="${escapeHtml(serveUrl)}"
                download="${escapeHtml(name)}"
                onclick="event.stopPropagation()">⬇ Download</a>`
        }
      </div>`;
  });

  return html;
}

async function renderZipViewer(container, zipPath) {
  _zipFolderCounter = 0;

  container.innerHTML = `
    ${buildFinalFormMetaHtml(finalFormMeta)}
    <div class="fileLoading">Reading ZIP contents…</div>`;

  let entries;
  try {
    const res = await fetch(
      `get_zip_entries.php?file_path=${encodeURIComponent(zipPath)}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const payload = await res.json();
    if (!payload.ok) throw new Error(payload.error || "Failed to list ZIP entries.");
    entries = payload.entries;
  } catch (e) {
    container.innerHTML = `
      ${buildFinalFormMetaHtml(finalFormMeta)}
      <div class="fileError">${escapeHtml(e?.message || "Could not read ZIP contents.")}</div>
      <div class="fileFallback">
        <a href="${escapeHtml(zipPath)}" download>⬇ Download ZIP</a>
      </div>`;
    return;
  }

  if (!entries || entries.length === 0) {
    container.innerHTML = `
      ${buildFinalFormMetaHtml(finalFormMeta)}
      <div class="fileWarn">The ZIP archive is empty.</div>
      <div class="fileFallback">
        <a href="${escapeHtml(zipPath)}" download>⬇ Download ZIP</a>
      </div>`;
    return;
  }

  const tree     = _buildZipTree(entries);
  const zipName  = zipPath.split("/").pop() || "archive.zip";
  const fileWord = entries.length === 1 ? "file" : "files";

  container.innerHTML = `
    ${buildFinalFormMetaHtml(finalFormMeta)}
    <div class="zipViewer">

      <div class="zipViewerHeader">
        <span class="zipViewerHeaderIcon">🗜️</span>
        <div class="zipViewerHeaderInfo">
          <span class="zipViewerName">${escapeHtml(zipName)}</span>
          <span class="zipViewerCount">${entries.length} ${fileWord}</span>
        </div>
        <a class="zipDownloadAllBtn"
           href="${escapeHtml(zipPath)}"
           download
           title="Download the full ZIP">⬇ Download ZIP</a>
      </div>

      <div class="zipEntryList" id="zipEntryList">
        ${_renderZipTree(tree, zipPath)}
      </div>

    </div>`;

  container.querySelectorAll(".zipFolderRow").forEach(row => {
    row.addEventListener("click", () => {
      const fid      = row.dataset.folderId;
      const children = container.querySelector(`[data-folder-children="${fid}"]`);
      const caret    = row.querySelector(".zipFolderCaret");
      if (!children) return;
      const isOpen = row.dataset.open === "1";
      children.style.display = isOpen ? "none" : "";
      row.dataset.open       = isOpen ? "0" : "1";
      if (caret) caret.textContent = isOpen ? "▶" : "▼";
    });
  });

  container.querySelectorAll(".zipEntryFile.zipEntryPreviewable").forEach(el => {
    el.addEventListener("click", () => {
      const entryName = el.dataset.entry;
      if (entryName) openZipEntryPreview(zipPath, entryName);
    });
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && _zipPreviewModal?.classList.contains("show")) {
    closeZipPreviewModal();
    e.stopImmediatePropagation();
  }
}, true /* capture */);
