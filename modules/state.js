// state.js - Global state management

export let tasks = [];
export let editingId = null;
export let focusedModeActive = false;
export let draggedTaskId = null;
export let dragTargetTaskId = null;

// Helper functions to update state
export function setEditingId(id) {
  editingId = id;
}

export function setFocusedModeActive(active) {
  focusedModeActive = active;
}

export function setDraggedTaskId(id) {
  draggedTaskId = id;
}

export function setDragTargetTaskId(id) {
  dragTargetTaskId = id;
}

export function addTask(task) {
  tasks.push(task);
}

export function updateTask(id, updates) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    Object.assign(task, updates);
  }
}

export function removeTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
}

export function setTasks(newTasks) {
  tasks = newTasks;
}

export function getTaskById(id) {
  return tasks.find((t) => t.id === id);
}
