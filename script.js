/**
 * Ecal: 2-Page Mobile Banking EMI Engine with Swipe Navigation
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

    // Only handle horizontal swipes if horizontal movement dominates vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
        if (diffX < 0 && activeSlide === 0) {
            // Swipe Left -> Go to Results
            goToSlide(1);
        } else if (diffX > 0 && activeSlide === 1) {
            // Swipe Right -> Go to Inputs
            goToSlide(0);
        }
    }
}

// ==========================================
// 3. Theme Controller (System, Dark, Light)
// ==========================================

const THEME_KEY = 'ecal_theme_pref';
const mediaQueryDark = window.matchMedia('(prefers-color-scheme: dark)');
const themePillBtns = document.querySelectorAll('.theme-pill-btn');

function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
    const effectiveTheme = theme === 'system' 
        ? (mediaQueryDark.matches ? 'dark' : 'light') 
        : theme;

    document.documentElement.setAttribute('data-theme', effectiveTheme);

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

themePillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const chosen = btn.getAttribute('data-theme-val');
        applyTheme(chosen);
    });
});

// Initial Setup
const initialTheme = getSavedTheme();
applyTheme(initialTheme);
goToSlide(0);
calculateCurrent();
