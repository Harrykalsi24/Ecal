/**
 * Ecal: Smart EMI Calculator (Lightweight & Clean)
 * Manual loan option selection calculation & GitHub updates
 */

let selectedCategory = null;

// ==========================================
// 1. Core Financial Calculation Engine
// ==========================================

function selectLoanOption(type) {
    selectedCategory = type;

    const btnMobile = document.getElementById("btnActionMobile");
    const btnOther = document.getElementById("btnActionOther");
    const arrowMobile = document.getElementById("arrowMobile");
    const arrowOther = document.getElementById("arrowOther");
    const chip = document.getElementById("activeCategoryChip");

    const a = parseFloat(document.getElementById("inp").value) || 0;
    const b = parseFloat(document.getElementById("inp1").value) || 0;
    const c = parseInt(document.getElementById("inp2").value) || 0;

    const bal = a - b;
    let inter = 0;
    let total = 0;

    if (type === '1') {
        // Mobile: 3% monthly interest
        if (btnMobile) btnMobile.classList.add("active");
        if (btnOther) btnOther.classList.remove("active");
        if (arrowMobile) arrowMobile.textContent = "✓";
        if (arrowOther) arrowOther.textContent = "→";
        if (chip) chip.innerHTML = "<span>Mobile</span>";

        const inte = (bal * 3) / 100;
        inter = inte * c;
        total = inter + bal;

    } else if (type === '2') {
        // Other: 2% monthly interest + 18% GST on interest
        if (btnOther) btnOther.classList.add("active");
        if (btnMobile) btnMobile.classList.remove("active");
        if (arrowOther) arrowOther.textContent = "✓";
        if (arrowMobile) arrowMobile.textContent = "→";
        if (chip) chip.innerHTML = "<span>Other</span>";

        const inte = (bal * 2) / 100;
        const baseInter = inte * c;
        const gst = (baseInter * 18) / 100;
        inter = baseInter + gst;
        total = inter + bal;
    }

    const emi = (c > 0 && total > 0) ? (total / c) : 0;
    const fileCharge = bal > 0 ? ((bal * 5) / 100 + 100) : 0;

    // Populate outputs
    const inpMonths = document.getElementById("inpMonths");
    const inp3 = document.getElementById("inp3");
    const inp4 = document.getElementById("inp4");
    const inp5 = document.getElementById("inp5");
    const inp6 = document.getElementById("inp6");
    const inp7 = document.getElementById("inp7");

    if (inpMonths) inpMonths.value = c;
    if (inp3) inp3.value = (bal >= 0 ? bal : 0).toFixed(2);
    if (inp4) inp4.value = (inter >= 0 ? inter : 0).toFixed(2);
    if (inp5) inp5.value = (total >= 0 ? total : 0).toFixed(2);
    if (inp6) inp6.value = emi.toFixed(2);
    if (inp7) inp7.value = fileCharge.toFixed(2);
}

// Backward-compatible alias
function inst(type) {
    selectLoanOption(String(type));
}

function clearCategorySelection() {
    selectedCategory = null;
    const btnMobile = document.getElementById("btnActionMobile");
    const btnOther = document.getElementById("btnActionOther");
    const arrowMobile = document.getElementById("arrowMobile");
    const arrowOther = document.getElementById("arrowOther");
    const chip = document.getElementById("activeCategoryChip");

    if (btnMobile) btnMobile.classList.remove("active");
    if (btnOther) btnOther.classList.remove("active");
    if (arrowMobile) arrowMobile.textContent = "→";
    if (arrowOther) arrowOther.textContent = "→";
    if (chip) chip.innerHTML = "<span>Select Loan Type</span>";
}

function resetForm() {
    const form = document.getElementById("emiForm");
    if (form) form.reset();

    const inpMonths = document.getElementById("inpMonths");
    if (inpMonths) inpMonths.value = '0';

    ['inp3', 'inp4', 'inp5', 'inp6', 'inp7'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '0.00';
    });

    clearCategorySelection();
}

// On input changes: DO NOT calculate. Remove active highlight so user selects option to compute.
['inp', 'inp1', 'inp2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', () => {
            if (selectedCategory) {
                clearCategorySelection();
            }
        });
    }
});

// ==========================================
// 2. Theme Controller
// ==========================================

const THEME_KEY = 'ecal_theme_pref';
const mediaQueryDark = window.matchMedia('(prefers-color-scheme: dark)');

function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
    const effectiveTheme = theme === 'system' 
        ? (mediaQueryDark.matches ? 'dark' : 'light') 
        : theme;

    document.documentElement.setAttribute('data-theme', effectiveTheme);

    const themePillBtns = document.querySelectorAll('.theme-pill-btn');
    themePillBtns.forEach(btn => {
        const val = btn.getAttribute('data-theme-val');
        if (val === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    localStorage.setItem(THEME_KEY, theme);
}

mediaQueryDark.addEventListener('change', () => {
    if (getSavedTheme() === 'system') {
        applyTheme('system');
    }
});

function initThemeListeners() {
    const themePillBtns = document.querySelectorAll('.theme-pill-btn');
    themePillBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const chosen = btn.getAttribute('data-theme-val');
            applyTheme(chosen);
        });
    });
}

// ==========================================
// 3. Settings Menu & Policy Modals
// ==========================================

const btnSettingsTrigger = document.getElementById("btnSettingsTrigger");
const settingsModalBackdrop = document.getElementById("settingsModalBackdrop");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const settingsUpdateBadge = document.getElementById("settingsUpdateBadge");

function openSettingsModal() {
    if (settingsModalBackdrop) {
        settingsModalBackdrop.classList.add("open");
        settingsModalBackdrop.setAttribute("aria-hidden", "false");
    }
}

function closeSettingsModal() {
    if (settingsModalBackdrop) {
        settingsModalBackdrop.classList.remove("open");
        settingsModalBackdrop.setAttribute("aria-hidden", "true");
    }
}

if (btnSettingsTrigger) btnSettingsTrigger.addEventListener("click", openSettingsModal);
if (btnCloseSettings) btnCloseSettings.addEventListener("click", closeSettingsModal);

if (settingsModalBackdrop) {
    settingsModalBackdrop.addEventListener("click", (e) => {
        if (e.target === settingsModalBackdrop) {
            closeSettingsModal();
        }
    });
}

// Policy Modal
const btnOpenPolicy = document.getElementById("btnOpenPolicy");
const policyModalBackdrop = document.getElementById("policyModalBackdrop");
const btnClosePolicy = document.getElementById("btnClosePolicy");

if (btnOpenPolicy) {
    btnOpenPolicy.addEventListener("click", () => {
        if (policyModalBackdrop) {
            policyModalBackdrop.classList.remove("hidden");
            policyModalBackdrop.setAttribute("aria-hidden", "false");
        }
    });
}

if (btnClosePolicy) {
    btnClosePolicy.addEventListener("click", () => {
        if (policyModalBackdrop) {
            policyModalBackdrop.classList.add("hidden");
            policyModalBackdrop.setAttribute("aria-hidden", "true");
        }
    });
}

if (policyModalBackdrop) {
    policyModalBackdrop.addEventListener("click", (e) => {
        if (e.target === policyModalBackdrop) {
            policyModalBackdrop.classList.add("hidden");
            policyModalBackdrop.setAttribute("aria-hidden", "true");
        }
    });
}

// ==========================================
// 4. GitHub Release Update System
// ==========================================

const GITHUB_REPO = "Harrykalsi24/Ecal";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

let latestReleaseData = null;
let selectedApkAsset = null;
let expectedApkSha256 = null;
let releaseManifestJson = null;
let releaseManifestSig = null;
let currentUpdateState = 'IDLE';

const appInstalledVersionEl = document.getElementById("appInstalledVersion");
const btnCheckUpdate = document.getElementById("btnCheckUpdate");
const checkUpdateIcon = document.getElementById("checkUpdateIcon");
const btnCheckUpdateText = document.getElementById("btnCheckUpdateText");
const updateStatusMsg = document.getElementById("updateStatusMsg");

const updateDetailsBox = document.getElementById("updateDetailsBox");
const updateLatestTag = document.getElementById("updateLatestTag");
const updateReleaseDate = document.getElementById("updateReleaseDate");
const updateFileSize = document.getElementById("updateFileSize");
const updateChangelog = document.getElementById("updateChangelog");

const downloadProgressWrap = document.getElementById("downloadProgressWrap");
const downloadStatusLabel = document.getElementById("downloadStatusLabel");
const downloadPercentLabel = document.getElementById("downloadPercentLabel");
const downloadProgressBarFill = document.getElementById("downloadProgressBarFill");
const downloadBytesLabel = document.getElementById("downloadBytesLabel");

const permissionAlertBox = document.getElementById("permissionAlertBox");
const btnGrantPermission = document.getElementById("btnGrantPermission");
const btnDownloadInstall = document.getElementById("btnDownloadInstall");
const btnDownloadText = document.getElementById("btnDownloadText");
const btnCancelDownload = document.getElementById("btnCancelDownload");

const preInstallBackdrop = document.getElementById("preInstallBackdrop");
const btnConfirmInstall = document.getElementById("btnConfirmInstall");
const btnCancelInstall = document.getElementById("btnCancelInstall");

function getInstalledVersion() {
    if (window.AndroidUpdateBridge && typeof window.AndroidUpdateBridge.getInstalledVersionName === 'function') {
        try {
            const v = window.AndroidUpdateBridge.getInstalledVersionName();
            if (v && v.trim()) return v.trim();
        } catch (e) {
            console.warn("Could not read installed version", e);
        }
    }
    return "1.4.0";
}

function updateInstalledVersionUI() {
    const ver = getInstalledVersion();
    if (appInstalledVersionEl) {
        appInstalledVersionEl.textContent = `v${ver}`;
    }
}

function normalizeVersion(versionStr) {
    if (!versionStr) return [0];
    return versionStr
        .replace(/^v/i, '')
        .split('-')[0]
        .split('.')
        .map(x => parseInt(x, 10) || 0);
}

function compareVersions(v1, v2) {
    const p1 = normalizeVersion(v1);
    const p2 = normalizeVersion(v2);
    const len = Math.max(p1.length, p2.length);

    for (let i = 0; i < len; i++) {
        const num1 = p1[i] || 0;
        const num2 = p2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return isoStr;
    }
}

async function checkForUpdates(silent = false) {
    if (currentUpdateState === 'CHECKING' || currentUpdateState === 'DOWNLOADING') return;

    if (!silent) {
        currentUpdateState = 'CHECKING';
        btnCheckUpdate.disabled = true;
        if (checkUpdateIcon) checkUpdateIcon.classList.add("spin-animation");
        btnCheckUpdateText.textContent = "Checking...";
        updateStatusMsg.textContent = "Connecting to official GitHub Releases...";
        if (updateDetailsBox) updateDetailsBox.classList.add("hidden");
    }

    const installedVer = getInstalledVersion();
    updateInstalledVersionUI();

    try {
        if (!navigator.onLine) {
            throw new Error("No internet connection available.");
        }

        const response = await fetch(GITHUB_API_URL, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });

        if (response.status === 403 || response.status === 429) {
            throw new Error("GitHub rate limit reached. Please try again later.");
        }
        if (response.status === 404) {
            throw new Error("No releases found.");
        }
        if (!response.ok) {
            throw new Error(`GitHub check failed (HTTP ${response.status}).`);
        }

        const release = await response.json();
        latestReleaseData = release;

        const latestTag = release.tag_name || release.name || "";
        if (!latestTag) throw new Error("Invalid release data received.");

        const assets = release.assets || [];
        const apkAsset = assets.find(a => 
            (a.name && a.name.toLowerCase().endsWith(".apk")) || 
            a.content_type === "application/vnd.android.package-archive"
        );

        if (!apkAsset) {
            throw new Error(`Release ${latestTag} found, but no APK attached.`);
        }
        selectedApkAsset = apkAsset;

        // Fetch verification checksum & manifest in background
        expectedApkSha256 = null;
        releaseManifestJson = null;
        releaseManifestSig = null;

        const shaAsset = assets.find(a => a.name === "Ecal.apk.sha256" || a.name.endsWith(".sha256") || a.name === "SHA256SUMS");
        if (shaAsset && shaAsset.browser_download_url) {
            try {
                const sResp = await fetch(shaAsset.browser_download_url);
                if (sResp.ok) {
                    const txt = await sResp.text();
                    const match = txt.trim().match(/([a-fA-F0-9]{64})/);
                    if (match) expectedApkSha256 = match[1];
                }
            } catch (e) {}
        }

        const manifestAsset = assets.find(a => a.name === "release-manifest.json");
        const sigAsset = assets.find(a => a.name === "release-manifest.json.sig");
        if (manifestAsset && sigAsset) {
            try {
                const [mResp, sigResp] = await Promise.all([
                    fetch(manifestAsset.browser_download_url),
                    fetch(sigAsset.browser_download_url)
                ]);
                if (mResp.ok && sigResp.ok) {
                    releaseManifestJson = await mResp.text();
                    releaseManifestSig = await sigResp.text();
                }
            } catch (e) {}
        }

        const cmp = compareVersions(latestTag, installedVer);

        if (cmp > 0) {
            currentUpdateState = 'AVAILABLE';
            if (settingsUpdateBadge) settingsUpdateBadge.classList.remove("hidden");
            updateStatusMsg.textContent = `New version available: ${latestTag}`;
            renderUpdateDetails(release, apkAsset);
        } else {
            currentUpdateState = 'UP_TO_DATE';
            if (settingsUpdateBadge) settingsUpdateBadge.classList.add("hidden");
            updateStatusMsg.textContent = `Your app is up to date (v${installedVer}).`;
            if (updateDetailsBox) updateDetailsBox.classList.add("hidden");
        }

    } catch (err) {
        if (!silent) {
            currentUpdateState = 'IDLE';
            updateStatusMsg.textContent = err.message || "Unable to check for updates.";
            if (updateDetailsBox) updateDetailsBox.classList.add("hidden");
        }
    } finally {
        if (!silent) {
            btnCheckUpdate.disabled = false;
            if (checkUpdateIcon) checkUpdateIcon.classList.remove("spin-animation");
            btnCheckUpdateText.textContent = "Check for Updates";
        }
    }
}

function renderUpdateDetails(release, asset) {
    if (!updateDetailsBox) return;

    updateDetailsBox.classList.remove("hidden");
    if (updateLatestTag) updateLatestTag.textContent = release.tag_name || release.name;
    if (updateReleaseDate) updateReleaseDate.textContent = formatDate(release.published_at);
    if (updateFileSize) updateFileSize.textContent = formatBytes(asset.size);
    if (updateChangelog) updateChangelog.textContent = release.body || "Official release updates & improvements.";

    if (downloadProgressWrap) downloadProgressWrap.classList.add("hidden");
    if (permissionAlertBox) permissionAlertBox.classList.add("hidden");
    if (btnCancelDownload) btnCancelDownload.classList.add("hidden");

    btnDownloadInstall.classList.remove("hidden");
    btnDownloadText.textContent = "Download & Install";
    btnDownloadInstall.disabled = false;
}

function startDownloadAndInstall() {
    if (!selectedApkAsset) return;

    if (currentUpdateState === 'READY_TO_INSTALL') {
        if (preInstallBackdrop) {
            preInstallBackdrop.classList.remove("hidden");
        }
        return;
    }

    if (window.AndroidUpdateBridge && typeof window.AndroidUpdateBridge.startDownloadWithSecurity === 'function') {
        currentUpdateState = 'DOWNLOADING';
        downloadProgressWrap.classList.remove("hidden");
        btnCancelDownload.classList.remove("hidden");
        btnDownloadInstall.classList.add("hidden");
        downloadProgressBarFill.style.width = '0%';
        downloadPercentLabel.textContent = '0%';
        downloadBytesLabel.textContent = `0 B / ${formatBytes(selectedApkAsset.size)}`;
        downloadStatusLabel.textContent = "Connecting securely...";

        window.AndroidUpdateBridge.startDownloadWithSecurity(
            selectedApkAsset.browser_download_url,
            selectedApkAsset.name,
            selectedApkAsset.size || 0,
            expectedApkSha256 || "",
            releaseManifestJson || "",
            releaseManifestSig || ""
        );
    } else {
        window.open(selectedApkAsset.browser_download_url, '_blank');
        updateStatusMsg.textContent = "Downloading APK in browser.";
    }
}

function cancelDownload() {
    if (window.AndroidUpdateBridge && typeof window.AndroidUpdateBridge.cancelDownload === 'function') {
        window.AndroidUpdateBridge.cancelDownload();
    }
}

// Pre-Install Confirmation Handlers
if (btnConfirmInstall) {
    btnConfirmInstall.addEventListener("click", () => {
        if (preInstallBackdrop) preInstallBackdrop.classList.add("hidden");
        if (window.AndroidUpdateBridge && selectedApkAsset) {
            window.AndroidUpdateBridge.launchInstallerDirectly(selectedApkAsset.name);
        }
    });
}
if (btnCancelInstall) {
    btnCancelInstall.addEventListener("click", () => {
        if (preInstallBackdrop) preInstallBackdrop.classList.add("hidden");
    });
}

// Android Update Bridge Callbacks
window.onUpdateProgress = function(percent, downloadedBytes, totalBytes) {
    if (downloadProgressBarFill) downloadProgressBarFill.style.width = `${percent}%`;
    if (downloadPercentLabel) downloadPercentLabel.textContent = `${percent}%`;
    if (downloadBytesLabel) downloadBytesLabel.textContent = `${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}`;
};

window.onUpdateStatus = function(state, message) {
    if (updateStatusMsg) updateStatusMsg.textContent = message;

    if (state === 'DOWNLOADING') {
        currentUpdateState = 'DOWNLOADING';
        if (downloadProgressWrap) downloadProgressWrap.classList.remove("hidden");
        if (downloadStatusLabel) downloadStatusLabel.textContent = message;
        if (btnCancelDownload) btnCancelDownload.classList.remove("hidden");
        if (btnDownloadInstall) btnDownloadInstall.classList.add("hidden");
    } else if (state === 'DOWNLOAD_SUCCESS') {
        if (downloadStatusLabel) downloadStatusLabel.textContent = message;
    } else if (state === 'VERIFICATION_SUCCESS') {
        if (downloadStatusLabel) downloadStatusLabel.textContent = "Cryptographically verified.";
    } else if (state === 'READY_TO_INSTALL') {
        currentUpdateState = 'READY_TO_INSTALL';
        if (btnCancelDownload) btnCancelDownload.classList.add("hidden");
        if (btnDownloadInstall) {
            btnDownloadInstall.classList.remove("hidden");
            btnDownloadText.textContent = "Install Update";
            btnDownloadInstall.disabled = false;
        }
        if (preInstallBackdrop) {
            preInstallBackdrop.classList.remove("hidden");
        }
    } else if (state === 'PERMISSION_REQUIRED') {
        currentUpdateState = 'PERMISSION_REQUIRED';
        if (permissionAlertBox) permissionAlertBox.classList.remove("hidden");
        if (btnCancelDownload) btnCancelDownload.classList.add("hidden");
        if (btnDownloadInstall) {
            btnDownloadInstall.classList.remove("hidden");
            btnDownloadText.textContent = "Install Now";
            btnDownloadInstall.disabled = false;
        }
    } else if (state === 'INSTALLING') {
        currentUpdateState = 'INSTALLING';
        if (permissionAlertBox) permissionAlertBox.classList.add("hidden");
        if (btnCancelDownload) btnCancelDownload.classList.add("hidden");
        if (btnDownloadInstall) {
            btnDownloadInstall.classList.remove("hidden");
            btnDownloadText.textContent = "Installing...";
            btnDownloadInstall.disabled = true;
        }
    } else if (state === 'CANCELLED') {
        currentUpdateState = 'IDLE';
        if (downloadProgressWrap) downloadProgressWrap.classList.add("hidden");
        if (btnCancelDownload) btnCancelDownload.classList.add("hidden");
        if (btnDownloadInstall) {
            btnDownloadInstall.classList.remove("hidden");
            btnDownloadText.textContent = "Download & Install";
            btnDownloadInstall.disabled = false;
        }
    }
};

window.onUpdateError = function(errorMsg) {
    currentUpdateState = 'IDLE';
    if (updateStatusMsg) updateStatusMsg.textContent = errorMsg;
    if (downloadProgressWrap) downloadProgressWrap.classList.add("hidden");
    if (btnCancelDownload) btnCancelDownload.classList.add("hidden");
    if (btnDownloadInstall) {
        btnDownloadInstall.classList.remove("hidden");
        btnDownloadText.textContent = "Retry Download";
        btnDownloadInstall.disabled = false;
    }
};

window.onInstallPermissionResult = function(granted) {
    if (granted) {
        if (permissionAlertBox) permissionAlertBox.classList.add("hidden");
        if (selectedApkAsset && (currentUpdateState === 'PERMISSION_REQUIRED' || currentUpdateState === 'READY_TO_INSTALL')) {
            if (btnDownloadInstall) {
                btnDownloadInstall.classList.remove("hidden");
                btnDownloadText.textContent = "Install Update";
                btnDownloadInstall.disabled = false;
            }
        }
    }
};

// Event Listeners
if (btnCheckUpdate) btnCheckUpdate.addEventListener("click", () => checkForUpdates(false));
if (btnDownloadInstall) btnDownloadInstall.addEventListener("click", startDownloadAndInstall);
if (btnCancelDownload) btnCancelDownload.addEventListener("click", cancelDownload);
if (btnGrantPermission) {
    btnGrantPermission.addEventListener("click", () => {
        if (window.AndroidUpdateBridge && typeof window.AndroidUpdateBridge.openInstallSettings === 'function') {
            window.AndroidUpdateBridge.openInstallSettings();
        }
    });
}

// Initial Setup
initThemeListeners();
const initialTheme = getSavedTheme();
applyTheme(initialTheme);
updateInstalledVersionUI();

// Auto-check for updates silently on app startup
setTimeout(() => {
    checkForUpdates(true);
}, 1200);
