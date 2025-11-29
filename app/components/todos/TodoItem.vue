<template>
  <div 
    class="flex items-start gap-3 p-3 bg-white rounded-lg group"
    :class="{ 'opacity-60': item.completed }"
  >
    <!-- Checkbox -->
    <div class="flex items-center pt-1">
      <button
        @click="handleToggleCompleteClick"
        class="flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
        :class="item.completed 
          ? 'bg-blue-600' 
          : 'bg-white hover:bg-blue-50'"
        :style="item.completed 
          ? 'width: 20px; height: 20px; border: 2px solid #2563eb; border-radius: 4px;'
          : 'width: 20px; height: 20px; border: 2px solid #d1d5db; border-radius: 4px;'"
        type="button"
        aria-label="Toggle completion"
      >
        <Icon 
          v-if="item.completed" 
          name="lucide:check" 
          size="14px" 
          class="text-white"
        />
      </button>
    </div>
    
    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div 
        class="text-gray-900 cursor-pointer hover:text-blue-600"
        :class="{ 'line-through': item.completed }"
        @click="handleToggleCompleteClick"
      >
        {{ item.content }}
      </div>
      
      <div v-if="item.description" class="text-sm text-gray-600 mt-1 line-clamp-2">
        {{ item.description }}
      </div>
      
      <!-- Meta Info -->
      <div class="flex flex-wrap items-center gap-3 mt-2 text-xs">
        <!-- Assignee -->
        <div v-if="assigneeInfo" class="flex items-center gap-1 text-gray-600">
          <Icon name="lucide:user" size="14px" />
          <span>{{ assigneeInfo.name || assigneeInfo.email }}</span>
        </div>
        
        <!-- Due Date -->
        <div 
          v-if="item.due_date" 
          class="flex items-center gap-1"
          :class="getDueDateClass()"
        >
          <Icon name="lucide:calendar" size="14px" />
          <span>{{ formatDueDate(item.due_date) }}</span>
        </div>
      </div>
    </div>
    
    <!-- Actions (shown on hover) -->
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        @click="handleEdit"
        class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Edit"
      >
        <Icon name="lucide:edit-2" size="16px" />
      </button>
      <button
        @click="handleDelete"
        class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Delete"
      >
        <Icon name="lucide:trash-2" size="16px" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface TodoItem {
  id: string;
  content: string;
  description?: string;
  completed: boolean;
  assignee?: string;
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  expand?: {
    assignee?: {
      id: string;
      name?: string;
      email: string;
    };
  };
}

const props = defineProps<{
  item: TodoItem;
}>();

const emit = defineEmits<{
  toggleComplete: [itemId: string, completed: boolean];
  edit: [item: TodoItem];
  delete: [itemId: string];
}>();

const assigneeInfo = computed(() => {
  return props.item.expand?.assignee;
});

function handleToggleCompleteClick() {
  emit('toggleComplete', props.item.id, !props.item.completed);
}

function handleEdit() {
  emit('edit', props.item);
}

function handleDelete() {
  emit('delete', props.item.id);
}

function getDueDateClass() {
  if (!props.item.due_date || props.item.completed) {
    return 'text-gray-500';
  }
  
  const dueDate = new Date(props.item.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'text-red-600 font-medium'; // Overdue
  } else if (diffDays === 0) {
    return 'text-yellow-600 font-medium'; // Due today
  } else {
    return 'text-gray-600';
  }
}

function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Overdue (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
  } else {
    return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

