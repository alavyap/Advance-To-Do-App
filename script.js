// script.js - Main entry point, imports and initializes all modules

// ========================================
// IMPORTS
// ========================================

import {
  getPreferredTheme,
  loadData,
  updateGreeting,
  loadFocusedMode,
} from "./modules/storage.js";
import {
  applyTheme,
  syncThemeWithSystemDefault,
  toggleTheme,
} from "./modules/theme.js";
import { toggleFocusedMode } from "./modules/focusedMode.js";
import { setFocusedModeActive } from "./modules/state.js";
import {
  initializeModalListeners,
  openAddTaskModal,
  closeModal,
  editTaskModal,
} from "./modules/modal.js";
import { toggleTaskCompletion, deleteTask } from "./modules/taskManager.js";
import { renderTasks } from "./modules/ui.js";
import {
  handlePointerDragStart,
  handlePointerDragMove,
  handlePointerDragEnd,
  handlePointerDragCancel,
} from "./modules/dragDrop.js";

// ========================================
// GLOBAL FUNCTION WRAPPERS
// ========================================
// These expose module functions to HTML onclick handlers

window.openAddTaskModal = openAddTaskModal;
window.closeModal = closeModal;
window.editTask = editTaskModal;
window.deleteTask = deleteTask;
window.toggleTask = toggleTaskCompletion;
window.handlePointerDragStart = handlePointerDragStart;
window.handlePointerDragMove = handlePointerDragMove;
window.handlePointerDragEnd = handlePointerDragEnd;
window.handlePointerDragCancel = handlePointerDragCancel;

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  // Theme toggle button
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  // Focused mode button
  const focusModeBtn = document.getElementById("focusModeBtn");
  if (focusModeBtn) {
    focusModeBtn.addEventListener("click", () => {
      toggleFocusedMode();
      renderTasks();
    });
  }

  // Modal listeners
  initializeModalListeners();
}

// ========================================
// INITIALIZATION
// ========================================

function initialize() {
  // 1. Load and apply theme
  applyTheme(getPreferredTheme());
  syncThemeWithSystemDefault();

  // 2. Load focused mode state
  setFocusedModeActive(loadFocusedMode());

  // 3. Load data and render
  loadData();
  renderTasks();
  updateGreeting();

  // 4. Setup event listeners
  setupEventListeners();

  console.log("✅ Todo App initialized successfully!");
}

// ========================================
// LOAD ON READY
// ========================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
