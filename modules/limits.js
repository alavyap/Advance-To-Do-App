// limits.js - Task limits validation and enforcement

import {
  FOCUSED_WORK_LIMIT,
  FOCUSED_WORK_LIMIT_MESSAGE,
  ON_HOLD_LIMIT,
  ON_HOLD_LIMIT_MESSAGE,
} from "./constants.js";
import { tasks } from "./state.js";

// Count focused tasks on hold
export function getFocusedOnHoldCount(excludedId = null) {
  return tasks.filter(
    (task) => task.id !== excludedId && !task.completed && task.focusedWork,
  ).length;
}

// Count all tasks on hold
export function getOnHoldCount(excludedId = null) {
  return tasks.filter((task) => task.id !== excludedId && !task.completed)
    .length;
}

// Check if task owns an on-hold slot
export function ownsOnHoldSlot(id) {
  const task = tasks.find((t) => t.id === id);
  return Boolean(task && !task.completed);
}

// Check if task owns a focused on-hold slot
export function ownsFocusedOnHoldSlot(id) {
  const task = tasks.find((t) => t.id === id);
  return Boolean(task && !task.completed && task.focusedWork);
}

// Check if adding/updating task exceeds on-hold limit
export function exceedsOnHoldLimit(id, status) {
  return (
    status !== "completed" &&
    !ownsOnHoldSlot(id) &&
    getOnHoldCount(id) >= ON_HOLD_LIMIT
  );
}

// Check if setting focused work exceeds limit
export function exceedsFocusedWorkLimit(id, status, focusedWork) {
  return (
    focusedWork &&
    status !== "completed" &&
    !ownsFocusedOnHoldSlot(id) &&
    getFocusedOnHoldCount(id) >= FOCUSED_WORK_LIMIT
  );
}

// Show alert for on-hold limit
export function showOnHoldLimitAlert() {
  alert(ON_HOLD_LIMIT_MESSAGE);
}

// Show alert for focused work limit
export function showFocusedWorkLimitAlert() {
  alert(FOCUSED_WORK_LIMIT_MESSAGE);
}

// Utility to disable/enable elements
export function setDisabled(elements, disabled, title = "") {
  elements.forEach((el) => {
    el.disabled = disabled;
    if ("title" in el) {
      el.title = disabled ? title : "";
    }
  });
}
