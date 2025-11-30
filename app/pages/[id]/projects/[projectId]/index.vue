<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { getProjectRole, canUserPerformOnProject } from '~/utils/permissions';
import { getActiveProjectTools, getToolIcon, getToolDescription } from '~/utils/tools';


definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const project = ref<any>(null);
const outpost = ref<any>(null);
const userRole = ref<string | null>(null);
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
    userRole.value = await getProjectRole(projectId);
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

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getProjectImage(): string | null {
  if (project.value?.avatar) {
    return `${pb.baseUrl}/api/files/${project.value.collectionId}/${project.value.id}/${project.value.avatar}`;
  }
  return null;
}

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
              <!-- <NuxtLink to="/" class="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
                <span>←</span> Back to Dashboard
              </NuxtLink> -->
              
              <!-- Project Banner -->
              <div 
                v-if="project.avatar || project.color"
                class="h-48 rounded-lg overflow-hidden mb-6 relative"
                :style="project.color && !project.avatar ? { backgroundColor: project.color } : ''"
              >
                  <img 
                    v-if="project.avatar && getProjectImage()"
                    :src="getProjectImage() || ''"
                    :alt="project.name"
                    class="w-full h-full object-cover"
                  />
                <div 
                  v-else-if="project.color"
                  class="w-full h-full flex items-center justify-center text-white text-6xl font-bold"
                >
                  {{ project.name.charAt(0).toUpperCase() }}
                </div>
              </div>

              <div class="flex justify-between items-start">
                <div>
                  <div class="flex items-center gap-3 mb-2">
                    <h1 class="text-3xl font-bold">{{ project.name }}</h1>
                    <span 
                      :class="[
                        'px-3 py-1 text-sm font-semibold rounded capitalize',
                        getStatusColor(project.status)
                      ]"
                    >
                      {{ project.status }}
                    </span>
                  </div>
                  <p v-if="project.description" class="text-gray-600 text-lg mb-2">
                    {{ project.description }}
                  </p>
                  <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span v-if="userRole" class="px-2 py-1 bg-gray-100 rounded capitalize">
                      Your role: {{ userRole }}
                    </span>
                    <span>Created {{ new Date(project.created).toLocaleDateString() }}</span>
                  </div>
                </div>
                
                <!-- <div class="flex gap-2">
                  <NuxtLink 
                    v-if="canManageSettings && outpost"
                    :to="`/${outpost.id}/projects/${project.id}/tools`"
                  >
                    <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      <Icon name="lucide:wrench" size="16px" class="inline mr-1 mb-[-2px]" />
                      Tools
                    </button>
                  </NuxtLink>
                  <NuxtLink 
                    v-if="canManageMembers && outpost"
                    :to="`/${outpost.id}/projects/${project.id}/members`"
                  >
                    <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      <Icon name="lucide:users" size="16px" class="inline mr-1 mb-[-2px]" />
                      Members
                    </button>
                  </NuxtLink>
                  <NuxtLink 
                    v-if="canManageSettings && outpost"
                    :to="`/${outpost.id}/projects/${project.id}/settings`"
                  >
                    <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Icon name="lucide:settings" size="16px" class="inline mr-1 mb-[-2px]" />
                      Settings
                    </button>
                  </NuxtLink>
                </div> -->
              </div>
            </div>

            <!-- Active Tools -->
            <div v-if="activeTools.length > 0" class="mb-8">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Active Tools</h2>
                <!-- <NuxtLink 
                  v-if="canManageSettings && outpost"
                  :to="`/${outpost.id}/projects/${project.id}/tools`"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Manage Tools →
                </NuxtLink> -->
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <NuxtLink
                  v-for="tool in activeTools"
                  :key="tool.id"
                  :to="`/${outpost.id}/projects/${project.id}/${tool.tool_type}`"
                  class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all group"
                >
                  <div class="flex items-start gap-4">
                    <div class="tool-icon-wrapper">
                      <Icon :name="getToolIcon(tool.tool_type)" size="32px" class="text-blue-600 group-hover:text-blue-700" />
                    </div>
                    <div class="flex-1">
                      <h3 class="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600">
                        {{ tool.name }}
                      </h3>
                      <p class="text-sm text-gray-600">
                        {{ getToolDescription(tool.tool_type) }}
                      </p>
                    </div>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <!-- Empty State (no tools) -->
            <div v-else class="bg-white border rounded-lg p-8">
              <div class="text-center py-12">
                <Icon name="lucide:package" size="64px" class="text-gray-300 mx-auto mb-4" />
                <h2 class="text-2xl font-semibold text-gray-900 mb-2">No Active Tools</h2>
                <p class="text-gray-600 mb-6">
                  Add tools to enable collaboration features for this project.
                </p>
                <NuxtLink 
                  v-if="canManageSettings && outpost"
                  :to="`/${outpost.id}/projects/${project.id}/tools`"
                >
                  <button class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Icon name="lucide:plus" size="20px" class="inline mr-2 mb-[-3px]" />
                    Manage Tools
                  </button>
                </NuxtLink>
              </div>
            </div>

            <!-- Quick Links -->
            <div v-if="outpost && project" class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <NuxtLink 
                v-if="canManageSettings"
                :to="`/${outpost.id}/projects/${project.id}/tools`"
                class="p-6 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div class="flex items-center gap-2 mb-2">
                  <Icon name="lucide:wrench" size="24px" class="text-gray-700" />
                  <h3 class="font-semibold text-lg">Manage Tools</h3>
                </div>
                <p class="text-gray-600 text-sm">Add or configure project tools</p>
              </NuxtLink>

              <NuxtLink 
                v-if="canManageMembers"
                :to="`/${outpost.id}/projects/${project.id}/members`"
                class="p-6 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div class="flex items-center gap-2 mb-2">
                  <Icon name="lucide:users" size="24px" class="text-gray-700" />
                  <h3 class="font-semibold text-lg">Team Members</h3>
                </div>
                <p class="text-gray-600 text-sm">Manage who has access to this project</p>
              </NuxtLink>

              <NuxtLink 
                v-if="canManageSettings"
                :to="`/${outpost.id}/projects/${project.id}/settings`"
                class="p-6 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div class="flex items-center gap-2 mb-2">
                  <Icon name="lucide:settings" size="24px" class="text-gray-700" />
                  <h3 class="font-semibold text-lg">Project Settings</h3>
                </div>
                <p class="text-gray-600 text-sm">Update project details and configuration</p>
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

.group:hover .tool-icon-wrapper {
  background-color: #DBEAFE;
}
</style>
