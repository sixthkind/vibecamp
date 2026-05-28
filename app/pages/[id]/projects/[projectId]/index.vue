<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { canUserPerformOnProject } from '~/utils/permissions';
import { getActiveProjectTools, getToolIcon, getToolDescription } from '~/utils/tools';


definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const project = ref<any>(null);
const outpost = ref<any>(null);
const canManageSettings = ref(false);
const canManageMembers = ref(false);
const loading = ref(true);
const error = ref('');
const activeTools = ref<any[]>([]);
const chatPreviews = ref<Record<string, ChatMessage[]>>({});
const todoPreviews = ref<Record<string, TodoPreviewItem[]>>({});
const docsPreviews = ref<Record<string, DocsPreviewItem[]>>({});
const calendarPreviews = ref<Record<string, CalendarPreviewDay[]>>({});
const boardPreviews = ref<Record<string, BoardPreviewPost[]>>({});
const taskPreviews = ref<Record<string, TaskPreviewColumn[]>>({});
const previewReady = ref<Record<string, boolean>>({});

interface ChatMessage {
  id: string;
  project_tool: string;
  user: string;
  content: string;
  files?: string[];
  created: string;
  expand?: {
    user?: any;
  };
}

interface TodoPreviewItem {
  id: string;
  content: string;
  completed: boolean;
}

interface DocsPreviewItem {
  id: string;
  type: 'document' | 'file';
  title: string;
  file?: string;
}

interface CalendarPreviewDay {
  key: string;
  label: number | null;
  hasEvent: boolean;
  isToday: boolean;
}

interface BoardPreviewPost {
  id: string;
  title: string;
  content: string;
  expand?: {
    created_by?: any;
  };
}

interface TaskPreviewColumn {
  id: string;
  name: string;
  color: string;
  taskCount: number;
}

const currentUserId = computed(() => pb.authStore.record?.id);
let loadSequence = 0;
let hasLoadedOnce = false;

async function loadData(options: { showLoading?: boolean } = {}) {
  const sequence = ++loadSequence;
  const showLoading = options.showLoading ?? !hasLoadedOnce;

  if (showLoading) {
    loading.value = true;
    error.value = '';
  }
  
  try {
    const projectId = String(route.params.projectId);
    
    project.value = await pb.collection('projects').getOne(projectId, {
      expand: 'outpost',
    });
    outpost.value = project.value.expand?.outpost;
    canManageSettings.value = await canUserPerformOnProject('manage_settings', projectId);
    canManageMembers.value = await canUserPerformOnProject('manage_members', projectId);
    
    // Load active tools
    activeTools.value = await getActiveProjectTools(projectId);
    syncPreviewReady(!hasLoadedOnce);
    await Promise.all([
      loadChatPreviews(sequence),
      loadTodoPreviews(sequence),
      loadDocsPreviews(sequence),
      loadCalendarPreviews(sequence),
      loadBoardPreviews(sequence),
      loadTaskPreviews(sequence),
    ]);

    if (sequence !== loadSequence) return;
    hasLoadedOnce = true;
    error.value = '';
  } catch (err: any) {
    if (sequence !== loadSequence) return;
    console.error('Error loading project:', err);
    if (showLoading || !hasLoadedOnce) {
      error.value = 'Failed to load project';
    }
  } finally {
    if (sequence !== loadSequence) return;
    if (showLoading) {
      await temporaryLoadingDelay();
      if (sequence !== loadSequence) return;
      loading.value = false;
    }
  }
}

onMounted(() => {
  loadData({ showLoading: true });
});

onIonViewWillEnter(() => {
  loadData({ showLoading: !hasLoadedOnce });
});

function syncPreviewReady(reset: boolean) {
  const next: Record<string, boolean> = {};

  for (const tool of activeTools.value) {
    next[tool.id] = reset ? false : (previewReady.value[tool.id] ?? false);
  }

  previewReady.value = next;
}

function markPreviewReady(toolIds: string[], sequence: number) {
  if (sequence !== loadSequence) return;

  previewReady.value = {
    ...previewReady.value,
    ...Object.fromEntries(toolIds.map((toolId) => [toolId, true])),
  };
}

function isToolPreviewReady(tool: any) {
  return !hasTileTitle(tool.tool_type) || previewReady.value[tool.id] === true;
}

async function loadChatPreviews(sequence = loadSequence) {
  const chatTools = activeTools.value.filter(tool => tool.tool_type === 'chat');

  try {
    if (chatTools.length === 0) {
      if (sequence === loadSequence) chatPreviews.value = {};
      return;
    }

    const previews = await Promise.all(
      chatTools.map(async (tool) => {
        const response = await pb.collection('chat_messages').getList(1, 3, {
          filter: `project_tool = "${tool.id}"`,
          sort: '-created',
          expand: 'user',
        });

        return [tool.id, response.items.reverse()] as const;
      })
    );

    if (sequence === loadSequence) {
      chatPreviews.value = Object.fromEntries(previews);
      markPreviewReady(chatTools.map((tool) => tool.id), sequence);
    }
  } catch (err) {
    console.error('Error loading chat previews:', err);
    markPreviewReady(chatTools.map((tool) => tool.id), sequence);
  }
}

function getChatPreviewMessages(toolId: string) {
  return chatPreviews.value[toolId] || [];
}

function getChatPreviewName(message: ChatMessage) {
  return message.expand?.user?.name || message.expand?.user?.email?.split('@')[0] || 'Someone';
}

async function loadTodoPreviews(sequence = loadSequence) {
  const todoTools = activeTools.value.filter(tool => tool.tool_type === 'todos');

  try {
    if (todoTools.length === 0) {
      if (sequence === loadSequence) todoPreviews.value = {};
      return;
    }

    const previews = await Promise.all(
      todoTools.map(async (tool) => {
        const response = await pb.collection('todo_items').getList(1, 5, {
          filter: `todo_list.project_tool = "${tool.id}" && completed = false`,
          sort: 'position,created',
        });

        return [tool.id, response.items as BoardPreviewPost[]] as const;
      })
    );

    if (sequence === loadSequence) {
      todoPreviews.value = Object.fromEntries(previews);
      markPreviewReady(todoTools.map((tool) => tool.id), sequence);
    }
  } catch (err) {
    console.error('Error loading todo previews:', err);
    markPreviewReady(todoTools.map((tool) => tool.id), sequence);
  }
}

function getTodoPreviewItems(toolId: string) {
  return todoPreviews.value[toolId] || [];
}

async function loadDocsPreviews(sequence = loadSequence) {
  const docsTools = activeTools.value.filter(tool => tool.tool_type === 'docs');

  try {
    if (docsTools.length === 0) {
      if (sequence === loadSequence) docsPreviews.value = {};
      return;
    }

    const previews = await Promise.all(
      docsTools.map(async (tool) => {
        const response = await pb.collection('docs_items').getList(1, 5, {
          filter: `project_tool = "${tool.id}"`,
          sort: 'position,created',
        });

        return [tool.id, response.items] as const;
      })
    );

    if (sequence === loadSequence) {
      docsPreviews.value = Object.fromEntries(previews);
      markPreviewReady(docsTools.map((tool) => tool.id), sequence);
    }
  } catch (err) {
    console.error('Error loading docs previews:', err);
    markPreviewReady(docsTools.map((tool) => tool.id), sequence);
  }
}

function getDocsPreviewItems(toolId: string) {
  return docsPreviews.value[toolId] || [];
}

function getDocsPreviewIcon(item: DocsPreviewItem) {
  return item.type === 'document' ? 'lucide:file-text' : 'lucide:file';
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCalendarPreviewRange() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const rangeStart = new Date(monthStart);
  rangeStart.setDate(rangeStart.getDate() - monthStart.getDay());
  const rangeEnd = new Date(monthEnd);
  rangeEnd.setDate(rangeEnd.getDate() + (6 - monthEnd.getDay()));

  return { monthStart, rangeStart, rangeEnd };
}

function buildCalendarPreviewDays(eventDates = new Set<string>()) {
  const { monthStart } = getCalendarPreviewRange();
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const days: CalendarPreviewDay[] = [];

  for (let i = 0; i < monthStart.getDay(); i += 1) {
    days.push({
      key: `blank-${i}`,
      label: null,
      hasEvent: false,
      isToday: false,
    });
  }

  const cursor = new Date(monthStart);
  while (cursor <= monthEnd) {
    const key = formatDateKey(cursor);
    days.push({
      key,
      label: cursor.getDate(),
      hasEvent: eventDates.has(key),
      isToday: isCalendarPreviewToday(cursor),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

async function loadCalendarPreviews(sequence = loadSequence) {
  const scheduleTools = activeTools.value.filter(tool => tool.tool_type === 'schedule');

  try {
    if (scheduleTools.length === 0) {
      if (sequence === loadSequence) calendarPreviews.value = {};
      return;
    }

    const { rangeStart, rangeEnd } = getCalendarPreviewRange();
    const previews = await Promise.all(
      scheduleTools.map(async (tool) => {
        const response = await pb.collection('calendar_events').getList(1, 200, {
          filter: `project_tool = "${tool.id}" && start_date >= "${rangeStart.toISOString()}" && start_date <= "${rangeEnd.toISOString()}"`,
          sort: 'start_date',
        });
        const eventDates = new Set(response.items.map((item: any) => formatDateKey(new Date(item.start_date))));

        return [tool.id, buildCalendarPreviewDays(eventDates)] as const;
      })
    );

    if (sequence === loadSequence) {
      calendarPreviews.value = Object.fromEntries(previews);
      markPreviewReady(scheduleTools.map((tool) => tool.id), sequence);
    }
  } catch (err) {
    console.error('Error loading calendar previews:', err);
    markPreviewReady(scheduleTools.map((tool) => tool.id), sequence);
  }
}

function isCalendarPreviewToday(date: Date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function getCalendarPreviewDays(toolId: string) {
  return calendarPreviews.value[toolId] || buildCalendarPreviewDays();
}

const calendarPreviewMonthLabel = computed(() => {
  return new Date().toLocaleDateString('en-US', { month: 'long' });
});

async function loadBoardPreviews(sequence = loadSequence) {
  const boardTools = activeTools.value.filter(tool => tool.tool_type === 'board');

  try {
    if (boardTools.length === 0) {
      if (sequence === loadSequence) boardPreviews.value = {};
      return;
    }

    const previews = await Promise.all(
      boardTools.map(async (tool) => {
        const response = await pb.collection('board_posts').getList(1, 3, {
          filter: `project_tool = "${tool.id}"`,
          sort: '-created',
          expand: 'created_by',
        });

        return [tool.id, response.items] as const;
      })
    );

    if (sequence === loadSequence) {
      boardPreviews.value = Object.fromEntries(previews);
      markPreviewReady(boardTools.map((tool) => tool.id), sequence);
    }
  } catch (err) {
    console.error('Error loading board previews:', err);
    markPreviewReady(boardTools.map((tool) => tool.id), sequence);
  }
}

function getBoardPreviewPosts(toolId: string) {
  return boardPreviews.value[toolId] || [];
}

function getBoardPreviewContent(post: BoardPreviewPost) {
  return (post.content || '').replace(/<[^>]*>/g, '').trim();
}

function getBoardPreviewAuthor(post: BoardPreviewPost) {
  return post.expand?.created_by?.name || post.expand?.created_by?.email?.split('@')[0] || 'Unknown';
}

async function loadTaskPreviews(sequence = loadSequence) {
  const taskTools = activeTools.value.filter(tool => tool.tool_type === 'tasks');

  try {
    if (taskTools.length === 0) {
      if (sequence === loadSequence) taskPreviews.value = {};
      return;
    }

    const previews = await Promise.all(
      taskTools.map(async (tool) => {
        const [columns, tasks] = await Promise.all([
          pb.collection('task_columns').getFullList<any>({
            filter: `project_tool = "${tool.id}" && archived = false`,
            sort: 'position,created',
          }),
          pb.collection('tasks').getFullList<any>({
            filter: `project_tool = "${tool.id}" && archived = false`,
          }),
        ]);
        const counts = tasks.reduce((acc: Record<string, number>, task: any) => {
          acc[task.column] = (acc[task.column] || 0) + 1;
          return acc;
        }, {});

        return [
          tool.id,
          columns.map((column: any) => ({
            id: column.id,
            name: column.name,
            color: column.color,
            taskCount: counts[column.id] || 0,
          })),
        ] as const;
      })
    );

    if (sequence === loadSequence) {
      taskPreviews.value = Object.fromEntries(previews);
      markPreviewReady(taskTools.map((tool) => tool.id), sequence);
    }
  } catch (err) {
    console.error('Error loading task previews:', err);
    markPreviewReady(taskTools.map((tool) => tool.id), sequence);
  }
}

function getTaskPreviewColumns(toolId: string) {
  return taskPreviews.value[toolId] || [];
}

function getTaskPreviewColumnStyle(column: TaskPreviewColumn) {
  const color = /^#[0-9A-Fa-f]{6}$/.test(String(column.color)) ? column.color : '#E5E7EB';

  return {
    backgroundColor: hexToRgba(color, 0.22),
    borderColor: hexToRgba(color, 0.75),
  };
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.slice(1);
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function hasTileTitle(toolType: string) {
  return toolType === 'chat' || toolType === 'todos' || toolType === 'tasks' || toolType === 'docs' || toolType === 'schedule' || toolType === 'board';
}

function getToolRoute(toolType: string) {
  return toolType;
}

function hasPreviewItems(tool: any) {
  if (tool.tool_type === 'chat') return getChatPreviewMessages(tool.id).length > 0;
  if (tool.tool_type === 'todos') return getTodoPreviewItems(tool.id).length > 0;
  if (tool.tool_type === 'docs') return getDocsPreviewItems(tool.id).length > 0;
  if (tool.tool_type === 'schedule') return getCalendarPreviewDays(tool.id).length > 0;
  if (tool.tool_type === 'board') return getBoardPreviewPosts(tool.id).length > 0;
  if (tool.tool_type === 'tasks') return getTaskPreviewColumns(tool.id).length > 0;
  return false;
}

</script>

<template>
  <ion-page>
    <ion-content class="project-paper-page">
      <CommonContainer>
        <div class="project-paper max-w-6xl mx-auto min-h-screen rounded-t-xl px-6 py-8 sm:px-8">

          <template v-if="loading"></template>

          <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {{ error }}
          </div>

          <div v-else class="content-pop-in">
            <!-- Header -->
            <div class="mb-8 text-center">
              <h1 class="text-3xl font-semibold text-gray-600">{{ project.name }}</h1>
            </div>

            <div v-if="activeTools.length > 0" class="mb-8">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                  v-for="tool in activeTools"
                  :key="tool.id"
                  class="w-full"
                >
                  <h2 v-if="hasTileTitle(tool.tool_type)" class="mb-2 text-center text-lg font-semibold text-gray-700">
                    {{ tool.name }}
                  </h2>
                  <NuxtLink
                    :to="`/${outpost.id}/projects/${project.id}/${getToolRoute(tool.tool_type)}`"
                    class="group flex w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-transparent p-6 hover:border-gray-200"
                    :class="hasTileTitle(tool.tool_type) && isToolPreviewReady(tool) && !hasPreviewItems(tool) ? 'items-center justify-center' : 'justify-between'"
                    :style="{ aspectRatio: hasTileTitle(tool.tool_type) ? '1 / 0.86' : '1 / 1' }"
                  >
                    <div v-if="!hasTileTitle(tool.tool_type)" class="tool-icon-wrapper">
                      <Icon :name="getToolIcon(tool.tool_type)" size="32px" class="text-blue-600" />
                    </div>
                    <div :class="[
                      hasTileTitle(tool.tool_type) ? 'space-y-2' : '',
                      hasTileTitle(tool.tool_type) && isToolPreviewReady(tool) && !hasPreviewItems(tool) ? 'flex h-full items-center justify-center' : '',
                      isToolPreviewReady(tool) ? 'preview-content-ready' : ''
                    ]">
                      <h3 v-if="!hasTileTitle(tool.tool_type)" class="text-lg font-semibold text-gray-900 mb-2">
                        {{ tool.name }}
                      </h3>
                      <template v-if="hasTileTitle(tool.tool_type) && !isToolPreviewReady(tool)">
                        <div class="preview-placeholder"></div>
                      </template>
                      <template v-else-if="tool.tool_type === 'chat'">
                      <div
                        v-for="message in getChatPreviewMessages(tool.id)"
                        :key="message.id"
                        :class="[
                          'flex flex-col',
                          message.user === currentUserId ? 'items-end' : 'items-start'
                        ]"
                      >
                        <span
                          v-if="message.user !== currentUserId"
                          class="mb-1 max-w-[85%] truncate text-[11px] text-gray-400"
                        >
                          {{ getChatPreviewName(message) }}
                        </span>
                        <div
                          :class="[
                            'relative max-w-[85%] rounded-lg border px-3 py-2 text-xs leading-snug',
                            message.user === currentUserId
                              ? 'border-blue-100 bg-blue-50 text-gray-800'
                              : 'border-gray-200 bg-white text-gray-700'
                          ]"
                        >
                          <span
                            :class="[
                              'absolute top-2 h-2 w-2 rotate-45',
                              message.user === currentUserId
                                ? 'right-[-4px] border-r border-t border-blue-100 bg-blue-50'
                              : 'left-[-4px] border-b border-l border-gray-200 bg-white'
                            ]"
                          ></span>
                          <span class="block truncate">
                            {{ message.content || 'Attachment' }}
                          </span>
                        </div>
                      </div>
                      <div v-if="getChatPreviewMessages(tool.id).length === 0" class="flex items-center justify-center">
                        <Icon :name="getToolIcon(tool.tool_type)" size="32px" class="text-blue-600" />
                      </div>
                      </template>
                      <template v-else-if="tool.tool_type === 'todos'">
                        <div
                          v-for="item in getTodoPreviewItems(tool.id)"
                          :key="item.id"
                          class="flex items-center gap-3 rounded-lg px-1 py-1.5"
                        >
                          <span class="h-4 w-4 flex-shrink-0 rounded border border-gray-300 bg-white"></span>
                          <span class="truncate text-sm text-gray-700">{{ item.content }}</span>
                        </div>
                        <div v-if="getTodoPreviewItems(tool.id).length === 0" class="flex items-center justify-center">
                          <Icon :name="getToolIcon(tool.tool_type)" size="32px" class="text-blue-600" />
                        </div>
                      </template>
                      <template v-else-if="tool.tool_type === 'docs'">
                        <div class="grid grid-cols-3 gap-2">
                          <div
                            v-for="item in getDocsPreviewItems(tool.id)"
                            :key="item.id"
                            class="flex h-24 flex-col items-center rounded-md bg-gray-50 p-2 text-center"
                          >
                            <div class="flex h-10 items-center justify-center">
                              <Icon :name="getDocsPreviewIcon(item)" size="26px" class="flex-shrink-0 text-gray-400" />
                            </div>
                            <span class="mt-2 line-clamp-2 w-full text-xs font-medium leading-snug text-gray-700">{{ item.title }}</span>
                          </div>
                        </div>
                        <div v-if="getDocsPreviewItems(tool.id).length === 0" class="flex items-center justify-center">
                          <Icon :name="getToolIcon(tool.tool_type)" size="32px" class="text-blue-600" />
                        </div>
                      </template>
                      <template v-else-if="tool.tool_type === 'schedule'">
                        <div>
                          <p class="mb-2 text-center text-xs font-medium text-gray-400">
                            {{ calendarPreviewMonthLabel }}
                          </p>
                          <div class="grid grid-cols-7 justify-items-center gap-x-2 gap-y-1.5">
                            <span
                              v-for="day in getCalendarPreviewDays(tool.id)"
                              :key="day.key"
                              :class="[
                                'flex h-6 w-6 items-center justify-center rounded-full text-[11px] leading-none',
                                day.label === null ? 'invisible' : '',
                                day.hasEvent ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500',
                                day.isToday ? 'ring-1 ring-blue-200' : ''
                              ]"
                            >
                              {{ day.label }}
                            </span>
                          </div>
                        </div>
                      </template>
                      <template v-else-if="tool.tool_type === 'board'">
                        <div class="space-y-3">
                          <div
                            v-for="post in getBoardPreviewPosts(tool.id)"
                            :key="post.id"
                            class="rounded-md bg-gray-50 px-3 py-2"
                          >
                            <p class="truncate text-sm font-medium text-gray-700">{{ post.title }}</p>
                            <p class="mt-0.5 truncate text-[11px] text-gray-400">
                              {{ getBoardPreviewAuthor(post) }}
                            </p>
                            <p v-if="getBoardPreviewContent(post)" class="mt-1 line-clamp-2 text-xs leading-snug text-gray-500">
                              {{ getBoardPreviewContent(post) }}
                            </p>
                          </div>
                        </div>
                        <div v-if="getBoardPreviewPosts(tool.id).length === 0" class="flex items-center justify-center">
                          <Icon :name="getToolIcon(tool.tool_type)" size="32px" class="text-blue-600" />
                        </div>
                      </template>
                      <template v-else-if="tool.tool_type === 'tasks'">
                        <div
                          v-if="getTaskPreviewColumns(tool.id).length > 0"
                          class="task-preview-strip"
                        >
                          <div
                            v-for="column in getTaskPreviewColumns(tool.id)"
                            :key="column.id"
                            class="task-preview-column"
                            :style="getTaskPreviewColumnStyle(column)"
                          >
                            <span class="task-preview-label">
                              {{ column.name }} ({{ column.taskCount }})
                            </span>
                          </div>
                        </div>
                        <div v-else class="flex items-center justify-center">
                          <Icon :name="getToolIcon(tool.tool_type)" size="32px" class="text-blue-600" />
                        </div>
                      </template>
                      <p v-else class="text-sm text-gray-600">
                        {{ getToolDescription(tool.tool_type) }}
                      </p>
                    </div>
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- Empty State (no tools) -->
            <div v-else class="bg-white border rounded-lg p-8">
              <div class="text-center py-12">
                <Icon name="lucide:package" size="64px" class="text-gray-300 mx-auto mb-4" />
                <h2 class="text-2xl font-semibold text-gray-900 mb-2">No tools</h2>
                <p class="text-gray-600 mb-6">
                  Add tools to enable collaboration features for this project.
                </p>
              </div>
            </div>

            <div v-if="outpost && project && (canManageSettings || canManageMembers)" class="mt-10 flex justify-center text-sm">
              <NuxtLink
                :to="`/${outpost.id}/projects/${project.id}/admin`"
                class="text-gray-600 hover:text-gray-900"
              >
                Project admin
              </NuxtLink>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

<style scoped>
ion-content.project-paper-page {
  --background: #f3f4f6;
}

.project-paper {
  background: #fffefa;
}

.tool-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-placeholder {
  min-height: 2rem;
}

.preview-content-ready {
  animation: preview-fade-in 180ms ease-out both;
}

.task-preview-strip {
  display: flex;
  gap: 0.5rem;
  height: 13rem;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.25rem 0.125rem;
}

.task-preview-column {
  position: relative;
  display: flex;
  min-width: 2.25rem;
  width: 2.25rem;
  height: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid;
  border-radius: 0.375rem;
}

.task-preview-label {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 11rem;
  transform: translate(-50%, -50%) rotate(-90deg);
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1rem;
  color: #4b5563;
}

@keyframes preview-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
