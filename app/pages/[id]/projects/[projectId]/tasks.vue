<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { getActiveTool } from '~/utils/tools';
import TasksContainer from '~/components/tasks/TasksContainer.vue';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const projectId = String(route.params.projectId);
const outpostId = String(route.params.id);

const loading = ref(true);
const error = ref('');
const tasksTool = ref<any>(null);
const project = ref<any>(null);

async function loadData() {
  loading.value = true;
  error.value = '';

  try {
    project.value = await pb.collection('projects').getOne(projectId);
    tasksTool.value = await getActiveTool(projectId, 'tasks');

    if (!tasksTool.value) {
      error.value = 'Tasks are not available for this project';
      return;
    }
  } catch (err: any) {
    console.error('Error loading tasks:', err);
    if (err.status === 404) {
      error.value = 'Project not found';
    } else if (err.status === 403) {
      error.value = 'You do not have access to this project';
    } else {
      error.value = 'Failed to load tasks';
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

      <div v-else-if="error" class="flex h-full items-center justify-center p-4">
        <div class="max-w-md text-center">
          <Icon name="lucide:alert-circle" size="48px" class="mx-auto mb-4 text-red-500" />
          <h2 class="mb-2 text-xl font-semibold text-gray-900">{{ error }}</h2>
          <NuxtLink :to="`/${outpostId}/projects/${projectId}`">
            <button class="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-6 py-2 text-gray-700 hover:bg-gray-100">
              Back to Project
            </button>
          </NuxtLink>
        </div>
      </div>

      <CommonProjectPaperStack
        v-else-if="tasksTool"
        :project="project"
        :outpost-id="outpostId"
        :project-id="projectId"
      >
        <div class="content-pop-in min-h-screen">
          <TasksContainer
            :project-tool-id="tasksTool.id"
            :project-id="projectId"
          />
        </div>
      </CommonProjectPaperStack>
    </ion-content>
  </ion-page>
</template>
