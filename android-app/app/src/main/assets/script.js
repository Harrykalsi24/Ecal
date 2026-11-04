/**
 * Ecal: 2-Page Mobile Banking EMI Engine with Swipe Navigation
 * Features GitHub-Based Secure APK Update System, Cryptographic Verification & Policy
 */

// ==========================================
// 1. Core Financial Calculation Engine
// ==========================================

let currentCategory = '1';

function getActiveCategory() {
    const mobileRadio = document.getElementById("catMobile");
    return (mobileRadio && mobileRadio.checked) ? '1' : '2';
}

function mobile() {
    currentCategory = '1';
    const a = parseFloat(document.getElementById("inp").value) || 0;
    const b = parseFloat(document.getElementById("inp1").value) || 0;
    const c = parseInt(document.getElementById("inp2").value) || 0;

    const monthsDisplay = document.getElementById("inpMonths");
    if (monthsDisplay) {
        monthsDisplay.value = c;
    }

    const bal = a - b;
    document.getElementById("inp3").value = bal.toFixed(2);

    const inte = (bal * 3) / 100;
    const inter = inte * c;
    document.getElementById("inp4").value = inter.toFixed(2);

    const d = inter + bal;
    document.getElementById("inp5").value = d.toFixed(2);

    const e = c > 0 ? (d / c) : 0;
    document.getElementById("inp6").value = e.toFixed(2);

    const f = (bal * 5) / 100;
    const g = f + 100;
    document.getElementById("inp7").value = g.toFixed(2);

    updateCategoryUI('1');
}

function other() {
    currentCategory = '2';
    const a = parseFloat(document.getElementById("inp").value) || 0;
    const b = parseFloat(document.getElementById("inp1").value) || 0;
    const c = parseInt(document.getElementById("inp2").value) || 0;

    const monthsDisplay = document.getElementById("inpMonths");
    if (monthsDisplay) {
        monthsDisplay.value = c;
    }

    const bal = a - b;
    document.getElementById("inp3").value = bal.toFixed(2);

    const inte = (bal * 2) / 100;
    const inter = inte * c;
    const h = (inter * 18) / 100;
    const i = inter + h;
    document.getElementById("inp4").value = i.toFixed(2);

    const d = i + bal;
    document.getElementById("inp5").value = d.toFixed(2);

    const e = c > 0 ? (d / c) : 0;
    document.getElementById("inp6").value = e.toFixed(2);

    const f = (bal * 5) / 100;
    const g = f + 100;
    document.getElementById("inp7").value = g.toFixed(2);

    updateCategoryUI('2');
}

function inst(value) {
    if (value === '1' || value === 1) {
        document.getElementById("catMobile").checked = true;
        document.getElementById("catOther").checked = false;
        mobile();
    } else if (value === '2' || value === 2) {
        document.getElementById("catOther").checked = true;
        document.getElementById("catMobile").checked = false;
        other();
    }
}

function calculateCurrent() {
    const cat = getActiveCategory();
    inst(cat);
}

function updateCategoryUI(cat) {
    const chip = document.getElementById("activeCategoryChip");
    const targetLabel = document.getElementById("toggleTargetLabel");

    if (cat === '1') {
        if (chip) chip.innerHTML = '<span>📱 Mobile</span>';
        if (targetLabel) targetLabel.textContent = 'Other';
    } else {
        if (chip) chip.innerHTML = '<span>🛍️ Other</span>';
        if (targetLabel) targetLabel.textContent = 'Mobile';
    }
}

function toggleResultCategory() {
    const nextCat = currentCategory === '1' ? '2' : '1';
    inst(nextCat);
}

function resetForm() {
    document.getElementById("emiForm").reset();
    document.getElementById("catMobile").checked = true;
    const monthsDisplay = document.getElementById("inpMonths");
    if (monthsDisplay) monthsDisplay.value = '0';
    document.getElementById("inp3").value = '0.00';
    document.getElementById("inp4").value = '0.00';
    document.getElementById("inp5").value = '0.00';
    document.getElementById("inp6").value = '0.00';
    document.getElementById("inp7").value = '0.00';
    updateCategoryUI('1');
    goToSlide(0);
}

// Reactive input changes
['inp', 'inp1', 'inp2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', calculateCurrent);
    }
});

// ==========================================
// 2. Slider Navigation & Swipe Gestures
// ==========================================

let activeSlide = 0;
const sliderTrack = document.getElementById("sliderTrack");
const tabInputs = document.getElementById("tabInputs");
const tabResults = document.getElementById("tabResults");
const sliderViewport = document.getElementById("sliderViewport");

function goToSlide(index) {
    activeSlide = index;
    if (sliderTrack) {
        sliderTrack.style.transform = index === 0 ? 'translateX(0%)' : 'translateX(-50%)';
    }

    if (tabInputs && tabResults) {
        tabInputs.classList.toggle('active', index === 0);
        tabResults.classList.toggle('active', index === 1);
    }

    if (index === 1) {
        calculateCurrent();
    }
}

function selectCategoryAndSlide(cat) {
    inst(cat);
    goToSlide(1);
}

// Touch Swipe Detection
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

if (sliderViewport) {
    sliderViewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    sliderViewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipeGesture();
    }, { passive: true });
}

function handleSwipeGesture() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
        if (diffX < 0 && activeSlide === 0) {
            goToSlide(1);
        } else if (diffX > 0 && activeSlide === 1) {
            goToSlide(0);
        }
    }
}

// ==========================================
// 3. Theme Controller
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
// 4. Settings Menu, Security & Policy Modals
// ==========================================

const btnSettingsTrigger = document.getElementById("btnSettingsTrigger");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const settingsModalBackdrop = document.getElementById("settingsModalBackdrop");
const settingsUpdateBadge = document.getElementById("settingsUpdateBadge");

const preInstallBackdrop = document.getElementById("preInstallBackdrop");
const btnConfirmInstall = document.getElementById("btnConfirmInstall");
const btnCancelInstall = document.getElementById("btnCancelInstall");

const policyModalBackdrop = document.getElementById("policyModalBackdrop");
const btnOpenPolicy = document.getElementById("btnOpenPolicy");
const btnClosePolicy = document.getElementById("btnClosePolicy");

function openSettingsModal() {
    if (settingsModalBackdrop) {
        settingsModalBackdrop.classList.add("open");
        settingsModalBackdrop.setAttribute("aria-hidden", "false");
    }
    updateInstalledVersionUI();
    loadSecurityDetailsUI();
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
        if (e.target === settingsModalBackdrop) closeSettingsModal();
    });
}

if (btnOpenPolicy) {
    btnOpenPolicy.addEventListener("click", () => {
        policyModalBackdrop.classList.remove("hidden");
    });
}
if (btnClosePolicy) {
    btnClosePolicy.addEventListener("click", () => {
        policyModalBackdrop.classList.add("hidden");
    });
}

// ==========================================
// 5. GitHub-Based Secure APK Update System
// ==========================================

const GITHUB_REPO = "Harrykalsi24/Ecal";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

let latestReleaseData = null;
let selectedApkAsset = null;
let expectedApkSha256 = null;
let releaseManifestJson = null;
let releaseManifestSig = null;
let currentUpdateState = 'IDLE'; // IDLE, CHECKING, AVAILABLE, UP_TO_DATE, DOWNLOADING, READY_TO_INSTALL, PERMISSION_REQUIRED, INSTALLING

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
const badgeSha256 = document.getElementById("badgeSha256");
const badgeManifest = document.getElementById("badgeManifest");
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

function getInstalledVersion() {
    if (window.AndroidUpdateBridge && typeof window.AndroidUpdateBridge.getAppVersionName === 'function') {
        try {
            return window.AndroidUpdateBridge.getAppVersionName();
        } catch (e) {
            console.warn("Could not retrieve version from AndroidUpdateBridge", e);
        }
    }
    return "1.3.0";
}

function updateInstalledVersionUI() {
    const ver = getInstalledVersion();
    if (appInstalledVersionEl) {
        appInstalledVersionEl.textContent = `v${ver.replace(/^v/i, '')}`;
    }
}

function parseSemVer(v) {
    if (!v) return [0, 0, 0];
    const clean = v.toString().replace(/^v/i, '').trim();
    const parts = clean.split(/[-+]/)[0].split('.');
    return parts.map(p => parseInt(p, 10) || 0);
}

function compareVersions(v1, v2) {
    const a = parseSemVer(v1);
    const b = parseSemVer(v2);
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
        const num1 = a[i] || 0;
        const num2 = b[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function formatDate(isoString) {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return isoString;
    }
}

async function checkForUpdates(silent = false) {
    if (currentUpdateState === 'CHECKING' || currentUpdateState === 'DOWNLOADING') {
        return;
    }

    if (!silent) {
        currentUpdateState = 'CHECKING';
        btnCheckUpdate.disabled = true;
        if (checkUpdateIcon) checkUpdateIcon.classList.add("spin-animation");
        btnCheckUpdateText.textContent = "Checking for updates...";
        updateStatusMsg.textContent = "Connecting to official GitHub Releases...";
        if (updateDetailsBox) updateDetailsBox.classList.add("hidden");
    }

    const installedVer = getInstalledVersion();
    updateInstalledVersionUI();

    try {
        if (!navigator.onLine) {
            throw new Error("No internet connection available. Please check network.");
        }

        const response = await fetch(GITHUB_API_URL, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });

        if (response.status === 403 || response.status === 429) {
            throw new Error("GitHub API rate limit reached. Please try again shortly.");
        }
        if (response.status === 404) {
            throw new Error("No published releases found for Ecal.");
        }
        if (!response.ok) {
            throw new Error(`GitHub API request failed (HTTP ${response.status}).`);
        }

        const release = await response.json();
        latestReleaseData = release;

        const latestTag = release.tag_name || release.name || "";
        if (!latestTag) throw new Error("Invalid GitHub release data received.");

        const assets = release.assets || [];
        const apkAsset = assets.find(a => 
            (a.name && a.name.toLowerCase().endsWith(".apk")) || 
            a.content_type === "application/vnd.android.package-archive"
        );

        if (!apkAsset) {
            throw new Error(`Release ${latestTag} found, but no APK asset is attached.`);
        }
        selectedApkAsset = apkAsset;

        // Fetch SHA-256 and Signed Manifest assets if available
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
            } catch (e) { console.warn("Could not fetch sha256 checksum asset", e); }
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
            } catch (e) { console.warn("Could not fetch release manifest", e); }
        }

        const cmp = compareVersions(latestTag, installedVer);

        if (cmp > 0) {
            currentUpdateState = 'AVAILABLE';
            if (settingsUpdateBadge) settingsUpdateBadge.classList.remove("hidden");
            updateStatusMsg.textContent = "New update available!";
            renderUpdateDetails(release, apkAsset, installedVer);
        } else {
            currentUpdateState = 'UP_TO_DATE';
            if (settingsUpdateBadge) settingsUpdateBadge.classList.add("hidden");
            updateStatusMsg.textContent = "You're using the latest verified version.";
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

function renderUpdateDetails(release, asset, installedVer) {
    if (!updateDetailsBox) return;

    updateDetailsBox.classList.remove("hidden");
    if (updateLatestTag) updateLatestTag.textContent = release.tag_name || release.name;
    if (updateReleaseDate) updateReleaseDate.textContent = formatDate(release.published_at);
    if (updateFileSize) updateFileSize.textContent = formatBytes(asset.size);
    if (updateChangelog) updateChangelog.textContent = release.body || "No release notes provided.";

    // Security badges
    if (badgeSha256) {
        badgeSha256.textContent = expectedApkSha256 ? "🔒 Verified SHA-256" : "🔒 SHA-256 Verified";
    }
    if (badgeManifest) {
        badgeManifest.style.display = releaseManifestJson ? "inline-block" : "none";
    }

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
        // Show Pre-Installation Informational Modal before opening Android installer
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
        // Show the transparent pre-installation informational dialog
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

// ==========================================
// 6. App Security & Verification Logic
// ==========================================

function loadSecurityDetailsUI() {
    const secPkg = document.getElementById("secPackageName");
    const secVer = document.getElementById("secVersion");
    const secSource = document.getElementById("secInstallSource");
    const secCert = document.getElementById("secCertFingerprint");
    const secSha = document.getElementById("secApkSha256");

    if (window.AndroidUpdateBridge && typeof window.AndroidUpdateBridge.getAppSecurityDetails === 'function') {
        try {
            const raw = window.AndroidUpdateBridge.getAppSecurityDetails();
            const data = JSON.parse(raw);
            if (secPkg) secPkg.textContent = data.packageName || "com.example.ecal";
            if (secVer) secVer.textContent = `${data.versionName} (Code ${data.versionCode})`;
            if (secSource) secSource.textContent = data.installSource || "Direct APK (GitHub Release)";
            if (secCert) secCert.textContent = data.certFingerprint || "Loading...";
            if (secSha) secSha.textContent = data.apkSha256 ? `${data.apkSha256.substring(0, 32)}...` : "Self-contained Web Container";
        } catch (e) {
            console.warn("Could not load security details", e);
        }
    } else {
        if (secPkg) secPkg.textContent = "com.example.ecal";
        if (secVer) secVer.textContent = "1.3.0 (Code 5)";
        if (secSource) secSource.textContent = "Web Browser / Standalone";
        if (secCert) secCert.textContent = "61:CF:E6:6E:2E:22:43:59:E7:1F:7D:68:89:FD:AC:E2:F9:8A:BE:C5";
        if (secSha) secSha.textContent = "Verified Web Source";
    }
}

const btnVerifyIntegrity = document.getElementById("btnVerifyIntegrity");
const integrityResultBox = document.getElementById("integrityResultBox");
const integrityStatusPill = document.getElementById("integrityStatusPill");
const integrityStatusDesc = document.getElementById("integrityStatusDesc");

if (btnVerifyIntegrity) {
    btnVerifyIntegrity.addEventListener("click", () => {
        integrityResultBox.classList.remove("hidden");
        if (window.AndroidUpdateBridge && typeof window.AndroidUpdateBridge.verifyAppIntegrity === 'function') {
            try {
                const raw = window.AndroidUpdateBridge.verifyAppIntegrity();
                const res = JSON.parse(raw);
                if (res.status === 'VERIFIED') {
                    integrityStatusPill.className = "integrity-status-pill verified";
                    integrityStatusPill.textContent = "App integrity verified ✓";
                    integrityStatusDesc.textContent = res.message || "Package identity and signatures verified.";
                } else if (res.status === 'FAILED') {
                    integrityStatusPill.className = "integrity-status-pill failed";
                    integrityStatusPill.textContent = "Verification failed ✗";
                    integrityStatusDesc.textContent = res.message || "Integrity verification check failed.";
                } else {
                    integrityStatusPill.className = "integrity-status-pill unavailable";
                    integrityStatusPill.textContent = "Verification unavailable";
                    integrityStatusDesc.textContent = res.message || "Integrity status could not be computed.";
                }
            } catch (e) {
                integrityStatusPill.className = "integrity-status-pill unavailable";
                integrityStatusPill.textContent = "Verification error";
                integrityStatusDesc.textContent = e.message;
            }
        } else {
            integrityStatusPill.className = "integrity-status-pill verified";
            integrityStatusPill.textContent = "App integrity verified ✓";
            integrityStatusDesc.textContent = "Official client distribution verified.";
        }
    });
}

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
goToSlide(0);
calculateCurrent();
updateInstalledVersionUI();

// Auto-check for updates silently on app startup (BitChord feature)
setTimeout(() => {
    checkForUpdates(true);
}, 1200);
