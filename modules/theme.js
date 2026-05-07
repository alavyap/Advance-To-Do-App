// theme.js - Theme management and switching

import { hasSavedThemePreference, saveTheme } from "./storage.js";

export function applyTheme(theme) {
  const isDark = theme === "dark";
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  if (!themeToggleBtn) return;

  document.body.classList.toggle("dark-theme", isDark);
  themeToggleBtn.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme",
  );
  themeToggleBtn.setAttribute("aria-pressed", isDark);
  themeToggleBtn.title = isDark
    ? "Switch to light theme"
    : "Switch to dark theme";
  themeToggleBtn.innerHTML = `<i class="fa-solid ${
    isDark ? "fa-sun" : "fa-moon"
  }"></i>`;
}

export function setTheme(theme) {
  saveTheme(theme);
  applyTheme(theme);
}

export function syncThemeWithSystemDefault() {
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

  const applySystemTheme = (event) => {
    if (!hasSavedThemePreference()) {
      applyTheme(event.matches ? "dark" : "light");
    }
  };

  if (systemTheme.addEventListener) {
    systemTheme.addEventListener("change", applySystemTheme);
  } else {
    systemTheme.addListener(applySystemTheme);
  }
}

export function toggleTheme() {
  const newTheme = document.body.classList.contains("dark-theme")
    ? "light"
    : "dark";
  setTheme(newTheme);
}
