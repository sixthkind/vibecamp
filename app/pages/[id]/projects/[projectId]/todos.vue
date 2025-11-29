<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { pb } from '~/utils/pb';
import { getActiveTool } from '~/utils/tools';
import { canUserPerformOnProject } from '~/utils/permissions';
import TodoContainer from '~/components/todos/TodoContainer.vue';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();
const router = useRouter();

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
    
    // Check if todos tool is active (tasks is the tool_type)
    todosTool.value = await getActiveTool(projectId, 'tasks');
    
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
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

function goBack() {
  router.push(`/${outpostId}/projects/${projectId}`);
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <Icon name="lucide:arrow-left" size="24px" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ project?.name || 'To-dos' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="text-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="text-gray-500 mt-4">Loading to-dos...</p>
        </div>
      </div>

      <div v-else-if="error" class="flex items-center justify-center h-full p-4">
        <div class="max-w-md text-center">
          <Icon name="lucide:alert-circle" size="48px" class="text-red-500 mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ error }}</h2>
          <button @click="goBack" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Project
          </button>
        </div>
      </div>

      <div v-else-if="todosTool" class="h-full">
        <TodoContainer
          :projectToolId="todosTool.id"
          :projectId="projectId"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
ion-content {
  --background: #f9fafb;
}
</style>

