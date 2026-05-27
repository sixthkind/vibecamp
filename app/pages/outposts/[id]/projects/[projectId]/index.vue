<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { canUserPerformOnProject } from '~/utils/permissions';


definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const project = ref<any>(null);
const outpost = ref<any>(null);
const canManageSettings = ref(false);
const canManageMembers = ref(false);
const loading = ref(true);
const error = ref('');

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    const projectId = String(route.params.projectId);
    
    project.value = await pb.collection('projects').getOne(projectId, {
      expand: 'outpost',
    });
    outpost.value = project.value.expand?.outpost;
    canManageSettings.value = await canUserPerformOnProject('manage_settings', projectId);
    canManageMembers.value = await canUserPerformOnProject('manage_members', projectId);
  } catch (err: any) {
    console.error('Error loading project:', err);
    error.value = 'Failed to load project';
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
    <ion-content class="project-paper-page">
      <CommonContainer>
        <div class="project-paper max-w-6xl mx-auto min-h-screen rounded-t-3xl px-6 py-8 sm:px-8">
          <div v-if="loading" class="text-center py-12">
            <ion-spinner></ion-spinner>
            <p class="mt-4 text-gray-600">Loading project...</p>
          </div>

          <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {{ error }}
          </div>

          <div v-else>
            <!-- Header -->
            <div class="mb-8">
              <h1 class="text-3xl font-semibold text-gray-600">{{ project.name }}</h1>
            </div>

            <!-- Main Content Area -->
            <div class="bg-white border rounded-lg p-8">
              <div class="text-center py-12">
                <div class="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 class="text-2xl font-semibold text-gray-900 mb-2">Project Ready</h2>
                <p class="text-gray-600 mb-6">
                  This project is set up and ready to go. Tools and features will be added here soon.
                </p>
                <div class="text-sm text-gray-500">
                  <p>In the future, this page will contain:</p>
                  <ul class="mt-2 space-y-1">
                    <li>• Message boards for team discussions</li>
                    <li>• To-do lists and task management</li>
                    <li>• File sharing and documents</li>
                    <li>• Schedule and calendar</li>
                    <li>• And more collaboration tools</li>
                  </ul>
                </div>
              </div>
            </div>

            <div v-if="outpost && project && (canManageSettings || canManageMembers)" class="mt-10 flex justify-center text-sm">
              <NuxtLink
                :to="`/outposts/${outpost.id}/projects/${project.id}/admin`"
                class="text-gray-600 hover:text-gray-900"
              >
                Project admin
              </NuxtLink>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

<style scoped>
ion-content.project-paper-page {
  --background: #f3f4f6;
}

.project-paper {
  background: #fbfaf7;
}
</style>
