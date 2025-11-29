<template>
  <div class="flex flex-col h-full bg-gray-50">
    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <div class="max-w-6xl mx-auto pt-6">
        <!-- Filter and Action Bar -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <button
              @click="showArchived = false"
              :class="[
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                !showArchived 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
            >
              Active
            </button>
            <button
              @click="showArchived = true"
              :class="[
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                showArchived 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
            >
              Archived
            </button>
          </div>
          
          <button
            @click="openCreateListModal"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm font-medium"
          >
            <Icon name="lucide:plus" size="18px" />
            <span>New List</span>
          </button>
        </div>
        
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-16">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="text-gray-500 mt-4">Loading to-do lists...</p>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="filteredLists.length === 0" class="flex flex-col items-center justify-center py-16">
          <Icon name="lucide:check-square" size="64px" class="text-gray-300 mb-4" />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            {{ showArchived ? 'No archived lists' : 'No to-do lists yet' }}
          </h3>
          <p class="text-gray-600 mb-6">
            {{ showArchived 
              ? 'Archived lists will appear here' 
              : 'Create your first to-do list to get started' 
            }}
          </p>
          <button
            v-if="!showArchived"
            @click="openCreateListModal"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Icon name="lucide:plus" size="20px" />
            <span>Create Your First List</span>
          </button>
        </div>
        
        <!-- Lists -->
        <div v-else class="space-y-6">
          <TodoList
            v-for="list in filteredLists"
            :key="list.id"
            :list="list"
            :items="getItemsForList(list.id)"
            @edit-list="openEditListModal"
            @delete-list="confirmDeleteList"
            @toggle-archive="handleToggleArchive"
            @add-item="openCreateItemModal"
            @edit-item="openEditItemModal"
            @delete-item="confirmDeleteItem"
            @toggle-complete="handleToggleComplete"
          />
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
import TodoList from './TodoList.vue';
import CreateListModal from './CreateListModal.vue';
import CreateItemModal from './CreateItemModal.vue';

interface TodoListType {
  id: string;
  project_tool: string;
  name: string;
  description?: string;
  archived: boolean;
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
}>();

const isLoading = ref(true);
const showArchived = ref(false);
const lists = ref<TodoListType[]>([]);
const items = ref<TodoItemType[]>([]);
const projectMembers = ref<ProjectMember[]>([]);

// List modal
const isListModalOpen = ref(false);
const editingList = ref<TodoListType | undefined>(undefined);

// Item modal
const isItemModalOpen = ref(false);
const editingItem = ref<TodoItemType | undefined>(undefined);
const currentListIdForNewItem = ref<string>('');

const currentUserId = computed(() => pb.authStore.record?.id);

const filteredLists = computed(() => {
  return lists.value.filter(list => list.archived === showArchived.value);
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
      sort: '-created',
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
      lists.value.unshift(newList);
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

