<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { canUserPerformOnProject } from '~/utils/permissions';
import { getActiveProjectTools, getToolIcon, getToolDescription } from '~/utils/tools';


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
const activeTools = ref<any[]>([]);

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
    
    // Load active tools
    activeTools.value = await getActiveProjectTools(projectId);
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
    <ion-content>
      <CommonContainer>
        <div class="max-w-6xl mx-auto py-4 px-4">
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

            <div v-if="activeTools.length > 0" class="mb-8">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <NuxtLink
                  v-for="tool in activeTools"
                  :key="tool.id"
                  :to="`/${outpost.id}/projects/${project.id}/${tool.tool_type}`"
                  class="group flex w-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300"
                  style="aspect-ratio: 1 / 1;"
                >
                  <div class="tool-icon-wrapper">
                    <Icon :name="getToolIcon(tool.tool_type)" size="32px" class="text-blue-600" />
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">
                      {{ tool.name }}
                    </h3>
                    <p class="text-sm text-gray-600">
                      {{ getToolDescription(tool.tool_type) }}
                    </p>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <!-- Empty State (no tools) -->
            <div v-else class="bg-white border rounded-lg p-8">
              <div class="text-center py-12">
                <Icon name="lucide:package" size="64px" class="text-gray-300 mx-auto mb-4" />
                <h2 class="text-2xl font-semibold text-gray-900 mb-2">No tools</h2>
                <p class="text-gray-600 mb-6">
                  Add tools to enable collaboration features for this project.
                </p>
              </div>
            </div>

            <div v-if="outpost && project && (canManageSettings || canManageMembers)" class="mt-10 flex justify-center text-sm">
              <NuxtLink
                :to="`/${outpost.id}/projects/${project.id}/admin`"
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
.tool-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #EFF6FF;
  border-radius: 12px;
  flex-shrink: 0;
  transition: background-color 0.2s;
}
</style>
