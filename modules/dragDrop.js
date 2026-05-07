// dragDrop.js - Drag and drop functionality

import {
  draggedTaskId,
  dragTargetTaskId,
  setTasks,
  setDraggedTaskId,
  setDragTargetTaskId,
} from "./state.js";
import { getVisibleOnHoldTasks } from "./ui.js";
import { renderTasks } from "./ui.js";
import { tasks } from "./state.js";

// Get element at a specific point
export function getTaskItemFromPoint(clientX, clientY) {
  return document
    .elementFromPoint(clientX, clientY)
    ?.closest("#onHoldTasks .task-item");
}

// Update drag target styling
export function updateDragTarget(taskItem) {
  document
    .querySelectorAll("#onHoldTasks .task-item.drag-over")
    .forEach((item) => item.classList.remove("drag-over"));

  if (!taskItem) {
    setDragTargetTaskId(null);
    return;
  }

  const targetId = Number(taskItem.dataset.taskId);
  setDragTargetTaskId(targetId);

  if (targetId !== draggedTaskId) {
    taskItem.classList.add("drag-over");
  }
}

// Clear drag styling
export function clearDragStyles() {
  document
    .querySelectorAll(".task-item.dragging, .task-item.drag-over")
    .forEach((taskItem) => {
      taskItem.classList.remove("dragging", "drag-over");
    });
}

// Reorder tasks in the array
export function reorderVisibleOnHoldTasks(draggedId, targetId) {
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

  setTasks(
    tasks.map((task) =>
      visibleOnHoldIds.has(task.id)
        ? reorderedOnHold[nextVisibleIndex++]
        : task,
    ),
  );

  renderTasks();
}

// Handle drag start
export function handlePointerDragStart(event, id) {
  if (event.button !== undefined && event.button !== 0) return;

  event.preventDefault();
  setDraggedTaskId(id);
  setDragTargetTaskId(null);
  event.currentTarget.closest(".task-item").classList.add("dragging");
  document.body.classList.add("task-dragging");

  document.addEventListener("pointermove", handlePointerDragMove);
  document.addEventListener("pointerup", handlePointerDragEnd);
  document.addEventListener("pointercancel", handlePointerDragCancel);
}

// Handle drag move
export function handlePointerDragMove(event) {
  if (!draggedTaskId) return;

  event.preventDefault();
  updateDragTarget(getTaskItemFromPoint(event.clientX, event.clientY));
}

// Handle drag end
export function handlePointerDragEnd(event) {
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

  setDraggedTaskId(null);
  setDragTargetTaskId(null);

  reorderVisibleOnHoldTasks(droppedTaskId, droppedOnTaskId);
}

// Handle drag cancel
export function handlePointerDragCancel() {
  document.removeEventListener("pointermove", handlePointerDragMove);
  document.removeEventListener("pointerup", handlePointerDragEnd);
  document.removeEventListener("pointercancel", handlePointerDragCancel);
  document.body.classList.remove("task-dragging");
  clearDragStyles();

  setDraggedTaskId(null);
  setDragTargetTaskId(null);
}
