<template>
  <div class="flex flex-col h-full bg-transparent">
    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <div class="max-w-3xl mx-auto">
        <h1 class="mb-4 text-center text-2xl font-semibold text-gray-700">{{ toolName }}</h1>
        <div v-if="isLoading"></div>
        
        <!-- Empty State -->
        <div v-else-if="activeLists.length === 0 && archivedLists.length === 0" class="flex flex-col items-center justify-center py-16">
          <Icon name="lucide:check-square" size="64px" class="text-gray-300 mb-4" />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No lists yet</h3>
          <p class="text-gray-600 mb-6">Add your first list to get started.</p>
          <button
            @click="openCreateListModal"
            class="text-gray-600 hover:text-gray-900"
          >
            New list
          </button>
        </div>
        
        <!-- Lists -->
        <div v-else class="space-y-2">
          <div
            v-for="(list, listIndex) in activeLists"
            :key="list.id"
            class="rounded-lg border border-gray-200 px-5 py-2.5"
            :style="getListStyle(list)"
          >
            <div class="relative mb-1.5 flex items-center justify-center">
              <h2 class="min-w-0 truncate text-center text-lg font-semibold text-gray-700">{{ list.name }}</h2>
              <div class="absolute right-0 flex shrink-0 items-center gap-1 text-gray-500">
                <button
                  type="button"
                  class="rounded p-1 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Move list up"
                  :disabled="listIndex === 0"
                  @click="moveList(listIndex, -1)"
                >
                  <Icon name="lucide:arrow-up" size="15px" />
                </button>
                <button
                  type="button"
                  class="rounded p-1 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Move list down"
                  :disabled="listIndex === activeLists.length - 1"
                  @click="moveList(listIndex, 1)"
                >
                  <Icon name="lucide:arrow-down" size="15px" />
                </button>
                <ColorPicker
                  :model-value="list.color"
                  title="List color"
                  @update:model-value="updateListColor(list, $event)"
                />
                <button
                  type="button"
                  class="rounded p-1 text-gray-500 hover:bg-white/70 hover:text-red-600"
                  title="Archive list"
                  @click="handleToggleArchive(list.id, true)"
                >
                  <Icon name="lucide:archive" size="15px" />
                </button>
              </div>
            </div>

            <div v-if="getSortedItemsForList(list.id).length > 0">
              <TodoItem
                v-for="item in getSortedItemsForList(list.id)"
                :key="item.id"
                :item="item"
                @toggle-complete="handleToggleComplete"
                @edit="openEditItemModal"
                @delete="confirmDeleteItem"
              />
            </div>

            <p v-else class="py-2 text-center text-sm text-gray-500">No to-dos yet</p>

            <div class="mt-1.5 flex justify-center text-sm">
              <button
                @click="openCreateItemModal(list.id)"
                class="text-gray-600 hover:text-gray-900"
              >
                New to-do
              </button>
            </div>
          </div>

          <div class="mt-3 flex justify-center gap-6 text-sm">
            <button
              @click="openCreateListModal"
              class="text-gray-600 hover:text-gray-900"
            >
              New list
            </button>
          </div>

          <div v-if="archivedLists.length > 0" class="mt-6 flex justify-center">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              @click="showArchivedLists = !showArchivedLists"
            >
              <Icon :name="showArchivedLists ? 'lucide:chevron-down' : 'lucide:archive'" size="16px" />
              <span>Archived</span>
            </button>
          </div>

          <div
            v-if="showArchivedLists && archivedLists.length > 0"
            class="mx-auto mt-3 max-w-xl rounded-lg border border-gray-200 bg-white/70 p-3"
          >
            <div
              v-for="list in archivedLists"
              :key="list.id"
              class="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
            >
              <span class="min-w-0 truncate font-medium text-gray-700">{{ list.name }}</span>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                @click="unarchiveList(list)"
              >
                <Icon name="lucide:archive-restore" size="14px" />
                <span>Unarchive</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
    
    <!-- Modals -->
    <CreateListModal
      :is-open="isListModalOpen"
      :list="editingList"
      @close="closeListModal"
      @submit="handleListSubmit"
    />
    
    <CreateItemModal
      :is-open="isItemModalOpen"
      :item="editingItem"
      :project-members="projectMembers"
      @close="closeItemModal"
      @submit="handleItemSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { pb } from '~/utils/pb';
import { alertController } from '@ionic/vue';
import { getProjectMembers } from '~/utils/permissions';
import TodoItem from './TodoItem.vue';
import CreateListModal from './CreateListModal.vue';
import CreateItemModal from './CreateItemModal.vue';

interface TodoListType {
  id: string;
  project_tool: string;
  name: string;
  description?: string;
  color?: string;
  archived: boolean;
  position?: number;
  created_by: string;
  created: string;
  updated: string;
}

interface TodoItemType {
  id: string;
  todo_list: string;
  content: string;
  description?: string;
  completed: boolean;
  assignee?: string;
  due_date?: string;
  position?: number;
  created_by: string;
  completed_at?: string;
  completed_by?: string;
  created: string;
  updated: string;
  expand?: any;
}

interface ProjectMember {
  id: string;
  name?: string;
  email: string;
}

const props = defineProps<{
  projectToolId: string;
  projectId: string;
  toolName?: string;
}>();

const isLoading = ref(true);
const lists = ref<TodoListType[]>([]);
const items = ref<TodoItemType[]>([]);
const projectMembers = ref<ProjectMember[]>([]);

// List modal
const isListModalOpen = ref(false);
const editingList = ref<TodoListType | undefined>(undefined);
const showArchivedLists = ref(false);

// Item modal
const isItemModalOpen = ref(false);
const editingItem = ref<TodoItemType | undefined>(undefined);
const currentListIdForNewItem = ref<string>('');

const currentUserId = computed(() => pb.authStore.record?.id);

const activeLists = computed(() => {
  return [...lists.value]
    .filter(list => !list.archived)
    .sort((a, b) => getPosition(a) - getPosition(b));
});
const archivedLists = computed(() => {
  return [...lists.value]
    .filter(list => list.archived)
    .sort((a, b) => getPosition(a) - getPosition(b));
});

onMounted(async () => {
  await Promise.all([
    fetchLists(),
    fetchItems(),
    fetchProjectMembers(),
  ]);
  isLoading.value = false;
});

async function fetchLists() {
  try {
    const records = await pb.collection('todo_lists').getFullList<TodoListType>({
      filter: `project_tool = "${props.projectToolId}"`,
      sort: 'created',
    });
    lists.value = records;
  } catch (error) {
    console.error('Error fetching todo lists:', error);
  }
}

async function fetchItems() {
  try {
    const records = await pb.collection('todo_items').getFullList<TodoItemType>({
      filter: `todo_list.project_tool = "${props.projectToolId}"`,
      sort: 'position,created',
      expand: 'assignee',
    });
    items.value = records;
  } catch (error) {
    console.error('Error fetching todo items:', error);
  }
}

async function fetchProjectMembers() {
  try {
    const members = await getProjectMembers(props.projectId);
    console.log('Fetched project members:', members);
    
    projectMembers.value = members.map((m: any) => ({
      id: m.userId || m.id,
      name: m.user?.name || m.user?.email,
      email: m.user?.email,
    }));
    
    console.log('Mapped project members:', projectMembers.value);
  } catch (error) {
    console.error('Error fetching project members:', error);
  }
}

function getItemsForList(listId: string): TodoItemType[] {
  return items.value.filter(item => item.todo_list === listId);
}

function getSortedItemsForList(listId: string): TodoItemType[] {
  return sortItems(getItemsForList(listId));
}

function sortItems(todoItems: TodoItemType[]) {
  return [...todoItems].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    if (a.position !== undefined && b.position !== undefined) {
      return a.position - b.position;
    }

    return new Date(a.created).getTime() - new Date(b.created).getTime();
  });
}

// List Modal Functions
function openCreateListModal() {
  editingList.value = undefined;
  isListModalOpen.value = true;
}

function openEditListModal(list: TodoListType) {
  editingList.value = list;
  isListModalOpen.value = true;
}

function closeListModal() {
  isListModalOpen.value = false;
  editingList.value = undefined;
}

async function handleListSubmit(data: { name: string; description?: string }) {
  try {
    if (editingList.value) {
      // Update existing list
      const updated = await pb.collection('todo_lists').update(editingList.value.id, data);
      const index = lists.value.findIndex(l => l.id === editingList.value!.id);
      if (index !== -1) {
        lists.value[index] = { ...lists.value[index], ...updated };
      }
    } else {
      // Create new list
      const newList = await pb.collection('todo_lists').create<TodoListType>({
        project_tool: props.projectToolId,
        created_by: currentUserId.value,
        archived: false,
        ...data,
      });
      const positionedList = { ...newList, position: getNextListPosition() };
      lists.value.push(positionedList);
      await saveListPositions(activeLists.value);
    }
    closeListModal();
  } catch (error) {
    console.error('Error saving list:', error);
    alert('Failed to save list. Please try again.');
  }
}

async function handleToggleArchive(listId: string, archived: boolean) {
  try {
    await pb.collection('todo_lists').update(listId, { archived });
    const index = lists.value.findIndex(l => l.id === listId);
    if (index !== -1) {
      lists.value[index].archived = archived;
    }
  } catch (error) {
    console.error('Error toggling archive:', error);
    alert('Failed to update list. Please try again.');
  }
}

async function unarchiveList(list: TodoListType) {
  const nextPosition = getNextListPosition();

  try {
    const updated = await pb.collection('todo_lists').update<TodoListType>(list.id, {
      archived: false,
      position: nextPosition,
    });
    const index = lists.value.findIndex(l => l.id === list.id);
    if (index !== -1) {
      lists.value[index] = { ...lists.value[index], ...updated, archived: false, position: nextPosition };
    }

    if (archivedLists.value.length === 0) {
      showArchivedLists.value = false;
    }
  } catch (error) {
    console.error('Error unarchiving todo list:', error);
  }
}

async function updateListColor(list: TodoListType, color: string | undefined) {
  list.color = color;

  try {
    const updated = await pb.collection('todo_lists').update<TodoListType>(list.id, { color: color ?? '' });
    const index = lists.value.findIndex(l => l.id === list.id);
    if (index !== -1) {
      lists.value[index] = { ...lists.value[index], ...updated };
    }
  } catch (error) {
    console.error('Error updating list color:', error);
  }
}

async function confirmDeleteList(listId: string) {
  const alert = await alertController.create({
    header: 'Delete List',
    message: 'Are you sure you want to delete this list? All to-dos in this list will also be deleted.',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          try {
            await pb.collection('todo_lists').delete(listId);
            lists.value = lists.value.filter(l => l.id !== listId);
            items.value = items.value.filter(i => i.todo_list !== listId);
          } catch (error) {
            console.error('Error deleting list:', error);
            alert('Failed to delete list. Please try again.');
          }
        },
      },
    ],
  });
  
  await alert.present();
}

async function moveList(index: number, direction: -1 | 1) {
  const orderedLists = activeLists.value;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= orderedLists.length) return;

  const reordered = [...orderedLists];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  lists.value = lists.value.map((list) => {
    const orderedIndex = reordered.findIndex((item) => item.id === list.id);
    return orderedIndex === -1 ? list : { ...list, position: orderedIndex + 1 };
  });

  await saveListPositions(reordered);
}

async function saveListPositions(orderedLists: TodoListType[]) {
  try {
    await Promise.all(
      orderedLists.map((list, nextIndex) => (
        pb.collection('todo_lists').update(list.id, { position: nextIndex + 1 })
      ))
    );
  } catch (error) {
    console.error('Error saving todo list order:', error);
  }
}

function getNextListPosition() {
  return activeLists.value.length > 0
    ? Math.max(...activeLists.value.map((list) => getPosition(list))) + 1
    : 1;
}

function getPosition(item: { position?: number }) {
  return item.position || 0;
}

function getListStyle(list: TodoListType) {
  const color = isValidHexColor(list.color) ? list.color : '#E5E7EB';

  return {
    backgroundColor: hexToRgba(color, 0.14),
    borderColor: hexToRgba(color, 0.55),
  };
}

function isValidHexColor(color?: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(String(color || ''));
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.slice(1);
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

// Item Modal Functions
function openCreateItemModal(listId: string) {
  currentListIdForNewItem.value = listId;
  editingItem.value = undefined;
  isItemModalOpen.value = true;
}

function openEditItemModal(item: TodoItemType) {
  currentListIdForNewItem.value = item.todo_list;
  editingItem.value = item;
  isItemModalOpen.value = true;
}

function closeItemModal() {
  isItemModalOpen.value = false;
  editingItem.value = undefined;
  currentListIdForNewItem.value = '';
}

async function handleItemSubmit(data: {
  content: string;
  description?: string;
  assignee?: string | null;
  due_date?: string | null;
}) {
  try {
    if (editingItem.value) {
      // Update existing item
      const updated = await pb.collection('todo_items').update(editingItem.value.id, data, {
        expand: 'assignee',
      });
      const index = items.value.findIndex(i => i.id === editingItem.value!.id);
      if (index !== -1) {
        items.value[index] = updated;
      }
    } else {
      // Create new item
      const listItems = items.value.filter(i => i.todo_list === currentListIdForNewItem.value);
      const maxPosition = listItems.length > 0 
        ? Math.max(...listItems.map(i => i.position || 0))
        : 0;
      
      const newItem = await pb.collection('todo_items').create<TodoItemType>({
        todo_list: currentListIdForNewItem.value,
        created_by: currentUserId.value,
        completed: false,
        position: maxPosition + 1,
        ...data,
      }, {
        expand: 'assignee',
      });
      items.value.push(newItem);
    }
    closeItemModal();
  } catch (error) {
    console.error('Error saving item:', error);
    alert('Failed to save to-do. Please try again.');
  }
}

async function handleToggleComplete(itemId: string, completed: boolean) {
  try {
    const updateData: any = { completed };
    if (completed) {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = currentUserId.value;
    } else {
      updateData.completed_at = null;
      updateData.completed_by = null;
    }
    
    const updated = await pb.collection('todo_items').update(itemId, updateData, {
      expand: 'assignee',
    });
    const index = items.value.findIndex(i => i.id === itemId);
    if (index !== -1) {
      items.value[index] = updated;
    }
  } catch (error) {
    console.error('Error toggling completion:', error);
    alert('Failed to update to-do. Please try again.');
  }
}

async function confirmDeleteItem(itemId: string) {
  const alert = await alertController.create({
    header: 'Delete To-do',
    message: 'Are you sure you want to delete this to-do?',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          try {
            await pb.collection('todo_items').delete(itemId);
            items.value = items.value.filter(i => i.id !== itemId);
          } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete to-do. Please try again.');
          }
        },
      },
    ],
  });
  
  await alert.present();
}
</script>

<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
</style>
