<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { getActiveTool } from '~/utils/tools';
import { canUserPerformOnProject } from '~/utils/permissions';
import CalendarContainer from '~/components/calendar/CalendarContainer.vue';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const projectId = String(route.params.projectId);
const outpostId = String(route.params.id);

const loading = ref(true);
const error = ref('');
const scheduleTool = ref<any>(null);
const project = ref<any>(null);
const canManage = ref(false);

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    // Fetch project
    project.value = await pb.collection('projects').getOne(projectId);
    
    // Check if schedule tool is active
    scheduleTool.value = await getActiveTool(projectId, 'schedule');
    
    if (!scheduleTool.value) {
      error.value = 'Schedule is not available for this project';
      return;
    }

    // Check if user can manage tools
    canManage.value = await canUserPerformOnProject('manage_settings', projectId);
  } catch (err: any) {
    console.error('Error loading schedule:', err);
    if (err.status === 404) {
      error.value = 'Project not found';
    } else if (err.status === 403) {
      error.value = 'You do not have access to this project';
    } else {
      error.value = 'Failed to load schedule';
    }
  } finally {
    await temporaryLoadingDelay();
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">

      <CommonProjectPaperStack
        v-if="loading"
        :project="project"
        :outpost-id="outpostId"
        :project-id="projectId"
      />

      <div v-else-if="error" class="flex items-center justify-center h-full p-4">
        <div class="max-w-md text-center">
          <Icon name="lucide:alert-circle" size="48px" class="text-red-500 mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ error }}</h2>
          <NuxtLink :to="`/${outpostId}/projects/${projectId}`">
            <button class="mt-4 px-6 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100">
              Back to Project
            </button>
          </NuxtLink>
        </div>
      </div>

      <CommonProjectPaperStack
        v-else-if="scheduleTool"
        :project="project"
        :outpost-id="outpostId"
        :project-id="projectId"
      >
        <div class="content-pop-in min-h-screen">
          <CalendarContainer
            :projectToolId="scheduleTool.id"
            :projectId="projectId"
          />
        </div>
      </CommonProjectPaperStack>
    </ion-content>
  </ion-page>
</template>
