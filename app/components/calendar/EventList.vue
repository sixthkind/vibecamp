<template>
  <div class="event-list bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-gray-900">
        {{ formattedDate }}
      </h3>
      <p class="text-sm text-gray-600">
        {{ isToday ? 'Today' : isYesterday ? 'Yesterday' : isTomorrow ? 'Tomorrow' : '' }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
    </div>

    <!-- Empty State -->
    <div v-else-if="events.length === 0" class="text-center py-8">
      <Icon name="lucide:calendar-x" size="48px" class="text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500 text-sm">No events or to-dos for this day</p>
      <button
        @click="$emit('create-event')"
        class="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Icon name="lucide:plus" size="16px" class="inline mr-1 mb-[-2px]" />
        Add Event
      </button>
    </div>

    <!-- Events and Todos -->
    <div v-else class="space-y-3">
      <!-- To-dos -->
      <div v-if="todosForDay.length > 0">
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">To-dos Due</h4>
        <div class="space-y-2">
          <TodoItem
            v-for="todo in todosForDay"
            :key="'todo-' + todo.id"
            :todo="todo"
            @click="$emit('event-click', todo)"
          />
        </div>
      </div>
      
      <!-- All-day Events -->
      <div v-if="allDayEvents.length > 0" :class="todosForDay.length > 0 ? 'mt-4' : ''">
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">All Day</h4>
        <div class="space-y-2">
          <EventItem
            v-for="event in allDayEvents"
            :key="'event-' + event.id"
            :event="event"
            @click="$emit('event-click', event)"
          />
        </div>
      </div>

      <!-- Timed Events -->
      <div v-if="timedEvents.length > 0" :class="(allDayEvents.length > 0 || todosForDay.length > 0) ? 'mt-4' : ''">
        <h4
          v-if="allDayEvents.length > 0 || todosForDay.length > 0"
          class="text-xs font-semibold text-gray-500 uppercase mb-2"
        >
          Scheduled
        </h4>
        <div class="space-y-2">
          <EventItem
            v-for="event in timedEvents"
            :key="'event-' + event.id"
            :event="event"
            @click="$emit('event-click', event)"
          />
        </div>
      </div>
    </div>

    <!-- Add Event Button (when events exist) -->
    <button
      v-if="events.length > 0"
      @click="$emit('create-event')"
      class="mt-4 w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Icon name="lucide:plus" size="16px" class="inline mr-1 mb-[-2px]" />
      Add Event
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EventItem from './EventItem.vue';
import TodoItem from './TodoItem.vue';

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
  type?: string;
}

interface Props {
  selectedDate: Date;
  events: CalendarEvent[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

defineEmits<{
  'create-event': [];
  'event-click': [event: CalendarEvent];
}>();

const formattedDate = computed(() => {
  return props.selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
});

const isToday = computed(() => {
  const today = new Date();
  return (
    props.selectedDate.getDate() === today.getDate() &&
    props.selectedDate.getMonth() === today.getMonth() &&
    props.selectedDate.getFullYear() === today.getFullYear()
  );
});

const isYesterday = computed(() => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    props.selectedDate.getDate() === yesterday.getDate() &&
    props.selectedDate.getMonth() === yesterday.getMonth() &&
    props.selectedDate.getFullYear() === yesterday.getFullYear()
  );
});

const isTomorrow = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    props.selectedDate.getDate() === tomorrow.getDate() &&
    props.selectedDate.getMonth() === tomorrow.getMonth() &&
    props.selectedDate.getFullYear() === tomorrow.getFullYear()
  );
});

const todosForDay = computed(() => {
  return props.events
    .filter(item => item.type === 'todo')
    .sort((a, b) => {
      // Sort by completed status (incomplete first), then by content
      if (a.completed === b.completed) {
        return a.content?.localeCompare(b.content) || 0;
      }
      return a.completed ? 1 : -1;
    });
});

const allDayEvents = computed(() => {
  return props.events.filter(event => event.type !== 'todo' && event.all_day);
});

const timedEvents = computed(() => {
  return props.events
    .filter(event => event.type !== 'todo' && !event.all_day)
    .sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return dateA.getTime() - dateB.getTime();
    });
});
</script>

