const STORAGE_KEY = "todoTasks";
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

function loadData() {
  const saved =
    localStorage.getItem(STORAGE_KEY) ||
    localStorage.getItem("codynnflowTasks");
  if (saved) tasks = JSON.parse(saved);
  else
    tasks = [
      {
        id: 1,
        title: "Evaluate the addition and deletion of user IDs",
        status: "pending",
        priority: "minor",
        completed: false,
        focusedWork: false,
      },
      {
        id: 2,
        title: "Identify the implementation team",
        status: "progress",
        priority: "normal",
        completed: false,
        focusedWork: false,
      },
      {
        id: 3,
        title: "Batch schedule download/process",
        status: "pending",
        priority: "critical",
        completed: false,
        focusedWork: false,
      },
      {
        id: 4,
        title: "Monitor system performance and adjust hardware",
        status: "pending",
        priority: "minor",
        completed: false,
        focusedWork: false,
      },
    ];
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

function ownsFocusedOnHoldSlot(id) {
  const task = tasks.find((task) => task.id === id);
  return Boolean(task && !task.completed && task.focusedWork);
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

function updateFocusedModeControls() {
  const focusModeBtn = document.getElementById("focusModeBtn");
  const addTaskBtn = document.getElementById("addTaskBtn");

  focusModeBtn.classList.toggle("active", focusedModeActive);
  focusModeBtn.setAttribute("aria-pressed", focusedModeActive);
  focusModeBtn.title = focusedModeActive
    ? "Showing focused on-hold tasks"
    : "Show focused on-hold tasks";

  // Disable the add new task, edit,delete button and the draggable elements when focused mode is active to prevent editing non-focused tasks
  addTaskBtn.disabled = focusedModeActive;
  addTaskBtn.title = focusedModeActive
    ? "Turn off focused mode to add a task."
    : "";

  document.querySelectorAll(".task-item .icon-btn").forEach((btn) => {
    btn.disabled = focusedModeActive;
  });
  document.querySelectorAll(".task-item .draggable").forEach((drag) => {
    drag.style.pointerEvents = focusedModeActive ? "none" : "auto";
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
    : `<p style="color:#9ca3af;padding:20px;">${
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
    : '<p style="color:#9ca3af;padding:20px;">No completed tasks</p>';

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
  document.getElementById("completionRateValue").textContent = rate + "%";
  document.getElementById("totalProgress").style.width = rate + "%";
  document.getElementById("completionProgress").style.width = rate + "%";

  saveData();
  updateFocusedModeControls();
}

function toggleTask(id) {
  const t = tasks.find((t) => t.id === id);
  if (t) {
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
  if (confirm("Are you sure you want to delete this task?")) {
    tasks = tasks.filter((t) => t.id !== id);
    renderTasks();
  }
}

function openAddTaskModal() {
  if (focusedModeActive) return;

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
  renderTasks();
});

loadData();
