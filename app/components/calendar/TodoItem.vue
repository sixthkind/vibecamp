<template>
  <div
    @click="$emit('click')"
    :class="[
      'todo-item p-3 border rounded-lg transition-all cursor-pointer group',
      todo.completed 
        ? 'border-gray-200 bg-gray-50 hover:border-gray-300' 
        : 'border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100'
    ]"
  >
    <div class="flex items-start gap-3">
      <!-- Checkbox Icon -->
      <div class="flex-shrink-0 mt-0.5">
        <Icon 
          :name="todo.completed ? 'lucide:check-circle-2' : 'lucide:circle'" 
          :class="[
            'transition-colors',
            todo.completed ? 'text-gray-400' : 'text-amber-600'
          ]"
          size="20px" 
        />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <h4 
              :class="[
                'font-semibold transition-colors truncate',
                todo.completed 
                  ? 'text-gray-500 line-through' 
                  : 'text-gray-900 group-hover:text-amber-700'
              ]"
            >
              {{ todo.content }}
            </h4>
            
            <div class="flex items-center gap-2 mt-1">
              <!-- List Name -->
              <span v-if="todo.expand?.todo_list" class="text-xs text-gray-500">
                {{ todo.expand.todo_list.name }}
              </span>
              
              <!-- Description indicator -->
              <span v-if="todo.description" class="flex items-center gap-1 text-xs text-gray-500">
                <Icon name="lucide:file-text" size="12px" />
              </span>
            </div>
          </div>

          <!-- Assignee -->
          <div v-if="hasAssignee" class="flex-shrink-0">
            <div
              class="relative"
              :title="assigneeName"
            >
              <div
                v-if="assigneeAvatar"
                class="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100"
              >
                <img
                  :src="assigneeAvatar"
                  :alt="assigneeName"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                class="w-8 h-8 rounded-full border-2 border-white bg-amber-600 text-white flex items-center justify-center text-xs font-semibold"
              >
                {{ getInitials(assigneeName) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { pb } from '~/utils/pb';

interface TodoItem {
  id: string;
  content: string;
  description?: string;
  completed: boolean;
  assignee?: string;
  due_date?: string;
  expand?: any;
}

interface Props {
  todo: TodoItem;
}

const props = defineProps<Props>();

defineEmits<{
  'click': [];
}>();

const hasAssignee = computed(() => {
  return props.todo.expand?.assignee;
});

const assigneeName = computed(() => {
  if (!hasAssignee.value) return '';
  const assignee = props.todo.expand.assignee;
  return assignee.name || assignee.email;
});

const assigneeAvatar = computed(() => {
  if (!hasAssignee.value) return '';
  const assignee = props.todo.expand.assignee;
  if (assignee.avatar) {
    return `${pb.baseUrl}/api/files/${assignee.collectionId}/${assignee.id}/${assignee.avatar}`;
  }
  return '';
});

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
</script>

<style scoped>
.todo-item {
  position: relative;
}

.todo-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 9999px 0 0 9999px;
  background-color: #F59E0B; /* amber-500 for incomplete */
}

.todo-item.bg-gray-50::before {
  background-color: #9CA3AF; /* gray-400 for completed */
}
</style>
