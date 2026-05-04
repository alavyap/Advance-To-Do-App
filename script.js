const STORAGE_KEY = "todoTasks";
const THEME_STORAGE_KEY = "todoTheme";
const FOCUSED_MODE_STORAGE_KEY = "focusedModeActive";
const FOCUSED_WORK_LIMIT = 3;
const FOCUSED_WORK_LIMIT_MESSAGE =
  "You have 3 focused tasks on hold. Complete at least one to add a new focused task.";

const ON_HOLD_LIMIT = 10;
const ON_HOLD_LIMIT_MESSAGE =
  "You can only have 10 tasks on hold. Please complete or delete some tasks to add new ones.";

let tasks = [],
  editingId = null,
  focusedModeActive = false,
  draggedTaskId = null,
  dragTargetTaskId = null;

function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  const themeToggleBtn = document.getElementById("themeToggleBtn");

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

function setTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

function toggleTheme() {
  setTheme(document.body.classList.contains("dark-theme") ? "light" : "dark");
}

function loadFocusedMode() {
  focusedModeActive = localStorage.getItem(FOCUSED_MODE_STORAGE_KEY) === "true";
}

function saveFocusedMode() {
  localStorage.setItem(FOCUSED_MODE_STORAGE_KEY, focusedModeActive);
}

function loadData() {
  const saved =
    localStorage.getItem(STORAGE_KEY) || localStorage.getItem("todoData");
  if (saved)
    try {
      tasks = JSON.parse(saved) || [];
    } catch {
      tasks = [];
    }
  else tasks = [];
  updateGreeting();
  renderTasks();
}

function updateGreeting() {
  const hour = new Date().getHours();
  let greet = "Good Morning";
  if (hour >= 12 && hour < 18) greet = "Good Afternoon";
  else if (hour >= 18) greet = "Good Evening";
  document.getElementById("greeting").textContent = `${greet} !!`;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getFocusedOnHoldCount(excludedId = null) {
  return tasks.filter(
    (task) => task.id !== excludedId && !task.completed && task.focusedWork,
  ).length;
}

function getOnHoldCount(excludedId = null) {
  return tasks.filter((task) => task.id !== excludedId && !task.completed)
    .length;
}

function ownsOnHoldSlot(id) {
  const task = tasks.find((task) => task.id === id);
  return Boolean(task && !task.completed);
}

function ownsFocusedOnHoldSlot(id) {
  const task = tasks.find((task) => task.id === id);
  return Boolean(task && !task.completed && task.focusedWork);
}

function exceedsOnHoldLimit(id, status) {
  return (
    status !== "completed" &&
    !ownsOnHoldSlot(id) &&
    getOnHoldCount(id) >= ON_HOLD_LIMIT
  );
}

function exceedsFocusedWorkLimit(id, status, focusedWork) {
  return (
    focusedWork &&
    status !== "completed" &&
    !ownsFocusedOnHoldSlot(id) &&
    getFocusedOnHoldCount(id) >= FOCUSED_WORK_LIMIT
  );
}

function showFocusedWorkLimitAlert() {
  alert(FOCUSED_WORK_LIMIT_MESSAGE);
}

function showOnHoldLimitAlert() {
  alert(ON_HOLD_LIMIT_MESSAGE);
}

function setDisabled(elements, disabled, title = "") {
  elements.forEach((el) => {
    el.disabled = disabled;

    if ("title" in el) {
      el.title = disabled ? title : "";
    }
  });
}

function updateFocusedModeControls() {
  const isFocused = focusedModeActive;
  const onHoldLimitReached = getOnHoldCount() >= ON_HOLD_LIMIT;

  const focusModeBtn = document.getElementById("focusModeBtn");
  const addTaskBtn = document.getElementById("addTaskBtn");

  // Focus mode button
  focusModeBtn.classList.toggle("active", isFocused);
  focusModeBtn.setAttribute("aria-pressed", isFocused);
  focusModeBtn.title = isFocused
    ? "Showing focused on-hold tasks"
    : "Show focused on-hold tasks";

  // Disable buttons
  setDisabled(
    [...document.querySelectorAll(".task-item .icon-btn")],
    isFocused,
    "Turn off focused mode to edit tasks.",
  );
  setDisabled(
    [addTaskBtn],
    isFocused || onHoldLimitReached,
    isFocused ? "Turn off focused mode to edit tasks." : ON_HOLD_LIMIT_MESSAGE,
  );

  // Disable dragging
  document.querySelectorAll(".task-item .draggable").forEach((el) => {
    el.style.pointerEvents = isFocused ? "none" : "";
  });
}

function updateFocusedWorkAvailability() {
  const focusedWorkInput = document.getElementById("focusedWork");
  const focusedWorkToggle = document.querySelector(".focused-work-toggle");
  const status = document.getElementById("taskStatus").value;
  const limitReached =
    status !== "completed" &&
    !ownsFocusedOnHoldSlot(editingId) &&
    getFocusedOnHoldCount(editingId) >= FOCUSED_WORK_LIMIT;

  focusedWorkInput.disabled = limitReached;
  focusedWorkToggle.classList.toggle("disabled", limitReached);
  focusedWorkToggle.title = limitReached ? FOCUSED_WORK_LIMIT_MESSAGE : "";

  if (limitReached) focusedWorkInput.checked = false;
}

function renderAvatar(task) {
  return `<div class="avatar">${task.focusedWork ? '<i class="fa-solid fa-fire"></i>' : ""}</div>`;
}

function getVisibleOnHoldTasks() {
  const onHold = tasks.filter((task) => !task.completed);

  return focusedModeActive ? onHold.filter((task) => task.focusedWork) : onHold;
}

function reorderVisibleOnHoldTasks(draggedId, targetId) {
  if (!draggedId || !targetId || draggedId === targetId) return;

  const visibleOnHold = getVisibleOnHoldTasks();
  const fromIndex = visibleOnHold.findIndex((task) => task.id === draggedId);
  const toIndex = visibleOnHold.findIndex((task) => task.id === targetId);

  if (fromIndex === -1 || toIndex === -1) return;

  const reorderedOnHold = [...visibleOnHold];
  const [movedTask] = reorderedOnHold.splice(fromIndex, 1);
  reorderedOnHold.splice(toIndex, 0, movedTask);

  const visibleOnHoldIds = new Set(visibleOnHold.map((task) => task.id));
  let nextVisibleIndex = 0;
  tasks = tasks.map((task) =>
    visibleOnHoldIds.has(task.id) ? reorderedOnHold[nextVisibleIndex++] : task,
  );

  renderTasks();
}

function clearDragStyles() {
  document
    .querySelectorAll(".task-item.dragging, .task-item.drag-over")
    .forEach((taskItem) => {
      taskItem.classList.remove("dragging", "drag-over");
    });
}

function getTaskItemFromPoint(clientX, clientY) {
  return document
    .elementFromPoint(clientX, clientY)
    ?.closest("#onHoldTasks .task-item");
}

function updateDragTarget(taskItem) {
  document
    .querySelectorAll("#onHoldTasks .task-item.drag-over")
    .forEach((item) => item.classList.remove("drag-over"));

  if (!taskItem) {
    dragTargetTaskId = null;
    return;
  }

  const targetId = Number(taskItem.dataset.taskId);
  dragTargetTaskId = targetId;

  if (targetId !== draggedTaskId) {
    taskItem.classList.add("drag-over");
  }
}

function handlePointerDragStart(event, id) {
  if (event.button !== undefined && event.button !== 0) return;

  event.preventDefault();
  draggedTaskId = id;
  dragTargetTaskId = null;
  event.currentTarget.closest(".task-item").classList.add("dragging");
  document.body.classList.add("task-dragging");

  document.addEventListener("pointermove", handlePointerDragMove);
  document.addEventListener("pointerup", handlePointerDragEnd);
  document.addEventListener("pointercancel", handlePointerDragCancel);
}

function handlePointerDragMove(event) {
  if (!draggedTaskId) return;

  event.preventDefault();
  updateDragTarget(getTaskItemFromPoint(event.clientX, event.clientY));
}

function handlePointerDragEnd(event) {
  event.preventDefault();
  const droppedTaskId = draggedTaskId;
  const droppedOnTaskId =
    dragTargetTaskId ||
    Number(getTaskItemFromPoint(event.clientX, event.clientY)?.dataset.taskId);

  document.removeEventListener("pointermove", handlePointerDragMove);
  document.removeEventListener("pointerup", handlePointerDragEnd);
  document.removeEventListener("pointercancel", handlePointerDragCancel);
  document.body.classList.remove("task-dragging");
  clearDragStyles();
  draggedTaskId = null;
  dragTargetTaskId = null;

  reorderVisibleOnHoldTasks(droppedTaskId, droppedOnTaskId);
}

function handlePointerDragCancel() {
  document.removeEventListener("pointermove", handlePointerDragMove);
  document.removeEventListener("pointerup", handlePointerDragEnd);
  document.removeEventListener("pointercancel", handlePointerDragCancel);
  document.body.classList.remove("task-dragging");
  clearDragStyles();
  draggedTaskId = null;
  dragTargetTaskId = null;
}

function renderTasks() {
  const visibleOnHold = getVisibleOnHoldTasks();
  const completed = tasks.filter((t) => t.completed);

  // Render On Hold Tasks
  document.getElementById("onHoldTasks").innerHTML = visibleOnHold.length
    ? visibleOnHold
        .map(
          (t) => `
            <div class="task-item" data-task-id="${t.id}">
                <div class="draggable" onpointerdown="handlePointerDragStart(event, ${t.id})" title="Drag to reorder">
                    <i class="fas fa-grip-lines"></i>
                </div>
                <div class="task-checkbox ${t.completed ? "completed" : ""}" onclick="toggleTask(${t.id})"></div>
                <div class="task-content">
                    <div class="task-title ${t.completed ? "completed" : ""}">${t.title}</div>
                </div>
                <span class="status-badge status-${t.status}">
                    ${t.status === "progress" ? "In Progress" : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                </span>
                <div class="priority-badge priority-${t.priority}">
                    <i class="fas fa-circle"></i> ${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                </div>
                ${renderAvatar(t)}
                <button class="icon-btn" style="width:30px;height:30px;" onclick="editTask(${t.id})">
                    <i class="fas fa-pencil" style="font-size:12px;"></i>
                </button>
                <button class="icon-btn" style="width:30px;height:30px;" onclick="deleteTask(${t.id})">
                  
                    <i class="fa-solid fa-trash-can" style="font-size:12px;"></i>
                </button>
            </div>
        `,
        )
        .join("")
    : `<p class="empty-state">${
        focusedModeActive ? "No focused tasks on hold" : "No tasks on hold"
      }</p>`;

  // Render Completed Tasks
  document.getElementById("completedTasks").innerHTML = completed.length
    ? completed
        .map(
          (t) => `
            <div class="task-item">
                <div class="task-checkbox completed" onclick="toggleTask(${t.id})"></div>
                <div class="task-content">
                    <div class="task-title completed">${t.title}</div>
                </div>
                <span class="status-badge status-completed">Completed</span>
                <div class="priority-badge priority-${t.priority}">
                    <i class="fas fa-circle"></i> ${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                </div>
                ${renderAvatar(t)}
                <button class="icon-btn" style="width:30px;height:30px;" onclick="editTask(${t.id})">
                    <i class="fas fa-pencil" style="font-size:12px;"></i>
                </button>
                <button class="icon-btn" style="width:30px;height:30px;" onclick="deleteTask(${t.id})">
                   <i class="fa-solid fa-trash-can" style="font-size:12px;"></i>
                </button>
            </div>
        `,
        )
        .join("")
    : '<p class="empty-state">No completed tasks</p>';

  // Update Sidebar Stats
  const total = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pending = total - completedCount;
  const visiblePending = focusedModeActive ? visibleOnHold.length : pending;
  const rate = total ? Math.round((completedCount / total) * 100) : 0;

  document.getElementById("taskCount").textContent = visiblePending;
  document.getElementById("totalCount").textContent = total;
  document.getElementById("totalTasks").textContent = total;
  document.getElementById("completedCount").textContent = completedCount;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("completedSummaryCount").textContent = completedCount;
  document.getElementById("pendingSummaryCount").textContent = pending;
  document.getElementById("completionRateValue").textContent = rate + "%";
  document
    .getElementById("completionProgress")
    .style.setProperty("--progress", `${rate * 3.6}deg`);
  document
    .getElementById("completedProgress")
    .style.setProperty(
      "--progress",
      `${total ? (completedCount / total) * 360 : 0}deg`,
    );
  document
    .getElementById("pendingProgress")
    .style.setProperty(
      "--progress",
      `${total ? (pending / total) * 360 : 0}deg`,
    );

  saveData();
  updateFocusedModeControls();
}

function toggleTask(id) {
  const t = tasks.find((t) => t.id === id);
  if (t) {
    if (t.completed && exceedsOnHoldLimit(t.id, "pending")) {
      showOnHoldLimitAlert();
      return;
    }

    if (
      t.completed &&
      t.focusedWork &&
      getFocusedOnHoldCount(t.id) >= FOCUSED_WORK_LIMIT
    ) {
      showFocusedWorkLimitAlert();
      return;
    }

    t.completed = !t.completed;
    t.status = t.completed ? "completed" : "pending";
    renderTasks();
  }
}

function deleteTask(id) {
  if (focusedModeActive) return;
  if (confirm("Are you sure you want to delete this task?")) {
    tasks = tasks.filter((t) => t.id !== id);
    renderTasks();
  }
}

function openAddTaskModal() {
  if (focusedModeActive) return;

  if (getOnHoldCount() >= ON_HOLD_LIMIT) {
    showOnHoldLimitAlert();
    return;
  }

  openModal();
}

function openModal() {
  document.getElementById("taskModal").classList.add("active");
  updateFocusedWorkAvailability();
}
function closeModal() {
  document.getElementById("taskModal").classList.remove("active");
  document.getElementById("taskForm").reset();
  editingId = null;
}

document.getElementById("taskForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("taskTitle").value;
  const status = document.getElementById("taskStatus").value;
  const priority = document.getElementById("taskPriority").value;
  const focusedWork = document.getElementById("focusedWork").checked;

  if (exceedsOnHoldLimit(editingId, status)) {
    showOnHoldLimitAlert();
    return;
  }

  if (exceedsFocusedWorkLimit(editingId, status, focusedWork)) {
    showFocusedWorkLimitAlert();
    updateFocusedWorkAvailability();
    return;
  }

  if (editingId) {
    const t = tasks.find((t) => t.id === editingId);
    t.title = title;
    t.status = status;
    t.priority = priority;
    t.completed = status === "completed";
    t.focusedWork = focusedWork;
  } else {
    tasks.push({
      id: Date.now(),
      title,
      status,
      priority,
      completed: status === "completed",
      focusedWork,
    });
  }
  renderTasks();
  closeModal();
});

function editTask(id) {
  editingId = id;
  const t = tasks.find((t) => t.id === id);
  if (focusedModeActive) return;
  if (t) {
    document.getElementById("taskTitle").value = t.title;
    document.getElementById("taskStatus").value = t.status;
    document.getElementById("taskPriority").value = t.priority;
    document.getElementById("focusedWork").checked = Boolean(t.focusedWork);
    openModal();
  }
}

document
  .getElementById("taskStatus")
  .addEventListener("change", updateFocusedWorkAvailability);

document.querySelector(".focused-work-toggle").addEventListener("click", () => {
  const focusedWorkInput = document.getElementById("focusedWork");

  if (focusedWorkInput.disabled) {
    showFocusedWorkLimitAlert();
  }
});

document.getElementById("focusModeBtn").addEventListener("click", () => {
  focusedModeActive = !focusedModeActive;
  saveFocusedMode();
  renderTasks();
});

document
  .getElementById("themeToggleBtn")
  .addEventListener("click", toggleTheme);

applyTheme(getPreferredTheme());
loadFocusedMode();
loadData();
