<template>
  <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <!-- List Header -->
    <div class="p-4 border-b border-gray-200 bg-gray-50">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold text-gray-900">{{ list.name }}</h3>
            <span 
              v-if="list.archived" 
              class="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded"
            >
              Archived
            </span>
          </div>
          <p v-if="list.description" class="text-sm text-gray-600 mt-1">
            {{ list.description }}
          </p>
          
          <!-- Progress -->
          <div class="flex items-center gap-3 mt-2">
            <div class="flex-1 max-w-xs">
              <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-blue-600 transition-all duration-300"
                  :style="{ width: `${completionPercentage}%` }"
                ></div>
              </div>
            </div>
            <span class="text-xs text-gray-600 font-medium">
              {{ completedCount }} of {{ items.length }} completed
            </span>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center gap-1 ml-4">
          <button
            @click="handleEditList"
            class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit list"
          >
            <Icon name="lucide:edit-2" size="18px" />
          </button>
          <button
            @click="handleToggleArchive"
            class="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            :title="list.archived ? 'Unarchive list' : 'Archive list'"
          >
            <Icon :name="list.archived ? 'lucide:archive-restore' : 'lucide:archive'" size="18px" />
          </button>
          <button
            @click="handleDeleteList"
            class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete list"
          >
            <Icon name="lucide:trash-2" size="18px" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Items -->
    <div class="p-4">
      <div v-if="items.length === 0" class="text-center py-8 text-gray-500">
        <Icon name="lucide:check-square" size="48px" class="mx-auto mb-2 text-gray-300" />
        <p>No to-dos yet</p>
        <p class="text-sm">Click "Add To-do" to get started</p>
      </div>
      
      <div v-else class="space-y-2">
        <!-- Uncompleted Items -->
        <TodoItem
          v-for="item in uncompletedItems"
          :key="item.id"
          :item="item"
          @toggle-complete="handleToggleComplete"
          @edit="handleEditItem"
          @delete="handleDeleteItem"
        />
        
        <!-- Add Item Button (between uncompleted and completed) -->
        <button
          v-if="!list.archived"
          @click="handleAddItem"
          class="px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
        >
          <Icon name="lucide:plus" size="18px" />
          <span>Add To-do</span>
        </button>
        
        <!-- Completed Items -->
        <TodoItem
          v-for="item in completedItems"
          :key="item.id"
          :item="item"
          @toggle-complete="handleToggleComplete"
          @edit="handleEditItem"
          @delete="handleDeleteItem"
        />
      </div>
      
      <!-- Add Item Button (for empty list) -->
      <button
        v-if="items.length === 0 && !list.archived"
        @click="handleAddItem"
        class="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="lucide:plus" size="18px" />
        <span>Add To-do</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TodoItem from './TodoItem.vue';

interface TodoItemType {
  id: string;
  content: string;
  description?: string;
  completed: boolean;
  assignee?: string;
  due_date?: string;
  position?: number;
  completed_at?: string;
  completed_by?: string;
  expand?: any;
}

interface TodoListType {
  id: string;
  name: string;
  description?: string;
  archived: boolean;
}

const props = defineProps<{
  list: TodoListType;
  items: TodoItemType[];
}>();

const emit = defineEmits<{
  editList: [list: TodoListType];
  deleteList: [listId: string];
  toggleArchive: [listId: string, archived: boolean];
  addItem: [listId: string];
  editItem: [item: TodoItemType];
  deleteItem: [itemId: string];
  toggleComplete: [itemId: string, completed: boolean];
}>();

const completedCount = computed(() => {
  return props.items.filter(item => item.completed).length;
});

const completionPercentage = computed(() => {
  if (props.items.length === 0) return 0;
  return Math.round((completedCount.value / props.items.length) * 100);
});

const sortedItems = computed(() => {
  // Sort by position, then by created date
  return [...props.items].sort((a, b) => {
    // Completed items go to bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Then sort by position if available
    if (a.position !== undefined && b.position !== undefined) {
      return a.position - b.position;
    }
    return 0;
  });
});

const uncompletedItems = computed(() => {
  return sortedItems.value.filter(item => !item.completed);
});

const completedItems = computed(() => {
  return sortedItems.value.filter(item => item.completed);
});

function handleEditList() {
  emit('editList', props.list);
}

function handleDeleteList() {
  emit('deleteList', props.list.id);
}

function handleToggleArchive() {
  emit('toggleArchive', props.list.id, !props.list.archived);
}

function handleAddItem() {
  emit('addItem', props.list.id);
}

function handleEditItem(item: TodoItemType) {
  emit('editItem', item);
}

function handleDeleteItem(itemId: string) {
  emit('deleteItem', itemId);
}

function handleToggleComplete(itemId: string, completed: boolean) {
  emit('toggleComplete', itemId, completed);
}
</script>

<style scoped>
.space-y-2 > * + * {
  margin-top: 0.5rem;
}
</style>

