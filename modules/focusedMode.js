// focusedMode.js - Focused mode functionality

import { focusedModeActive, setFocusedModeActive } from "./state.js";
import { saveFocusedMode } from "./storage.js";
import {
  ON_HOLD_LIMIT,
  ON_HOLD_LIMIT_MESSAGE,
  FOCUSED_WORK_LIMIT,
  FOCUSED_WORK_LIMIT_MESSAGE,
} from "./constants.js";
import {
  getFocusedOnHoldCount,
  getOnHoldCount,
  ownsFocusedOnHoldSlot,
  setDisabled,
} from "./limits.js";

export function toggleFocusedMode() {
  const nextFocusedMode = !focusedModeActive;
  setFocusedModeActive(nextFocusedMode);
  saveFocusedMode(nextFocusedMode);
}

export function updateFocusedModeControls() {
  const isFocused = focusedModeActive;
  const onHoldLimitReached = getOnHoldCount() >= ON_HOLD_LIMIT;

  const focusModeBtn = document.getElementById("focusModeBtn");
  const addTaskBtn = document.getElementById("addTaskBtn");

  if (!focusModeBtn || !addTaskBtn) return;

  // Focus mode button styling
  focusModeBtn.classList.toggle("active", isFocused);
  focusModeBtn.setAttribute("aria-pressed", isFocused);
  focusModeBtn.title = isFocused
    ? "Showing focused on-hold tasks"
    : "Show focused on-hold tasks";

  // Disable buttons when in focused mode
  const taskButtons = [...document.querySelectorAll(".task-item .icon-btn")];
  setDisabled(taskButtons, isFocused, "Turn off focused mode to edit tasks.");

  setDisabled(
    [addTaskBtn],
    isFocused || onHoldLimitReached,
    isFocused ? "Turn off focused mode to edit tasks." : ON_HOLD_LIMIT_MESSAGE,
  );

  // Disable dragging in focused mode
  document.querySelectorAll(".task-item .draggable").forEach((el) => {
    el.style.pointerEvents = isFocused ? "none" : "";
  });
}

export function updateFocusedWorkAvailability(editingId) {
  const focusedWorkInput = document.getElementById("focusedWork");
  const focusedWorkToggle = document.querySelector(".focused-work-toggle");
  const status = document.getElementById("taskStatus")?.value;

  if (!focusedWorkInput || !focusedWorkToggle) return;

  const limitReached =
    status !== "completed" &&
    !ownsFocusedOnHoldSlot(editingId) &&
    getFocusedOnHoldCount(editingId) >= FOCUSED_WORK_LIMIT;

  focusedWorkInput.disabled = limitReached;
  focusedWorkToggle.classList.toggle("disabled", limitReached);
  focusedWorkToggle.title = limitReached ? FOCUSED_WORK_LIMIT_MESSAGE : "";

  if (limitReached) focusedWorkInput.checked = false;
}
