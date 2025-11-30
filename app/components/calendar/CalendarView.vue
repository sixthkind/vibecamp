<template>
  <div class="calendar-view bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Calendar Header -->
    <div class="calendar-header flex items-center justify-between p-4 border-b border-gray-200">
      <button
        @click="previousMonth"
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Previous month"
      >
        <Icon name="lucide:chevron-left" size="20px" class="text-gray-700" />
      </button>
      
      <h2 class="text-lg font-semibold text-gray-900">
        {{ monthYearLabel }}
      </h2>
      
      <button
        @click="nextMonth"
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Next month"
      >
        <Icon name="lucide:chevron-right" size="20px" class="text-gray-700" />
      </button>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid p-4">
      <!-- Day Headers -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div
          v-for="day in dayHeaders"
          :key="day"
          class="text-center text-xs font-semibold text-gray-600 py-2"
        >
          {{ day }}
        </div>
      </div>

      <!-- Calendar Days -->
      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="day in calendarDays"
          :key="`${day.date.toISOString()}`"
          @click="selectDate(day.date)"
          :class="[
            'calendar-day relative p-3 min-h-[80px] rounded-lg border transition-all',
            day.isCurrentMonth
              ? 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              : 'bg-gray-50 border-gray-100 text-gray-400',
            isSelectedDate(day.date)
              ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500'
              : '',
            isToday(day.date) && !isSelectedDate(day.date)
              ? 'border-blue-400 font-semibold'
              : ''
          ]"
        >
          <div class="flex flex-col items-start h-full">
            <span
              :class="[
                'text-sm',
                isToday(day.date) ? 'text-blue-600 font-bold' : '',
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              ]"
            >
              {{ day.date.getDate() }}
            </span>
            
            <!-- Event Indicators -->
            <div v-if="day.eventCount > 0" class="mt-auto flex flex-wrap gap-1">
              <span
                v-for="i in Math.min(day.eventCount, 3)"
                :key="i"
                class="w-1.5 h-1.5 rounded-full bg-blue-600"
              ></span>
              <span
                v-if="day.eventCount > 3"
                class="text-[10px] text-gray-500 ml-1"
              >
                +{{ day.eventCount - 3 }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  eventCount: number;
}

interface Props {
  selectedDate: Date;
  eventsByDate: Record<string, number>; // date string (YYYY-MM-DD) -> count
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:selectedDate': [date: Date];
  'monthChanged': [year: number, month: number];
}>();

const currentMonth = ref(new Date(props.selectedDate));

const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monthYearLabel = computed(() => {
  return currentMonth.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
});

const calendarDays = computed(() => {
  const days: CalendarDay[] = [];
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = firstDay.getDay();
  
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Previous month's days to fill the first week
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      isCurrentMonth: false,
      eventCount: getEventCount(date)
    });
  }
  
  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isCurrentMonth: true,
      eventCount: getEventCount(date)
    });
  }
  
  // Next month's days to fill the last week (42 total days = 6 weeks)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      eventCount: getEventCount(date)
    });
  }
  
  return days;
});

function getEventCount(date: Date): number {
  const dateKey = formatDateKey(date);
  return props.eventsByDate[dateKey] || 0;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isSelectedDate(date: Date): boolean {
  return (
    date.getDate() === props.selectedDate.getDate() &&
    date.getMonth() === props.selectedDate.getMonth() &&
    date.getFullYear() === props.selectedDate.getFullYear()
  );
}

function selectDate(date: Date) {
  emit('update:selectedDate', date);
}

function previousMonth() {
  const newDate = new Date(currentMonth.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentMonth.value = newDate;
  emit('monthChanged', newDate.getFullYear(), newDate.getMonth());
}

function nextMonth() {
  const newDate = new Date(currentMonth.value);
  newDate.setMonth(newDate.getMonth() + 1);
  currentMonth.value = newDate;
  emit('monthChanged', newDate.getFullYear(), newDate.getMonth());
}

// Watch for external changes to selectedDate
watch(() => props.selectedDate, (newDate) => {
  if (newDate.getMonth() !== currentMonth.value.getMonth() ||
      newDate.getFullYear() !== currentMonth.value.getFullYear()) {
    currentMonth.value = new Date(newDate);
  }
});
</script>

<style scoped>
.calendar-day {
  cursor: pointer;
}

.calendar-day:active {
  transform: scale(0.98);
}
</style>

