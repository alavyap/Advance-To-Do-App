// ui.js - UI rendering and DOM management

import { tasks, focusedModeActive } from "./state.js";
import { updateFocusedModeControls } from "./focusedMode.js";
import { saveData } from "./storage.js";

const STATUS_LABELS = {
  pending: "Pending",
  progress: "In Progress",
  completed: "Completed",
};

const PRIORITY_LABELS = {
  minor: "Minor",
  normal: "Normal",
  critical: "Critical",
};

// Get visible tasks based on focused mode
export function getVisibleOnHoldTasks() {
  const onHold = tasks.filter((task) => !task.completed);
  return focusedModeActive ? onHold.filter((task) => task.focusedWork) : onHold;
}

// Render avatar with fire icon for focused tasks
export function renderAvatar(task) {
  return `<div class="avatar">${
    task.focusedWork ? '<i class="fa-solid fa-fire"></i>' : ""
  }</div>`;
}

// Render all tasks in the UI
export function renderTasks() {
  const visibleOnHold = getVisibleOnHoldTasks();
  const completed = tasks.filter((t) => t.completed);

  // Render on-hold tasks
  renderOnHoldTasks(visibleOnHold);

  // Render completed tasks
  renderCompletedTasks(completed);

  // Update statistics
  updateStatistics(visibleOnHold, completed);

  // Save and update controls
  saveData(tasks);
  updateFocusedModeControls();
}

function renderOnHoldTasks(tasks) {
  const container = document.getElementById("onHoldTasks");
  if (!container) return;

  replaceChildren(
    container,
    tasks.length
      ? tasks.map((task) => createTaskItem(task, { completedList: false }))
      : [
          createEmptyState(
            focusedModeActive ? "No focused tasks on hold" : "No tasks on hold",
          ),
        ],
  );
}

function renderCompletedTasks(tasks) {
  const container = document.getElementById("completedTasks");
  if (!container) return;

  replaceChildren(
    container,
    tasks.length
      ? tasks.map((task) => createTaskItem(task, { completedList: true }))
      : [createEmptyState("No completed tasks")],
  );
}

function createTaskItem(task, { completedList }) {
  const item = document.createElement("div");
  item.className = "task-item";
  item.dataset.taskId = String(task.id);

  if (!completedList) {
    const dragHandle = document.createElement("div");
    dragHandle.className = "draggable";
    dragHandle.title = "Drag to reorder";
    dragHandle.addEventListener("pointerdown", (event) => {
      window.handlePointerDragStart?.(event, task.id);
    });
    dragHandle.append(createIcon("fas", "fa-grip-lines"));
    item.append(dragHandle);
  }

  const checkbox = document.createElement("div");
  checkbox.className = completedList ? "task-checkbox completed" : "task-checkbox";
  checkbox.addEventListener("click", () => {
    window.toggleTask?.(task.id);
  });
  item.append(checkbox);

  const content = document.createElement("div");
  content.className = "task-content";

  const title = document.createElement("div");
  title.className = completedList ? "task-title completed" : "task-title";
  title.textContent = String(task.title ?? "");
  content.append(title);
  item.append(content);

  item.append(createStatusBadge(task, completedList));
  item.append(createPriorityBadge(task));
  item.append(createAvatar(task));
  item.append(createIconButton("fas fa-pencil", () => window.editTask?.(task.id)));
  item.append(
    createIconButton("fa-solid fa-trash-can", () => window.deleteTask?.(task.id)),
  );

  return item;
}

function createStatusBadge(task, completedList) {
  const status = completedList ? "completed" : normalizeStatus(task.status);
  const badge = document.createElement("span");
  badge.className = `status-badge status-${status}`;
  badge.textContent = STATUS_LABELS[status];
  return badge;
}

function createPriorityBadge(task) {
  const priority = normalizePriority(task.priority);
  const badge = document.createElement("div");
  badge.className = `priority-badge priority-${priority}`;
  badge.append(createIcon("fas", "fa-circle"), ` ${PRIORITY_LABELS[priority]}`);
  return badge;
}

function createAvatar(task) {
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  if (task.focusedWork) {
    avatar.append(createIcon("fa-solid", "fa-fire"));
  }
  return avatar;
}

function createIconButton(iconClasses, onClick) {
  const button = document.createElement("button");
  button.className = "icon-btn";
  button.style.width = "30px";
  button.style.height = "30px";
  button.addEventListener("click", onClick);

  const icon = createIcon(...iconClasses.split(" "));
  icon.style.fontSize = "12px";
  button.append(icon);
  return button;
}

function createIcon(...classes) {
  const icon = document.createElement("i");
  icon.classList.add(...classes);
  return icon;
}

function createEmptyState(message) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

function replaceChildren(container, children) {
  container.replaceChildren(...children);
}

function normalizeStatus(status) {
  return Object.hasOwn(STATUS_LABELS, status) ? status : "pending";
}

function normalizePriority(priority) {
  return Object.hasOwn(PRIORITY_LABELS, priority) ? priority : "normal";
}

function updateStatistics(visibleOnHold, completed) {
  const total = tasks.length;
  const completedCount = completed.length;
  const pending = total - completedCount;
  const visiblePending = focusedModeActive ? visibleOnHold.length : pending;
  const rate = total ? Math.round((completedCount / total) * 100) : 0;

  // Update counts
  const updates = {
    taskCount: visiblePending,
    totalCount: total,
    totalTasks: total,
    completedCount: completedCount,
    pendingCount: pending,
    completedSummaryCount: completedCount,
    pendingSummaryCount: pending,
    completionRateValue: rate + "%",
  };

  Object.entries(updates).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  // Update circular progress indicators
  document
    .getElementById("completionProgress")
    ?.style.setProperty("--progress", `${rate * 3.6}deg`);
  document
    .getElementById("completedProgress")
    ?.style.setProperty(
      "--progress",
      `${total ? (completedCount / total) * 360 : 0}deg`,
    );
  document
    .getElementById("pendingProgress")
    ?.style.setProperty(
      "--progress",
      `${total ? (pending / total) * 360 : 0}deg`,
    );
}
