<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getProjectToolPageData } from '~/utils/tools';
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
    const data = await getProjectToolPageData(projectId, 'docs');
    project.value = data.project;
    docsTool.value = data.tool;
    canManage.value = data.canManage;
    
    if (!docsTool.value) {
      error.value = 'Docs & Files is not available for this project';
      return;
    }
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
