<template>
  <div class="calendar-container flex flex-col h-full bg-gray-50">
    <!-- Header -->
    <div class="flex-shrink-0 px-4 py-4 pt-20 bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Schedule</h2>
        <button
          @click="openCreateModal"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm font-medium"
        >
          <Icon name="lucide:plus" size="18px" />
          <span>New Event</span>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Calendar View (Left/Top) -->
          <div class="lg:col-span-2">
            <CalendarView
              :selected-date="selectedDate"
              :events-by-date="eventsByDate"
              @update:selected-date="handleDateChange"
              @month-changed="handleMonthChange"
            />
          </div>

          <!-- Event List (Right/Bottom) -->
          <div class="lg:col-span-1">
            <EventList
              :selected-date="selectedDate"
              :events="selectedDateEvents"
              :loading="eventsLoading"
              @create-event="openCreateModal"
              @event-click="handleEventClick"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Event Modal -->
    <CreateEventModal
      :is-open="isModalOpen"
      :event="editingEvent"
      :project-members="projectMembers"
      :default-date="selectedDate"
      @close="closeModal"
      @submit="handleEventSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { getProjectMembers } from '~/utils/permissions';
import CalendarView from './CalendarView.vue';
import EventList from './EventList.vue';
import CreateEventModal from './CreateEventModal.vue';

interface Props {
  projectToolId: string;
  projectId: string;
}

const props = defineProps<Props>();

const router = useRouter();
const route = useRoute();

const selectedDate = ref(new Date());
const events = ref<any[]>([]);
const todos = ref<any[]>([]);
const eventsLoading = ref(true);
const isModalOpen = ref(false);
const editingEvent = ref<any>(null);
const projectMembers = ref<any[]>([]);

let unsubscribe: (() => void) | null = null;
let todoUnsubscribe: (() => void) | null = null;

// Computed property for events and todos grouped by date
const eventsByDate = computed(() => {
  const byDate: Record<string, number> = {};
  
  // Add events
  events.value.forEach(event => {
    const eventDate = new Date(event.start_date);
    
    // Handle recurring events
    if (event.recurrence_rule) {
      const instances = generateRecurringInstances(event, selectedDate.value);
      instances.forEach(instanceDate => {
        const dateKey = formatDateKey(instanceDate);
        byDate[dateKey] = (byDate[dateKey] || 0) + 1;
      });
    } else {
      // Single event
      const dateKey = formatDateKey(eventDate);
      byDate[dateKey] = (byDate[dateKey] || 0) + 1;
    }
  });
  
  // Add todos with due dates
  todos.value.forEach(todo => {
    if (todo.due_date) {
      const dueDate = new Date(todo.due_date);
      const dateKey = formatDateKey(dueDate);
      byDate[dateKey] = (byDate[dateKey] || 0) + 1;
    }
  });
  
  return byDate;
});

// Events and todos for the selected date
const selectedDateEvents = computed(() => {
  const dateKey = formatDateKey(selectedDate.value);
  const items: any[] = [];
  
  // Add events
  events.value.forEach(event => {
    const eventDate = new Date(event.start_date);
    const eventDateKey = formatDateKey(eventDate);
    
    // Check if it's a single event on the selected date
    if (eventDateKey === dateKey) {
      items.push({ ...event, type: 'event' });
    }
    // Check if it's a recurring event that occurs on the selected date
    else if (event.recurrence_rule) {
      const instances = generateRecurringInstances(event, selectedDate.value);
      if (instances.some(instanceDate => formatDateKey(instanceDate) === dateKey)) {
        items.push({ ...event, type: 'event' });
      }
    }
  });
  
  // Add todos with due dates
  todos.value.forEach(todo => {
    if (todo.due_date) {
      const dueDate = new Date(todo.due_date);
      const dueDateKey = formatDateKey(dueDate);
      if (dueDateKey === dateKey) {
        items.push({ ...todo, type: 'todo' });
      }
    }
  });
  
  return items;
});

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateRecurringInstances(event: any, currentMonth: Date): Date[] {
  if (!event.recurrence_rule) return [];
  
  const instances: Date[] = [];
  const startDate = new Date(event.start_date);
  const rule = event.recurrence_rule;
  const frequency = rule.frequency?.toLowerCase();
  const interval = rule.interval || 1;
  
  // Calculate the range to show (current month view)
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  // Extend range to show previous/next month days in calendar (42 days total)
  const rangeStart = new Date(monthStart);
  rangeStart.setDate(rangeStart.getDate() - monthStart.getDay());
  
  const rangeEnd = new Date(monthEnd);
  rangeEnd.setDate(rangeEnd.getDate() + (6 - monthEnd.getDay()));
  
  const endDate = event.recurrence_end_date 
    ? new Date(event.recurrence_end_date)
    : rangeEnd;
  
  let currentDate = new Date(startDate);
  
  // Generate instances within the visible range
  while (currentDate <= endDate && currentDate <= rangeEnd) {
    if (currentDate >= rangeStart) {
      instances.push(new Date(currentDate));
    }
    
    // Increment based on frequency
    switch (frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * interval));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      default:
        return instances; // Unknown frequency
    }
    
    // Prevent infinite loop
    if (instances.length > 1000) break;
  }
  
  return instances;
}

async function loadEvents() {
  eventsLoading.value = true;
  
  try {
    // Calculate date range for the current view (3 months: previous, current, next)
    const currentMonth = new Date(selectedDate.value);
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);
    
    const records = await pb.collection('calendar_events').getFullList({
      filter: `project_tool = "${props.projectToolId}" && start_date >= "${startDate.toISOString()}" && start_date <= "${endDate.toISOString()}"`,
      sort: 'start_date',
      expand: 'assignees,created_by',
    });
    
    events.value = records;
  } catch (error) {
    console.error('Error loading events:', error);
  } finally {
    eventsLoading.value = false;
  }
}

async function loadTodos() {
  try {
    // Fetch todo items with due dates for this project
    // We need to filter by the project, not the schedule tool ID
    const filter = `todo_list.project_tool.project = "${props.projectId}" && due_date != ""`;
    
    const records = await pb.collection('todo_items').getFullList({
      filter,
      sort: 'due_date',
      expand: 'assignee,todo_list',
    });
    
    todos.value = records;
  } catch (error) {
    console.error('Error loading todos:', error);
  }
}

async function loadProjectMembers() {
  try {
    const members = await getProjectMembers(props.projectId);
    
    projectMembers.value = members.map((m: any) => ({
      id: m.userId || m.id,
      name: m.user?.name || m.user?.email,
      email: m.user?.email,
      avatar: m.user?.avatar,
      collectionId: m.user?.collectionId,
    }));
  } catch (error) {
    console.error('Error loading project members:', error);
  }
}

function handleDateChange(date: Date) {
  selectedDate.value = date;
}

function handleMonthChange(year: number, month: number) {
  selectedDate.value = new Date(year, month, selectedDate.value.getDate());
  loadEvents(); // Reload events for the new month range
  loadTodos(); // Reload todos for the new month range
}

function openCreateModal() {
  editingEvent.value = null;
  isModalOpen.value = true;
}

async function openEditModalForEvent(eventId: string) {
  try {
    const eventRecord = await pb.collection('calendar_events').getOne(eventId, {
      expand: 'assignees,created_by',
    });
    editingEvent.value = eventRecord;
    isModalOpen.value = true;
    
    // Clear the query parameter
    router.replace({
      path: route.path,
      query: {}
    });
  } catch (error) {
    console.error('Error loading event for editing:', error);
    alert('Failed to load event. Please try again.');
  }
}

function closeModal() {
  isModalOpen.value = false;
  editingEvent.value = null;
}

async function handleEventSubmit(data: any) {
  try {
    const eventData = {
      ...data,
      project_tool: props.projectToolId,
      created_by: pb.authStore.model?.id,
    };

    if (editingEvent.value) {
      // Update existing event
      await pb.collection('calendar_events').update(editingEvent.value.id, eventData);
    } else {
      // Create new event
      await pb.collection('calendar_events').create(eventData);
    }

    // Reload events
    await loadEvents();
  } catch (error) {
    console.error('Error saving event:', error);
    alert('Failed to save event. Please try again.');
  }
}

function handleEventClick(item: any) {
  const outpostId = router.currentRoute.value.params.id;
  
  if (item.type === 'todo') {
    // Navigate to todos page
    router.push(`/${outpostId}/projects/${props.projectId}/todos`);
  } else {
    // Navigate to event detail page
    router.push(`/${outpostId}/projects/${props.projectId}/schedule/${item.id}`);
  }
}

async function subscribeToEvents() {
  // Subscribe to realtime updates for calendar events
  unsubscribe = await pb.collection('calendar_events').subscribe('*', (e) => {
    // Check if the event belongs to this project tool
    if (e.record.project_tool === props.projectToolId) {
      if (e.action === 'create') {
        loadEvents();
      } else if (e.action === 'update') {
        const index = events.value.findIndex(event => event.id === e.record.id);
        if (index !== -1) {
          events.value[index] = e.record;
        }
      } else if (e.action === 'delete') {
        events.value = events.value.filter(event => event.id !== e.record.id);
      }
    }
  });
  
  // Subscribe to realtime updates for todo items
  todoUnsubscribe = await pb.collection('todo_items').subscribe('*', (e) => {
    // Reload todos when changes occur to items with due dates
    if (e.record.due_date || e.action === 'delete') {
      loadTodos();
    }
  });
}

onMounted(async () => {
  await Promise.all([
    loadEvents(),
    loadTodos(),
    loadProjectMembers()
  ]);
  
  subscribeToEvents();
  
  // Check if we should open the edit modal
  if (route.query.edit) {
    openEditModalForEvent(String(route.query.edit));
  }
});

// Watch for changes to the edit query parameter
watch(() => route.query.edit, (eventId) => {
  if (eventId) {
    openEditModalForEvent(String(eventId));
  }
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
  if (todoUnsubscribe) {
    todoUnsubscribe();
  }
});
</script>

<style scoped>
.calendar-container {
  min-height: 0; /* Fix for flex overflow */
}
</style>

