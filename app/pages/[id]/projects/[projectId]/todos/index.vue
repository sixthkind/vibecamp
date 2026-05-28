<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { getActiveTool } from '~/utils/tools';
import { canUserPerformOnProject } from '~/utils/permissions';
import TodoContainer from '~/components/todos/TodoContainer.vue';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const projectId = String(route.params.projectId);
const outpostId = String(route.params.id);

const loading = ref(true);
const error = ref('');
const todosTool = ref<any>(null);
const project = ref<any>(null);
const canManage = ref(false);

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    // Fetch project
    project.value = await pb.collection('projects').getOne(projectId);
    
    // Check if todos tool is active
    todosTool.value = await getActiveTool(projectId, 'todos');
    
    if (!todosTool.value) {
      error.value = 'To-dos are not available for this project';
      return;
    }

    // Check if user can manage tools
    canManage.value = await canUserPerformOnProject('manage_settings', projectId);
  } catch (err: any) {
    console.error('Error loading todos:', err);
    if (err.status === 404) {
      error.value = 'Project not found';
    } else if (err.status === 403) {
      error.value = 'You do not have access to this project';
    } else {
      error.value = 'Failed to load to-dos';
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
        v-else-if="todosTool"
        :project="project"
        :outpost-id="outpostId"
        :project-id="projectId"
      >
        <div class="content-pop-in min-h-screen">
          <TodoContainer
            :projectToolId="todosTool.id"
            :projectId="projectId"
          />
        </div>
      </CommonProjectPaperStack>
    </ion-content>
  </ion-page>
</template>
