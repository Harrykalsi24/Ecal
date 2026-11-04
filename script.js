/**
 * Ecal: 2-Page Mobile Banking EMI Engine with Swipe Navigation
 * Features GitHub-Based Manual APK Update System
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

    // Display No. of Months on results page
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

    // Display No. of Months on results page
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

// Reactive input change
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
// 3. Theme Controller (System, Dark, Light)
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
// 4. Settings Menu Modal (Top Right)
// ==========================================

const btnSettingsTrigger = document.getElementById("btnSettingsTrigger");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const settingsModalBackdrop = document.getElementById("settingsModalBackdrop");
const settingsSheet = document.getElementById("settingsSheet");

function openSettingsModal() {
    if (settingsModalBackdrop) {
        settingsModalBackdrop.classList.add("open");
        settingsModalBackdrop.setAttribute("aria-hidden", "false");
    }
    updateInstalledVersionUI();
}

function closeSettingsModal() {
    if (settingsModalBackdrop) {
        settingsModalBackdrop.classList.remove("open");
        settingsModalBackdrop.setAttribute("aria-hidden", "true");
    }
}

if (btnSettingsTrigger) {
    btnSettingsTrigger.addEventListener("click", openSettingsModal);
}
if (btnCloseSettings) {
    btnCloseSettings.addEventListener("click", closeSettingsModal);
}
if (settingsModalBackdrop) {
    settingsModalBackdrop.addEventListener("click", (e) => {
        if (e.target === settingsModalBackdrop) {
            closeSettingsModal();
        }
    });
}

// ==========================================
// 5. GitHub-Based Manual APK Update System
// ==========================================

const GITHUB_REPO = "Harrykalsi24/Ecal";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

let latestReleaseData = null;
let selectedApkAsset = null;
let currentUpdateState = 'IDLE'; // IDLE, CHECKING, AVAILABLE, UP_TO_DATE, DOWNLOADING, VERIFIED, PERMISSION_REQUIRED, INSTALLING

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

function getInstalledVersion() {
    if (window.AndroidUpdateBridge && typeof window.AndroidUpdateBridge.getAppVersionName === 'function') {
        try {
            return window.AndroidUpdateBridge.getAppVersionName();
        } catch (e) {
            console.warn("Could not retrieve version from AndroidUpdateBridge", e);
        }
    }
    return "1.2.0";
}

function updateInstalledVersionUI() {
    const ver = getInstalledVersion();
    if (appInstalledVersionEl) {
        appInstalledVersionEl.textContent = `v${ver.replace(/^v/i, '')}`;
    }
}

// Semantic Version Comparison
function parseSemVer(v) {
    if (!v) return [0, 0, 0];
    const clean = v.toString().replace(/^v/i, '').trim();
    const parts = clean.split(/[-+]/)[0].split('.');
    return parts.map(p => parseInt(p, 10) || 0);
}

function compareVersions(v1, v2) {
    // 1 if v1 > v2, -1 if v1 < v2, 0 if equal
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

async function checkForUpdates() {
    if (currentUpdateState === 'CHECKING' || currentUpdateState === 'DOWNLOADING') {
        return;
    }

    currentUpdateState = 'CHECKING';
    btnCheckUpdate.disabled = true;
    if (checkUpdateIcon) checkUpdateIcon.classList.add("spin-animation");
    btnCheckUpdateText.textContent = "Checking for updates...";
    updateStatusMsg.textContent = "Connecting to GitHub Releases...";
    if (updateDetailsBox) updateDetailsBox.classList.add("hidden");

    const installedVer = getInstalledVersion();
    updateInstalledVersionUI();

    try {
        if (!navigator.onLine) {
            throw new Error("No internet connection available. Please check your network.");
        }

        const response = await fetch(GITHUB_API_URL, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 403 || response.status === 429) {
            throw new Error("GitHub rate limit reached. Please try again shortly.");
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
        if (!latestTag) {
            throw new Error("Invalid GitHub release data received.");
        }

        // Find APK asset
        const assets = release.assets || [];
        const apkAsset = assets.find(a => 
            (a.name && a.name.toLowerCase().endsWith(".apk")) || 
            a.content_type === "application/vnd.android.package-archive"
        );

        if (!apkAsset) {
            throw new Error(`Release ${latestTag} found, but no APK asset is attached.`);
        }

        selectedApkAsset = apkAsset;

        // Version comparison
        const cmp = compareVersions(latestTag, installedVer);

        if (cmp > 0) {
            // Update Available
            currentUpdateState = 'AVAILABLE';
            updateStatusMsg.textContent = "New update available!";
            renderUpdateDetails(release, apkAsset, installedVer);
        } else {
            // Up to date
            currentUpdateState = 'UP_TO_DATE';
            updateStatusMsg.textContent = "You're using the latest version.";
            if (updateDetailsBox) updateDetailsBox.classList.add("hidden");
        }

    } catch (err) {
        currentUpdateState = 'IDLE';
        updateStatusMsg.textContent = err.message || "Unable to check for updates.";
        if (updateDetailsBox) updateDetailsBox.classList.add("hidden");
    } finally {
        btnCheckUpdate.disabled = false;
        if (checkUpdateIcon) checkUpdateIcon.classList.remove("spin-animation");
        btnCheckUpdateText.textContent = "Check for Updates";
    }
}

function renderUpdateDetails(release, asset, installedVer) {
    if (!updateDetailsBox) return;

    updateDetailsBox.classList.remove("hidden");
    if (updateLatestTag) updateLatestTag.textContent = release.tag_name || release.name;
    if (updateReleaseDate) updateReleaseDate.textContent = formatDate(release.published_at);
    if (updateFileSize) updateFileSize.textContent = formatBytes(asset.size);
    if (updateChangelog) updateChangelog.textContent = release.body || "No release notes provided.";

    // Reset progress UI
    if (downloadProgressWrap) downloadProgressWrap.classList.add("hidden");
    if (permissionAlertBox) permissionAlertBox.classList.add("hidden");
    if (btnCancelDownload) btnCancelDownload.classList.add("hidden");

    btnDownloadInstall.classList.remove("hidden");
    btnDownloadText.textContent = "Download & Install";
    btnDownloadInstall.disabled = false;
}

function startDownloadAndInstall() {
    if (!selectedApkAsset) return;

    if (currentUpdateState === 'VERIFIED' || currentUpdateState === 'PERMISSION_REQUIRED') {
        // APK is already downloaded and verified, trigger installation
        if (window.AndroidUpdateBridge) {
            window.AndroidUpdateBridge.installExistingApk(selectedApkAsset.name);
            return;
        }
    }

    if (window.AndroidUpdateBridge && typeof window.AndroidUpdateBridge.startDownload === 'function') {
        currentUpdateState = 'DOWNLOADING';
        downloadProgressWrap.classList.remove("hidden");
        btnCancelDownload.classList.remove("hidden");
        btnDownloadInstall.classList.add("hidden");
        downloadProgressBarFill.style.width = '0%';
        downloadPercentLabel.textContent = '0%';
        downloadBytesLabel.textContent = `0 B / ${formatBytes(selectedApkAsset.size)}`;
        downloadStatusLabel.textContent = "Downloading update...";

        window.AndroidUpdateBridge.startDownload(
            selectedApkAsset.browser_download_url,
            selectedApkAsset.name,
            selectedApkAsset.size || 0
        );
    } else {
        // Fallback for browser testing
        window.open(selectedApkAsset.browser_download_url, '_blank');
        updateStatusMsg.textContent = "Downloading APK in browser.";
    }
}

function cancelDownload() {
    if (window.AndroidUpdateBridge && typeof window.AndroidUpdateBridge.cancelDownload === 'function') {
        window.AndroidUpdateBridge.cancelDownload();
    }
}

// Android Update Bridge Global Event Handlers
window.onUpdateProgress = function(percent, downloadedBytes, totalBytes) {
    if (downloadProgressBarFill) {
        downloadProgressBarFill.style.width = `${percent}%`;
    }
    if (downloadPercentLabel) {
        downloadPercentLabel.textContent = `${percent}%`;
    }
    if (downloadBytesLabel) {
        downloadBytesLabel.textContent = `${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}`;
    }
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
        currentUpdateState = 'VERIFIED';
        if (downloadStatusLabel) downloadStatusLabel.textContent = "APK verified successfully.";
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
        if (currentUpdateState === 'PERMISSION_REQUIRED' && selectedApkAsset) {
            if (btnDownloadInstall) {
                btnDownloadInstall.classList.remove("hidden");
                btnDownloadText.textContent = "Install Now";
                btnDownloadInstall.disabled = false;
            }
        }
    }
};

// Event Listeners
if (btnCheckUpdate) {
    btnCheckUpdate.addEventListener("click", checkForUpdates);
}
if (btnDownloadInstall) {
    btnDownloadInstall.addEventListener("click", startDownloadAndInstall);
}
if (btnCancelDownload) {
    btnCancelDownload.addEventListener("click", cancelDownload);
}
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
