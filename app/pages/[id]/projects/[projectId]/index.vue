<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
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

const currentUserId = computed(() => pb.authStore.record?.id);

async function loadData() {
  loading.value = true;
  error.value = '';
  
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
    loadChatPreviews();
    loadTodoPreviews();
    loadDocsPreviews();
    loadCalendarPreviews();
    loadBoardPreviews();
  } catch (err: any) {
    console.error('Error loading project:', err);
    error.value = 'Failed to load project';
  } finally {
    await temporaryLoadingDelay();
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

async function loadChatPreviews() {
  try {
    const chatTools = activeTools.value.filter(tool => tool.tool_type === 'chat');

    if (chatTools.length === 0) {
      chatPreviews.value = {};
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

    chatPreviews.value = Object.fromEntries(previews);
  } catch (err) {
    console.error('Error loading chat previews:', err);
  }
}

function getChatPreviewMessages(toolId: string) {
  return chatPreviews.value[toolId] || [];
}

function getChatPreviewName(message: ChatMessage) {
  return message.expand?.user?.name || message.expand?.user?.email?.split('@')[0] || 'Someone';
}

async function loadTodoPreviews() {
  try {
    const todoTools = activeTools.value.filter(tool => tool.tool_type === 'tasks');

    if (todoTools.length === 0) {
      todoPreviews.value = {};
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

    todoPreviews.value = Object.fromEntries(previews);
  } catch (err) {
    console.error('Error loading todo previews:', err);
  }
}

function getTodoPreviewItems(toolId: string) {
  return todoPreviews.value[toolId] || [];
}

async function loadDocsPreviews() {
  try {
    const docsTools = activeTools.value.filter(tool => tool.tool_type === 'docs');

    if (docsTools.length === 0) {
      docsPreviews.value = {};
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

    docsPreviews.value = Object.fromEntries(previews);
  } catch (err) {
    console.error('Error loading docs previews:', err);
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

async function loadCalendarPreviews() {
  try {
    const scheduleTools = activeTools.value.filter(tool => tool.tool_type === 'schedule');

    if (scheduleTools.length === 0) {
      calendarPreviews.value = {};
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

    calendarPreviews.value = Object.fromEntries(previews);
  } catch (err) {
    console.error('Error loading calendar previews:', err);
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

async function loadBoardPreviews() {
  try {
    const boardTools = activeTools.value.filter(tool => tool.tool_type === 'board');

    if (boardTools.length === 0) {
      boardPreviews.value = {};
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

    boardPreviews.value = Object.fromEntries(previews);
  } catch (err) {
    console.error('Error loading board previews:', err);
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

function hasTileTitle(toolType: string) {
  return toolType === 'chat' || toolType === 'tasks' || toolType === 'docs' || toolType === 'schedule' || toolType === 'board';
}

function getToolRoute(toolType: string) {
  return toolType === 'tasks' ? 'todos' : toolType;
}

function hasPreviewItems(tool: any) {
  if (tool.tool_type === 'chat') return getChatPreviewMessages(tool.id).length > 0;
  if (tool.tool_type === 'tasks') return getTodoPreviewItems(tool.id).length > 0;
  if (tool.tool_type === 'docs') return getDocsPreviewItems(tool.id).length > 0;
  if (tool.tool_type === 'schedule') return getCalendarPreviewDays(tool.id).length > 0;
  if (tool.tool_type === 'board') return getBoardPreviewPosts(tool.id).length > 0;
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
                    :class="hasTileTitle(tool.tool_type) && !hasPreviewItems(tool) ? 'items-center justify-center' : 'justify-between'"
                    :style="{ aspectRatio: hasTileTitle(tool.tool_type) ? '1 / 0.86' : '1 / 1' }"
                  >
                    <div v-if="!hasTileTitle(tool.tool_type)" class="tool-icon-wrapper">
                      <Icon :name="getToolIcon(tool.tool_type)" size="32px" class="text-blue-600" />
                    </div>
                    <div :class="[
                      hasTileTitle(tool.tool_type) ? 'space-y-2' : '',
                      hasTileTitle(tool.tool_type) && !hasPreviewItems(tool) ? 'flex h-full items-center justify-center' : ''
                    ]">
                      <h3 v-if="!hasTileTitle(tool.tool_type)" class="text-lg font-semibold text-gray-900 mb-2">
                        {{ tool.name }}
                      </h3>
                      <template v-if="tool.tool_type === 'chat'">
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
                      <template v-else-if="tool.tool_type === 'tasks'">
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
</style>
