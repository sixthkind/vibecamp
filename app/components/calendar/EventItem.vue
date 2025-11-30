<template>
  <div
    @click="$emit('click')"
    class="event-item p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group"
  >
    <div class="flex items-start gap-3">
      <!-- Time -->
      <div v-if="!event.all_day" class="flex-shrink-0 w-16 text-sm font-medium text-gray-600 mt-0.5">
        {{ formatTime(event.start_date) }}
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {{ event.title }}
            </h4>
            
            <div class="flex items-center gap-2 mt-1">
              <!-- Time Range for Timed Events -->
              <span v-if="!event.all_day && event.end_date" class="text-xs text-gray-500">
                {{ formatTime(event.start_date) }} - {{ formatTime(event.end_date) }}
              </span>
              
              <!-- Recurring Indicator -->
              <span v-if="event.recurrence_rule" class="flex items-center gap-1 text-xs text-gray-500">
                <Icon name="lucide:repeat" size="12px" />
                <span>{{ getRecurrenceLabel(event.recurrence_rule) }}</span>
              </span>
            </div>
          </div>

          <!-- Assignees -->
          <div v-if="hasAssignees" class="flex -space-x-2">
            <div
              v-for="(assignee, index) in displayAssignees"
              :key="assignee.id"
              class="relative"
              :title="assignee.name || assignee.email"
            >
              <div
                v-if="assignee.avatar"
                class="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100"
              >
                <img
                  :src="getAvatarUrl(assignee)"
                  :alt="assignee.name || assignee.email"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                class="w-8 h-8 rounded-full border-2 border-white bg-blue-600 text-white flex items-center justify-center text-xs font-semibold"
              >
                {{ getInitials(assignee.name || assignee.email) }}
              </div>
            </div>
            <div
              v-if="remainingAssignees > 0"
              class="w-8 h-8 rounded-full border-2 border-white bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold"
              :title="`+${remainingAssignees} more`"
            >
              +{{ remainingAssignees }}
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

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  all_day: boolean;
  assignees?: string[];
  recurrence_rule?: any;
  created_by: string;
  expand?: any;
}

interface Props {
  event: CalendarEvent;
}

const props = defineProps<Props>();

defineEmits<{
  'click': [];
}>();

const hasAssignees = computed(() => {
  return props.event.expand?.assignees && props.event.expand.assignees.length > 0;
});

const displayAssignees = computed(() => {
  if (!hasAssignees.value) return [];
  return props.event.expand.assignees.slice(0, 3);
});

const remainingAssignees = computed(() => {
  if (!hasAssignees.value) return 0;
  return Math.max(0, props.event.expand.assignees.length - 3);
});

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function getRecurrenceLabel(rule: any): string {
  if (!rule || !rule.frequency) return '';
  
  const frequency = rule.frequency.toLowerCase();
  const interval = rule.interval || 1;
  
  if (interval === 1) {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  } else {
    return `Every ${interval} ${frequency}`;
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getAvatarUrl(user: any): string {
  if (user.avatar) {
    return `${pb.baseUrl}/api/files/${user.collectionId}/${user.id}/${user.avatar}`;
  }
  return '';
}
</script>

<style scoped>
.event-item {
  position: relative;
}

.event-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #3B82F6;
  border-radius: 9999px 0 0 9999px;
}
</style>

