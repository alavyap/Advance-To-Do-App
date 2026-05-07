// storage.js - Data persistence with localStorage

import {
  STORAGE_KEY,
  THEME_STORAGE_KEY,
  FOCUSED_MODE_STORAGE_KEY,
} from "./constants.js";
import { setTasks } from "./state.js";

// Load tasks from storage
export function loadData() {
  const saved =
    localStorage.getItem(STORAGE_KEY) || localStorage.getItem("todoData");
  if (saved) {
    try {
      setTasks(JSON.parse(saved) || []);
    } catch (error) {
      console.error("Error parsing stored tasks:", error);
      setTasks([]);
    }
  } else {
    setTasks([]);
  }
}

// Save tasks to storage
export function saveData(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
}

// Get preferred theme (localStorage or system preference)
export function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Save theme preference to storage
export function saveTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

// Load focused mode state
export function loadFocusedMode() {
  return localStorage.getItem(FOCUSED_MODE_STORAGE_KEY) === "true";
}

// Save focused mode state
export function saveFocusedMode(active) {
  localStorage.setItem(FOCUSED_MODE_STORAGE_KEY, active);
}

// Time-based greeting
export function updateGreeting() {
  const hour = new Date().getHours();
  let greet = "Good Morning";
  if (hour >= 12 && hour < 18) greet = "Good Afternoon";
  else if (hour >= 18) greet = "Good Evening";

  const greetingElement = document.getElementById("greeting");
  if (greetingElement) {
    greetingElement.textContent = `${greet} !!`;
  }
}
