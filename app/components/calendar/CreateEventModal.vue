<template>
  <ion-modal
    :is-open="isOpen"
    @did-dismiss="closeModal"
    :initial-breakpoint="1"
    :breakpoints="[0, 1]"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ event ? 'Edit Event' : 'New Event' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">
            <Icon name="lucide:x" size="24px" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="p-6">
      <form @submit.prevent="handleSubmit" class="space-y-4 max-w-2xl mx-auto p-6">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Title <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.title"
            type="text"
            required
            placeholder="Event title"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- All Day Toggle -->
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <ion-checkbox
            v-model="formData.all_day"
            id="all-day-toggle"
            :checked="formData.all_day"
            @ion-change="formData.all_day = $event.detail.checked"
          ></ion-checkbox>
          <label for="all-day-toggle" class="text-sm font-medium text-gray-700 cursor-pointer">
            All-day event
          </label>
        </div>

        <!-- Start Date/Time -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Start {{ formData.all_day ? 'Date' : 'Date & Time' }} <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.start_date"
            :type="formData.all_day ? 'date' : 'datetime-local'"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- End Date/Time -->
        <div v-if="!formData.all_day">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            End Date & Time <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.end_date"
            type="datetime-local"
            :required="!formData.all_day"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Assignees -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Assign to
          </label>
          
          <!-- Selected members as chips -->
          <div v-if="formData.assignees.length > 0" class="flex flex-wrap gap-2 mb-2">
            <div
              v-for="assigneeId in formData.assignees"
              :key="assigneeId"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <span>{{ getMemberName(assigneeId) }}</span>
              <button
                type="button"
                @click="removeAssignee(assigneeId)"
                class="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <Icon name="lucide:x" size="14px" />
              </button>
            </div>
          </div>
          
          <!-- Dropdown to add members -->
          <select
            :value="''"
            @change="addAssignee($event)"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="" disabled>Select a member to add...</option>
            <option 
              v-for="member in availableMembers" 
              :key="member.id" 
              :value="member.id"
            >
              {{ member.name || member.email }}
            </option>
          </select>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Details
          </label>
          <textarea
            v-model="formData.description"
            rows="4"
            placeholder="Add event details..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <!-- Recurrence -->
        <div class="border-t border-gray-200 pt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Repeat
          </label>
          
          <select
            v-model="formData.recurrence_frequency"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
          >
            <option value="">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <!-- Recurrence Interval -->
          <div v-if="formData.recurrence_frequency" class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Repeat every
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="formData.recurrence_interval"
                type="number"
                min="1"
                class="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span class="text-sm text-gray-700">
                {{ formData.recurrence_frequency }}(s)
              </span>
            </div>
          </div>

          <!-- Recurrence End Date -->
          <div v-if="formData.recurrence_frequency">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              End Date (optional)
            </label>
            <input
              v-model="formData.recurrence_end_date"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Leave empty for events that repeat indefinitely
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4">
          <button
            type="button"
            @click="closeModal"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Saving...' : event ? 'Update Event' : 'Create Event' }}
          </button>
        </div>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { pb } from '~/utils/pb';

interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  all_day: boolean;
  assignees?: string[];
  recurrence_rule?: any;
  recurrence_end_date?: string;
}

interface Props {
  isOpen: boolean;
  event?: CalendarEvent | null;
  projectMembers: any[];
  defaultDate?: Date;
}

const props = withDefaults(defineProps<Props>(), {
  event: null,
  defaultDate: () => new Date()
});

const emit = defineEmits<{
  'close': [];
  'submit': [data: any];
}>();

const submitting = ref(false);

const formData = ref({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  all_day: false,
  assignees: [] as string[],
  recurrence_frequency: '',
  recurrence_interval: 1,
  recurrence_end_date: ''
});

// Store the time component when switching to all-day
const savedStartTime = ref('');
const savedEndTime = ref('');

function resetForm() {
  const defaultStartDate = props.defaultDate || new Date();
  const defaultEndDate = new Date(defaultStartDate.getTime() + 60 * 60 * 1000); // +1 hour
  
  formData.value = {
    title: '',
    description: '',
    start_date: formatDateTimeLocal(defaultStartDate),
    end_date: formatDateTimeLocal(defaultEndDate),
    all_day: false,
    assignees: [],
    recurrence_frequency: '',
    recurrence_interval: 1,
    recurrence_end_date: ''
  };
}

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadEventData() {
  if (props.event) {
    const startDate = new Date(props.event.start_date);
    const endDate = props.event.end_date ? new Date(props.event.end_date) : null;
    
    formData.value = {
      title: props.event.title,
      description: props.event.description || '',
      start_date: props.event.all_day 
        ? formatDate(startDate)
        : formatDateTimeLocal(startDate),
      end_date: endDate 
        ? (props.event.all_day ? formatDate(endDate) : formatDateTimeLocal(endDate))
        : '',
      all_day: props.event.all_day,
      assignees: props.event.assignees || [],
      recurrence_frequency: props.event.recurrence_rule?.frequency || '',
      recurrence_interval: props.event.recurrence_rule?.interval || 1,
      recurrence_end_date: props.event.recurrence_end_date || ''
    };
  } else {
    resetForm();
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadEventData();
  }
});

watch(() => props.event, () => {
  if (props.isOpen) {
    loadEventData();
  }
});

// Watch for all_day toggle to convert date formats
watch(() => formData.value.all_day, async (newAllDay, oldAllDay) => {
  if (newAllDay && !oldAllDay) {
    // Switching to all-day: save time and convert to date only
    const startDate = formData.value.start_date;
    const endDate = formData.value.end_date;
    
    if (startDate) {
      // Extract date part from datetime-local format
      const datePart = startDate.split('T')[0];
      savedStartTime.value = startDate.split('T')[1] || '09:00';
      
      // Wait for DOM to update input type to 'date' before changing value
      await nextTick();
      formData.value.start_date = datePart;
    }
    if (endDate) {
      const datePart = endDate.split('T')[0];
      savedEndTime.value = endDate.split('T')[1] || '17:00';
      
      await nextTick();
      formData.value.end_date = datePart;
    }
  } else if (!newAllDay && oldAllDay) {
    // Switching to timed: restore time
    const startDate = formData.value.start_date;
    const endDate = formData.value.end_date;
    
    // Wait for DOM to update input type to 'datetime-local' before changing value
    await nextTick();
    
    if (startDate) {
      const time = savedStartTime.value || '09:00';
      formData.value.start_date = `${startDate}T${time}`;
    }
    if (endDate) {
      const time = savedEndTime.value || '17:00';
      formData.value.end_date = `${endDate}T${time}`;
    } else if (formData.value.start_date) {
      // If no end date, set it to 1 hour after start
      const startDateTime = new Date(formData.value.start_date);
      startDateTime.setHours(startDateTime.getHours() + 1);
      formData.value.end_date = formatDateTimeLocal(startDateTime);
    }
  }
});

function closeModal() {
  emit('close');
}

async function handleSubmit() {
  submitting.value = true;
  
  try {
    const data: any = {
      title: formData.value.title,
      description: formData.value.description,
      start_date: convertToISOString(formData.value.start_date, formData.value.all_day),
      all_day: formData.value.all_day,
      assignees: formData.value.assignees,
    };

    if (!formData.value.all_day && formData.value.end_date) {
      data.end_date = convertToISOString(formData.value.end_date, false);
    }

    if (formData.value.recurrence_frequency) {
      data.recurrence_rule = {
        frequency: formData.value.recurrence_frequency,
        interval: formData.value.recurrence_interval
      };
      
      if (formData.value.recurrence_end_date) {
        data.recurrence_end_date = convertToISOString(formData.value.recurrence_end_date, true);
      }
    } else {
      data.recurrence_rule = null;
      data.recurrence_end_date = null;
    }

    emit('submit', data);
    closeModal();
  } catch (error) {
    console.error('Error submitting event:', error);
    alert('Failed to save event. Please try again.');
  } finally {
    submitting.value = false;
  }
}

function convertToISOString(dateString: string, isDateOnly: boolean): string {
  if (!dateString) return '';
  
  if (isDateOnly) {
    // For date-only inputs (YYYY-MM-DD), create a date at start of day
    const date = new Date(dateString + 'T00:00:00');
    return date.toISOString();
  } else {
    // For datetime-local inputs (YYYY-MM-DDTHH:mm), parse and convert
    const date = new Date(dateString);
    return date.toISOString();
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

// Get members that haven't been assigned yet
const availableMembers = computed(() => {
  return props.projectMembers.filter(
    member => !formData.value.assignees.includes(member.id)
  );
});

function getMemberName(memberId: string): string {
  const member = props.projectMembers.find(m => m.id === memberId);
  return member ? (member.name || member.email) : 'Unknown';
}

function addAssignee(event: Event) {
  const target = event.target as HTMLSelectElement;
  const memberId = target.value;
  
  if (memberId && !formData.value.assignees.includes(memberId)) {
    formData.value.assignees.push(memberId);
  }
  
  // Reset the select
  target.value = '';
}

function removeAssignee(memberId: string) {
  formData.value.assignees = formData.value.assignees.filter(id => id !== memberId);
}
</script>

