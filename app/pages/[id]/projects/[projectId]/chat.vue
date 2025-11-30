<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { getActiveTool } from '~/utils/tools';
import { canUserPerformOnProject } from '~/utils/permissions';
import ChatContainer from '~/components/chat/ChatContainer.vue';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const projectId = String(route.params.projectId);
const outpostId = String(route.params.id);

const loading = ref(true);
const error = ref('');
const chatTool = ref<any>(null);
const project = ref<any>(null);
const canManage = ref(false);

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    // Fetch project
    project.value = await pb.collection('projects').getOne(projectId);
    
    // Check if chat tool is active
    chatTool.value = await getActiveTool(projectId, 'chat');
    
    if (!chatTool.value) {
      error.value = 'Chat is not available for this project';
      return;
    }

    // Check if user can manage tools
    canManage.value = await canUserPerformOnProject('manage_settings', projectId);
  } catch (err: any) {
    console.error('Error loading chat:', err);
    if (err.status === 404) {
      error.value = 'Project not found';
    } else if (err.status === 403) {
      error.value = 'You do not have access to this project';
    } else {
      error.value = 'Failed to load chat';
    }
  } finally {
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
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="text-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="text-gray-500 mt-4">Loading chat...</p>
        </div>
      </div>

      <div v-else-if="error" class="flex items-center justify-center h-full pt-4">
        <div class="max-w-md text-center">
          <Icon name="lucide:alert-circle" size="48px" class="text-red-500 mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ error }}</h2>
          <!-- <NuxtLink :to="`/${outpostId}/projects/${projectId}`">
            <button class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Project
            </button>
          </NuxtLink> -->
        </div>
      </div>

      <div v-else-if="chatTool" class="h-full">
        <ChatContainer
          :projectToolId="chatTool.id"
          :chatName="chatTool.name"
          :canManage="canManage"
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

