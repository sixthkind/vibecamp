<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { getActiveTool } from '~/utils/tools';
import { canUserPerformOnProject } from '~/utils/permissions';
import DocsContainer from '~/components/docs/DocsContainer.vue';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const projectId = String(route.params.projectId);
const outpostId = String(route.params.id);

const loading = ref(true);
const error = ref('');
const docsTool = ref<any>(null);
const project = ref<any>(null);
const canManage = ref(false);

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    // Fetch project
    project.value = await pb.collection('projects').getOne(projectId);
    
    // Check if docs tool is active
    docsTool.value = await getActiveTool(projectId, 'docs');
    
    if (!docsTool.value) {
      error.value = 'Docs & Files is not available for this project';
      return;
    }

    // Check if user can manage tools
    canManage.value = await canUserPerformOnProject('manage_settings', projectId);
  } catch (err: any) {
    console.error('Error loading docs & files:', err);
    if (err.status === 404) {
      error.value = 'Project not found';
    } else if (err.status === 403) {
      error.value = 'You do not have access to this project';
    } else {
      error.value = 'Failed to load docs & files';
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
            <button class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Project
            </button>
          </NuxtLink>
        </div>
      </div>

      <CommonProjectPaperStack
        v-else-if="docsTool"
        :project="project"
        :outpost-id="outpostId"
        :project-id="projectId"
      >
        <div class="content-pop-in min-h-screen">
          <DocsContainer
            :projectToolId="docsTool.id"
            :projectId="projectId"
            :canManage="canManage"
          />
        </div>
      </CommonProjectPaperStack>
    </ion-content>
  </ion-page>
</template>
