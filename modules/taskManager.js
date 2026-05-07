// taskManager.js - Task CRUD operations

import {
  getTaskById,
  addTask as stateAddTask,
  removeTask as stateRemoveTask,
  updateTask as stateUpdateTask,
} from "./state.js";
import { tasks } from "./state.js";
import { renderTasks } from "./ui.js";
import { FOCUSED_WORK_LIMIT } from "./constants.js";
import {
  exceedsOnHoldLimit,
  exceedsFocusedWorkLimit,
  getFocusedOnHoldCount,
  showOnHoldLimitAlert,
  showFocusedWorkLimitAlert,
} from "./limits.js";

// Create new task
export function createTask(title, status, priority, focusedWork) {
  const newTask = {
    id: Date.now(),
    title,
    status,
    priority,
    completed: status === "completed",
    focusedWork,
  };

  // Validate limits
  if (exceedsOnHoldLimit(null, status)) {
    showOnHoldLimitAlert();
    return false;
  }

  if (exceedsFocusedWorkLimit(null, status, focusedWork)) {
    showFocusedWorkLimitAlert();
    return false;
  }

  stateAddTask(newTask);
  renderTasks();
  return true;
}

// Get all tasks
export function getAllTasks() {
  return tasks;
}

// Get task by ID
export function getTask(id) {
  return getTaskById(id);
}

// Update task
export function updateTaskData(id, updates) {
  const task = getTaskById(id);
  if (!task) return false;

  // Validate limits if status is changing to non-completed
  if (updates.status && updates.status !== "completed") {
    if (exceedsOnHoldLimit(id, updates.status)) {
      showOnHoldLimitAlert();
      return false;
    }
  }

  // Validate focused work limit
  if (updates.focusedWork !== undefined) {
    if (
      exceedsFocusedWorkLimit(
        id,
        updates.status || task.status,
        updates.focusedWork,
      )
    ) {
      showFocusedWorkLimitAlert();
      return false;
    }
  }

  stateUpdateTask(id, {
    ...updates,
    completed: updates.status === "completed",
  });
  renderTasks();
  return true;
}

// Toggle task completion
export function toggleTaskCompletion(id) {
  const task = getTaskById(id);
  if (!task) return false;

  const newCompleted = !task.completed;
  const newStatus = newCompleted ? "completed" : "pending";

  // Validate if unmarking as complete
  if (newCompleted === false) {
    if (exceedsOnHoldLimit(id, newStatus)) {
      showOnHoldLimitAlert();
      return false;
    }

    if (task.focusedWork && !exceedsOnHoldLimit(id, newStatus)) {
      if (getFocusedOnHoldCount(id) >= FOCUSED_WORK_LIMIT) {
        showFocusedWorkLimitAlert();
        return false;
      }
    }
  }

  stateUpdateTask(id, {
    completed: newCompleted,
    status: newStatus,
  });
  renderTasks();
  return true;
}

// Delete task
export function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return false;
  }

  stateRemoveTask(id);
  renderTasks();
  return true;
}
