<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { pb } from '~/utils/pb';
import { alertController } from '@ionic/vue';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();
const router = useRouter();

const projectId = String(route.params.projectId);
const outpostId = String(route.params.id);
const eventId = String(route.params.eventId);

const loading = ref(true);
const error = ref('');
const event = ref<any>(null);
const project = ref<any>(null);
const canEdit = ref(false);
const canDelete = ref(false);

const formattedStartDate = computed(() => {
  if (!event.value) return '';
  
  const date = new Date(event.value.start_date);
  
  if (event.value.all_day) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
});

const formattedEndDate = computed(() => {
  if (!event.value?.end_date) return '';
  
  const date = new Date(event.value.end_date);
  
  if (event.value.all_day) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } else {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
});

const recurrenceText = computed(() => {
  if (!event.value?.recurrence_rule) return null;
  
  const rule = event.value.recurrence_rule;
  const frequency = rule.frequency?.toLowerCase();
  const interval = rule.interval || 1;
  
  let text = 'Repeats ';
  
  if (interval === 1) {
    text += frequency;
  } else {
    text += `every ${interval} ${frequency}s`;
  }
  
  if (event.value.recurrence_end_date) {
    const endDate = new Date(event.value.recurrence_end_date);
    text += ` until ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }
  
  return text;
});

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    // Fetch project
    project.value = await pb.collection('projects').getOne(projectId);
    
    // Fetch event
    event.value = await pb.collection('calendar_events').getOne(eventId, {
      expand: 'assignees,created_by',
    });
    
    // Check permissions
    const currentUser = pb.authStore.model;
    if (currentUser) {
      // User can edit if they created it or are an admin/owner
      canEdit.value = event.value.created_by === currentUser.id;
      canDelete.value = event.value.created_by === currentUser.id;
      
      // TODO: Add role-based checks for admins/owners
    }
  } catch (err: any) {
    console.error('Error loading event:', err);
    if (err.status === 404) {
      error.value = 'Event not found';
    } else if (err.status === 403) {
      error.value = 'You do not have access to this event';
    } else {
      error.value = 'Failed to load event';
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

function handleEdit() {
  // Navigate back with a query parameter to open the edit modal
  router.push({
    path: `/${outpostId}/projects/${projectId}/schedule`,
    query: { edit: eventId }
  });
}

async function handleDelete() {
  const alert = await alertController.create({
    header: 'Delete Event',
    message: 'Are you sure you want to delete this event? This action cannot be undone.',
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
            await pb.collection('calendar_events').delete(eventId);
            router.push(`/${outpostId}/projects/${projectId}/schedule`);
          } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Please try again.');
          }
        },
      },
    ],
  });

  await alert.present();
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

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="max-w-3xl mx-auto py-8 px-4">
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-12">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p class="text-gray-500 mt-4">Loading event...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {{ error }}
          </div>

          <!-- Event Details -->
          <div v-else-if="event" class="space-y-6">
            <!-- Header -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <div class="flex items-start justify-between gap-4 mb-4">
                <div class="flex-1">
                  <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ event.title }}</h1>
                  
                  <!-- Date/Time -->
                  <div class="flex items-center gap-2 text-gray-600 mb-2">
                    <Icon name="lucide:calendar" size="18px" />
                    <span>{{ formattedStartDate }}</span>
                  </div>
                  
                  <div v-if="event.end_date && !event.all_day" class="flex items-center gap-2 text-gray-600 mb-2 ml-6">
                    <span class="text-sm">to {{ formattedEndDate }}</span>
                  </div>

                  <!-- All Day Badge -->
                  <div v-if="event.all_day" class="inline-block">
                    <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      All Day
                    </span>
                  </div>
                  
                  <!-- Recurrence Info -->
                  <div v-if="recurrenceText" class="flex items-center gap-2 text-gray-600 mt-2">
                    <Icon name="lucide:repeat" size="18px" />
                    <span class="text-sm">{{ recurrenceText }}</span>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div v-if="event.description" class="mt-6 pt-6 border-t border-gray-200">
                <h3 class="text-sm font-semibold text-gray-700 mb-2">Details</h3>
                <p class="text-gray-700 whitespace-pre-wrap">{{ event.description }}</p>
              </div>

              <!-- Assignees -->
              <div
                v-if="event.expand?.assignees && event.expand.assignees.length > 0"
                class="mt-6 pt-6 border-t border-gray-200"
              >
                <h3 class="text-sm font-semibold text-gray-700 mb-3">Assigned to</h3>
                <div class="space-y-2">
                  <div
                    v-for="assignee in event.expand.assignees"
                    :key="assignee.id"
                    class="flex items-center gap-3"
                  >
                    <div
                      v-if="assignee.avatar"
                      class="w-10 h-10 rounded-full overflow-hidden bg-gray-100"
                    >
                      <img
                        :src="getAvatarUrl(assignee)"
                        :alt="assignee.name || assignee.email"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div
                      v-else
                      class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold"
                    >
                      {{ getInitials(assignee.name || assignee.email) }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ assignee.name }}</p>
                      <p class="text-sm text-gray-500">{{ assignee.email }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Created By -->
              <div v-if="event.expand?.created_by" class="mt-6 pt-6 border-t border-gray-200">
                <p class="text-sm text-gray-500">
                  Created by {{ event.expand.created_by.name || event.expand.created_by.email }}
                  on {{ new Date(event.created).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="canEdit || canDelete" class="flex gap-3">
              <button
                v-if="canEdit"
                @click="handleEdit"
                class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Icon name="lucide:edit" size="18px" class="inline mr-2 mb-[-3px]" />
                Edit Event
              </button>
              <button
                v-if="canDelete"
                @click="handleDelete"
                class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <Icon name="lucide:trash-2" size="18px" class="inline mr-2 mb-[-3px]" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

