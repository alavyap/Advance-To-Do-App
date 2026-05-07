// modal.js - Modal and form management

import { editingId, setEditingId } from "./state.js";
import { getTask, updateTaskData, createTask } from "./taskManager.js";
import { getOnHoldCount } from "./limits.js";
import { ON_HOLD_LIMIT } from "./constants.js";
import { updateFocusedWorkAvailability } from "./focusedMode.js";
import { focusedModeActive } from "./state.js";
import { showFocusedWorkLimitAlert, showOnHoldLimitAlert } from "./limits.js";

// Open modal for adding/editing task
export function openAddTaskModal() {
  if (focusedModeActive) return;

  if (getOnHoldCount() >= ON_HOLD_LIMIT) {
    showOnHoldLimitAlert();
    return;
  }

  openModal();
}

// Open modal
export function openModal() {
  const modal = document.getElementById("taskModal");
  if (!modal) return;

  modal.classList.add("active");
  updateFocusedWorkAvailability(editingId);
}

// Close modal
export function closeModal() {
  const modal = document.getElementById("taskModal");
  const form = document.getElementById("taskForm");

  if (!modal || !form) return;

  modal.classList.remove("active");
  form.reset();
  setEditingId(null);
}

// Initialize modal event listeners
export function initializeModalListeners() {
  const form = document.getElementById("taskForm");
  const taskStatus = document.getElementById("taskStatus");
  const focusedWorkToggle = document.querySelector(".focused-work-toggle");

  if (!form) return;

  // Form submission
  form.addEventListener("submit", handleFormSubmit);

  // Status change - update focused work availability
  if (taskStatus) {
    taskStatus.addEventListener("change", () => {
      updateFocusedWorkAvailability(editingId);
    });
  }

  // Focused work toggle click
  if (focusedWorkToggle) {
    focusedWorkToggle.addEventListener("click", () => {
      const focusedWorkInput = document.getElementById("focusedWork");
      if (focusedWorkInput?.disabled) {
        showFocusedWorkLimitAlert();
      }
    });
  }
}

// Handle form submission
function handleFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("taskTitle")?.value;
  const status = document.getElementById("taskStatus")?.value;
  const priority = document.getElementById("taskPriority")?.value;
  const focusedWork = document.getElementById("focusedWork")?.checked;

  if (!title || !status || !priority) return;

  let success = false;

  if (editingId) {
    // Update existing task
    success = updateTaskData(editingId, {
      title,
      status,
      priority,
      focusedWork,
    });
  } else {
    // Create new task
    success = createTask(title, status, priority, focusedWork);
  }

  if (success) {
    closeModal();
  }
}

// Edit task - open modal with pre-filled data
export function editTaskModal(id) {
  if (focusedModeActive) return;

  const task = getTask(id);
  if (!task) return;

  setEditingId(id);

  const titleInput = document.getElementById("taskTitle");
  const statusInput = document.getElementById("taskStatus");
  const priorityInput = document.getElementById("taskPriority");
  const focusedWorkInput = document.getElementById("focusedWork");

  if (titleInput) titleInput.value = task.title;
  if (statusInput) statusInput.value = task.status;
  if (priorityInput) priorityInput.value = task.priority;
  if (focusedWorkInput) focusedWorkInput.checked = Boolean(task.focusedWork);

  openModal();
}
