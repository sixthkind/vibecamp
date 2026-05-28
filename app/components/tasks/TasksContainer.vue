<template>
  <div class="flex h-full min-h-screen flex-col bg-transparent">
    <div class="flex-1 overflow-hidden px-4 py-4">
      <div class="relative mb-4 flex items-center justify-center">
        <h1 class="text-2xl font-semibold text-gray-700">{{ toolName }}</h1>
        <div class="absolute right-0 flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            @click="createColumn"
          >
            <Icon name="lucide:plus" size="18px" />
            <span>New column</span>
          </button>
        </div>
      </div>

      <div v-if="isLoading"></div>

      <div v-else-if="activeColumns.length === 0 && archivedColumns.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <Icon name="lucide:columns-3" size="64px" class="mb-4 text-gray-300" />
        <h3 class="mb-2 text-xl font-semibold text-gray-900">No columns yet</h3>
        <p class="mb-6 text-gray-600">Add your first column to start the board.</p>
        <button
          type="button"
          class="text-gray-600 hover:text-gray-900"
          @click="createColumn"
        >
          New column
        </button>
      </div>

      <div v-else class="h-full overflow-x-auto pb-4">
        <div class="flex min-w-max items-start gap-4">
          <section
            v-for="(column, columnIndex) in activeColumns"
            :key="column.id"
            class="task-column flex max-h-[calc(100vh-12rem)] w-[280px] min-w-[280px] flex-col rounded-lg border p-3"
            :style="getColumnStyle(column)"
            @dragover.prevent
            @drop="handleColumnDrop(column)"
          >
            <div class="mb-3 flex items-center gap-2">
              <input
                v-model="column.name"
                type="text"
                class="min-w-0 flex-1 bg-transparent text-base font-semibold text-gray-800 focus:outline-none"
                @blur="saveColumn(column)"
                @keydown.enter.prevent="blurInput"
              />
              <div class="flex shrink-0 items-center gap-1 text-gray-500">
                <button
                  type="button"
                  class="rounded p-1 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Move column left"
                  :disabled="columnIndex === 0"
                  @click="moveColumn(columnIndex, -1)"
                >
                  <Icon name="lucide:arrow-left" size="15px" />
                </button>
                <button
                  type="button"
                  class="rounded p-1 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Move column right"
                  :disabled="columnIndex === activeColumns.length - 1"
                  @click="moveColumn(columnIndex, 1)"
                >
                  <Icon name="lucide:arrow-right" size="15px" />
                </button>
                <ColorPicker
                  :model-value="column.color"
                  title="Column color"
                  @update:model-value="updateColumnColor(column, $event)"
                />
                <button
                  type="button"
                  class="rounded p-1 text-gray-500 hover:bg-white/70 hover:text-red-600"
                  title="Archive column"
                  @click="archiveColumn(column)"
                >
                  <Icon name="lucide:archive" size="15px" />
                </button>
              </div>
            </div>

            <div class="min-h-10 flex-1 space-y-2 overflow-y-auto pr-1">
              <button
                v-for="task in getTasksForColumn(column.id)"
                :key="task.id"
                type="button"
                draggable="true"
                class="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700 shadow-sm hover:border-gray-300"
                @click="openTask(task)"
                @dragstart="handleDragStart(task, $event)"
                @dragend="handleDragEnd"
                @dragover.stop.prevent
                @drop.stop.prevent="handleCardDrop(column, task)"
              >
                <span class="block break-words font-medium">{{ task.title }}</span>
                <span v-if="task.description" class="mt-1 line-clamp-2 block break-words text-xs text-gray-500">
                  {{ task.description }}
                </span>
              </button>
            </div>

            <form
              v-if="newTaskColumnId === column.id"
              class="mt-3 flex items-center gap-2"
              @submit.prevent="createTask(column)"
            >
              <input
                v-model="newTaskTitles[column.id]"
                type="text"
                :ref="(el) => setNewTaskInputRef(column.id, el)"
                class="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
                placeholder="New task"
                @keydown.esc.prevent="cancelNewTask(column.id)"
              />
              <button
                type="submit"
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!newTaskTitles[column.id]?.trim()"
                title="Add task"
              >
                <Icon name="lucide:check" size="18px" />
              </button>
            </form>

            <div v-else class="mt-3 flex justify-end">
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-700 shadow-sm hover:bg-gray-100"
                title="New task"
                @click="startNewTask(column.id)"
              >
                <Icon name="lucide:plus" size="18px" />
              </button>
            </div>
          </section>
        </div>

        <div v-if="archivedColumns.length > 0" class="mt-6 flex min-w-full justify-center">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            @click="showArchivedColumns = !showArchivedColumns"
          >
            <Icon :name="showArchivedColumns ? 'lucide:chevron-down' : 'lucide:archive'" size="16px" />
            <span>Archived</span>
          </button>
        </div>

        <div
          v-if="showArchivedColumns && archivedColumns.length > 0"
          class="mx-auto mt-3 max-w-3xl rounded-lg border border-gray-200 bg-white/70 p-3"
        >
          <div
            v-for="column in archivedColumns"
            :key="column.id"
            class="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
          >
            <span class="min-w-0 truncate font-medium text-gray-700">{{ column.name }}</span>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
              @click="unarchiveColumn(column)"
            >
              <Icon name="lucide:archive-restore" size="14px" />
              <span>Unarchive</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <ion-modal
      css-class="paper-modal"
      :is-open="!!selectedTask"
      :initial-breakpoint="1"
      :breakpoints="[0, 1]"
      @didDismiss="closeTask"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Task</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeTask">
              <Icon name="lucide:x" size="24px" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div v-if="selectedTask" class="mx-auto max-w-3xl p-6">
          <div class="mb-5">
            <label class="mb-2 block text-sm font-medium text-gray-700">Title</label>
            <input
              v-model="taskTitle"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="mb-5">
            <label class="mb-2 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              v-model="taskDescription"
              rows="5"
              class="w-full resize-y rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div class="mb-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
              @click="archiveTask(selectedTask)"
            >
              Archive
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!taskTitle.trim() || isSavingTask"
              @click="saveTask"
            >
              Save
            </button>
          </div>

          <CommentsSection
            :project-id="projectId"
            target-collection="tasks"
            :target-id="selectedTask.id"
          />
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { alertController } from '@ionic/vue';
import { pb } from '~/utils/pb';

interface TaskColumn {
  id: string;
  project_tool: string;
  name: string;
  color: string;
  position?: number;
  archived: boolean;
  created_by: string;
  created: string;
  updated: string;
}

interface TaskRecord {
  id: string;
  project_tool: string;
  column: string;
  title: string;
  description?: string;
  position?: number;
  archived?: boolean;
  created_by: string;
  created: string;
  updated: string;
}

const props = defineProps<{
  projectToolId: string;
  projectId: string;
  toolName?: string;
}>();

const isLoading = ref(true);
const isSavingTask = ref(false);
const columns = ref<TaskColumn[]>([]);
const tasks = ref<TaskRecord[]>([]);
const newTaskTitles = ref<Record<string, string>>({});
const newTaskColumnId = ref<string | null>(null);
const showArchivedColumns = ref(false);
const selectedTask = ref<TaskRecord | null>(null);
const taskTitle = ref('');
const taskDescription = ref('');
const draggedTask = ref<TaskRecord | null>(null);
const newTaskInputRefs = new Map<string, HTMLInputElement>();

const currentUserId = computed(() => pb.authStore.record?.id);
const activeColumns = computed(() => {
  return [...columns.value]
    .filter((column) => !column.archived)
    .sort((a, b) => getPosition(a) - getPosition(b));
});
const archivedColumns = computed(() => {
  return [...columns.value]
    .filter((column) => column.archived)
    .sort((a, b) => getPosition(a) - getPosition(b));
});

onMounted(async () => {
  await Promise.all([fetchColumns(), fetchTasks()]);
  isLoading.value = false;
});

async function fetchColumns() {
  try {
    columns.value = await pb.collection('task_columns').getFullList<TaskColumn>({
      filter: `project_tool = "${props.projectToolId}"`,
      sort: 'position,created',
    });
  } catch (error) {
    console.error('Error fetching task columns:', error);
  }
}

async function fetchTasks() {
  try {
    tasks.value = await pb.collection('tasks').getFullList<TaskRecord>({
      filter: `project_tool = "${props.projectToolId}" && archived = false`,
      sort: 'position,created',
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

function getTasksForColumn(columnId: string) {
  return tasks.value
    .filter((task) => task.column === columnId && !task.archived)
    .sort((a, b) => getPosition(a) - getPosition(b));
}

async function createColumn() {
  const alert = await alertController.create({
    header: 'New Column',
    inputs: [
      {
        name: 'name',
        type: 'text',
        placeholder: 'Column name',
      },
    ],
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Create',
        handler: async (data) => {
          const name = String(data?.name || '').trim();
          if (!name || !currentUserId.value) return false;

          const maxPosition = activeColumns.value.length > 0
            ? Math.max(...activeColumns.value.map((column) => getPosition(column)))
            : 0;

          try {
            const column = await pb.collection('task_columns').create<TaskColumn>({
              project_tool: props.projectToolId,
              name,
              color: '#E5E7EB',
              position: maxPosition + 1,
              archived: false,
              created_by: currentUserId.value,
            });
            columns.value.push(column);
            return true;
          } catch (error) {
            console.error('Error creating task column:', error);
            return false;
          }
        },
      },
    ],
  });

  await alert.present();
}

async function saveColumn(column: TaskColumn) {
  const name = column.name.trim();
  if (!name) {
    await fetchColumns();
    return;
  }

  try {
    const updated = await pb.collection('task_columns').update<TaskColumn>(column.id, {
      name,
      color: column.color,
      position: getPosition(column),
    });
    replaceColumn(updated);
  } catch (error) {
    console.error('Error saving task column:', error);
    await fetchColumns();
  }
}

async function updateColumnColor(column: TaskColumn, color: string | undefined) {
  column.color = color ?? '#E5E7EB';
  await saveColumn(column);
}

async function moveColumn(index: number, direction: -1 | 1) {
  const orderedColumns = activeColumns.value;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= orderedColumns.length) return;

  const reordered = [...orderedColumns];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  columns.value = columns.value.map((column) => {
    const orderedIndex = reordered.findIndex((item) => item.id === column.id);
    return orderedIndex === -1 ? column : { ...column, position: orderedIndex + 1 };
  });

  try {
    await Promise.all(
      reordered.map((column, nextIndex) => (
        pb.collection('task_columns').update(column.id, { position: nextIndex + 1 })
      ))
    );
  } catch (error) {
    console.error('Error reordering task columns:', error);
    await fetchColumns();
  }
}

async function archiveColumn(column: TaskColumn) {
  const alert = await alertController.create({
    header: 'Archive Column',
    message: `Archive "${column.name}"? Tasks in this column will be hidden with it.`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Archive',
        role: 'destructive',
        handler: async () => {
          try {
            const updated = await pb.collection('task_columns').update<TaskColumn>(column.id, { archived: true });
            replaceColumn(updated);
          } catch (error) {
            console.error('Error archiving task column:', error);
          }
        },
      },
    ],
  });

  await alert.present();
}

async function unarchiveColumn(column: TaskColumn) {
  try {
    const maxPosition = activeColumns.value.length > 0
      ? Math.max(...activeColumns.value.map((activeColumn) => getPosition(activeColumn)))
      : 0;
    const updated = await pb.collection('task_columns').update<TaskColumn>(column.id, {
      archived: false,
      position: maxPosition + 1,
    });
    replaceColumn(updated);

    if (archivedColumns.value.length === 0) {
      showArchivedColumns.value = false;
    }
  } catch (error) {
    console.error('Error unarchiving task column:', error);
  }
}

function setNewTaskInputRef(columnId: string, element: Element | null) {
  if (element instanceof HTMLInputElement) {
    newTaskInputRefs.set(columnId, element);
  } else {
    newTaskInputRefs.delete(columnId);
  }
}

async function startNewTask(columnId: string) {
  newTaskColumnId.value = columnId;
  await nextTick();
  newTaskInputRefs.get(columnId)?.focus();
}

function cancelNewTask(columnId: string) {
  newTaskTitles.value[columnId] = '';
  if (newTaskColumnId.value === columnId) {
    newTaskColumnId.value = null;
  }
}

async function createTask(column: TaskColumn) {
  const title = newTaskTitles.value[column.id]?.trim();
  if (!title || !currentUserId.value) return;

  const columnTasks = getTasksForColumn(column.id);
  const maxPosition = columnTasks.length > 0
    ? Math.max(...columnTasks.map((task) => getPosition(task)))
    : 0;

  try {
    const task = await pb.collection('tasks').create<TaskRecord>({
      project_tool: props.projectToolId,
      column: column.id,
      title,
      description: '',
      position: maxPosition + 1,
      archived: false,
      created_by: currentUserId.value,
    });
    tasks.value.push(task);
    newTaskTitles.value[column.id] = '';
    newTaskColumnId.value = null;
  } catch (error) {
    console.error('Error creating task:', error);
  }
}

function openTask(task: TaskRecord) {
  selectedTask.value = task;
  taskTitle.value = task.title;
  taskDescription.value = task.description || '';
}

function closeTask() {
  selectedTask.value = null;
  taskTitle.value = '';
  taskDescription.value = '';
}

async function saveTask() {
  if (!selectedTask.value || !taskTitle.value.trim()) return;
  isSavingTask.value = true;

  try {
    const updated = await pb.collection('tasks').update<TaskRecord>(selectedTask.value.id, {
      title: taskTitle.value.trim(),
      description: taskDescription.value.trim(),
    });
    replaceTask(updated);
    selectedTask.value = updated;
  } catch (error) {
    console.error('Error saving task:', error);
  } finally {
    isSavingTask.value = false;
  }
}

async function archiveTask(task: TaskRecord) {
  try {
    const updated = await pb.collection('tasks').update<TaskRecord>(task.id, { archived: true });
    replaceTask(updated);
    closeTask();
  } catch (error) {
    console.error('Error archiving task:', error);
  }
}

function handleDragStart(task: TaskRecord, event: DragEvent) {
  draggedTask.value = task;
  event.dataTransfer?.setData('text/plain', task.id);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function handleDragEnd() {
  draggedTask.value = null;
}

async function handleColumnDrop(column: TaskColumn) {
  await moveTaskToColumn(column);
}

async function handleCardDrop(column: TaskColumn, beforeTask: TaskRecord) {
  await moveTaskToColumn(column, beforeTask);
}

async function moveTaskToColumn(column: TaskColumn, beforeTask?: TaskRecord) {
  const task = draggedTask.value;
  if (!task || task.id === beforeTask?.id) return;

  const fromColumn = task.column;
  const destinationTasks = getTasksForColumn(column.id).filter((item) => item.id !== task.id);
  const beforeIndex = beforeTask
    ? destinationTasks.findIndex((item) => item.id === beforeTask.id)
    : -1;
  const insertIndex = beforeIndex === -1 ? destinationTasks.length : beforeIndex;
  destinationTasks.splice(insertIndex, 0, { ...task, column: column.id });

  tasks.value = tasks.value.map((item) => {
    if (item.id === task.id) {
      return { ...item, column: column.id, position: insertIndex + 1 };
    }

    if (item.column === column.id) {
      const nextIndex = destinationTasks.findIndex((next) => next.id === item.id);
      return nextIndex === -1 ? item : { ...item, position: nextIndex + 1 };
    }

    return item;
  });

  try {
    await Promise.all(
      destinationTasks.map((item, index) => (
        pb.collection('tasks').update(item.id, {
          column: column.id,
          position: index + 1,
        })
      ))
    );

    if (fromColumn !== column.id) {
      await createSystemMoveComment(task.id, column.name);
    }
  } catch (error) {
    console.error('Error moving task:', error);
    await fetchTasks();
  } finally {
    draggedTask.value = null;
  }
}

async function createSystemMoveComment(taskId: string, columnName: string) {
  if (!currentUserId.value) return;

  await pb.collection('comments').create({
    project: props.projectId,
    target_collection: 'tasks',
    target_id: taskId,
    content: `Moved to "${columnName}".`,
    kind: 'system',
    created_by: currentUserId.value,
  });
}

function replaceColumn(column: TaskColumn) {
  const index = columns.value.findIndex((item) => item.id === column.id);
  if (index === -1) {
    columns.value.push(column);
  } else {
    columns.value[index] = column;
  }
}

function replaceTask(task: TaskRecord) {
  const index = tasks.value.findIndex((item) => item.id === task.id);
  if (index === -1) {
    tasks.value.push(task);
  } else {
    tasks.value[index] = task;
  }
}

function getPosition(item: { position?: number }) {
  return item.position || 0;
}

function blurInput(event: Event) {
  (event.target as HTMLInputElement).blur();
}

function getColumnStyle(column: TaskColumn) {
  return {
    backgroundColor: hexToRgba(column.color, 0.14),
    borderColor: hexToRgba(column.color, 0.55),
  };
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#E5E7EB';
  const value = normalized.slice(1);
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
</script>

<style scoped>
.task-column {
  min-height: 22rem;
}
</style>
