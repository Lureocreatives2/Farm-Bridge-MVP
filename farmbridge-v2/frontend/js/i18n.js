// js/i18n.js
// Lightweight i18n engine for FarmBridge
// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS:
//  1. HTML elements get a data-i18n="key" attribute
//  2. applyTranslations() replaces their textContent from the loaded JSON
//  3. data-i18n-placeholder="key" fills input placeholder attributes
//  4. Language preference is saved to localStorage
//  5. initI18n() must be called on every page load
// ─────────────────────────────────────────────────────────────────────────────

const SUPPORTED_LANGS = ["en", "yo", "ha", "ig", "pc"];
const LANG_NAMES = { en: "English", yo: "Yorùbá", ha: "Hausa", ig: "Igbo", pc: "Pidgin" };
const LANG_FLAGS = { en: "🇬🇧", yo: "🌍", ha: "🌍", ig: "🌍", pc: "🇳🇬" };

let translations = {};
let currentLang = "en";

// ── Load a language file ──────────────────────────────────────────────────────
async function loadLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = "en";
  try {
    // Path must work relative to any page in /pages/
    const base = location.pathname.includes("/pages/") ? "../lang/" : "lang/";
    const res = await fetch(`${base}${lang}.json`);
    if (!res.ok) throw new Error(`Lang file not found: ${lang}`);
    translations = await res.json();
    currentLang = lang;
    localStorage.setItem("fb_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr"; // All supported langs are LTR
  } catch (err) {
    console.warn("i18n: falling back to English", err);
    if (lang !== "en") return loadLanguage("en");
  }
}

// ── Get a translation string, with optional interpolation ────────────────────
// Usage: t("results_showing", { from: 1, to: 12, total: 48 })
function t(key, vars = {}) {
  let str = translations[key] || key;
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(`{${k}}`, v);
  });
  return str;
}

// ── Apply all data-i18n attributes to the DOM ────────────────────────────────
function applyTranslations() {
  // Text content
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[key] !== undefined) el.textContent = translations[key];
  });

  // Placeholder attributes
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const key = el.getAttribute("data-i18n-ph");
    if (translations[key] !== undefined) el.placeholder = translations[key];
  });

  // Title attributes (tooltips)
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    if (translations[key] !== undefined) el.title = translations[key];
  });
}

// ── Build the language switcher dropdown ─────────────────────────────────────
function buildLangSwitcher(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="lang-switcher">
      <button class="lang-btn" id="lang-toggle" aria-label="Switch language">
        ${LANG_FLAGS[currentLang]} <span data-i18n="lang_name">${LANG_NAMES[currentLang]}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
          <path d="M0 0l5 6 5-6z"/>
        </svg>
      </button>
      <div class="lang-dropdown" id="lang-dropdown">
        ${SUPPORTED_LANGS.map(lang => `
          <button class="lang-option ${lang === currentLang ? "active" : ""}"
                  data-lang="${lang}" onclick="switchLanguage('${lang}')">
            ${LANG_FLAGS[lang]} ${LANG_NAMES[lang]}
          </button>
        `).join("")}
      </div>
    </div>`;

  // Toggle dropdown
  document.getElementById("lang-toggle").addEventListener("click", () => {
    document.getElementById("lang-dropdown").classList.toggle("open");
  });

  // Close on outside click
  document.addEventListener("click", e => {
    if (!e.target.closest(".lang-switcher")) {
      document.getElementById("lang-dropdown")?.classList.remove("open");
    }
  });
}

// ── Switch language and re-render ─────────────────────────────────────────────
async function switchLanguage(lang) {
  await loadLanguage(lang);
  applyTranslations();
  buildLangSwitcher("lang-switcher-root");
  document.getElementById("lang-dropdown")?.classList.remove("open");

  // Dispatch event so pages can re-render dynamic content (dropdowns, etc.)
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

// ── Init: call once on every page ────────────────────────────────────────────
async function initI18n() {
  const saved = localStorage.getItem("fb_lang") || "en";
  await loadLanguage(saved);
  applyTranslations();
  buildLangSwitcher("lang-switcher-root");
}

// ── Expose globals ────────────────────────────────────────────────────────────
window.t = t;
window.initI18n = initI18n;
window.switchLanguage = switchLanguage;
window.applyTranslations = applyTranslations;
window.currentLang = () => currentLang;
window.LANG_FLAGS = LANG_FLAGS;
window.LANG_NAMES = LANG_NAMES;
