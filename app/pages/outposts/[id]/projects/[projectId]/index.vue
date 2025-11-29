<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { getProjectRole, canUserPerformOnProject } from '~/utils/permissions';


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
    case 'completed':
      return 'bg-blue-100 text-blue-800';
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
        <div class="max-w-6xl mx-auto py-8 px-4">
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
              <NuxtLink v-if="outpost" :to="`/outposts/${outpost.id}/projects`" class="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
                <span>←</span> Back to Projects
              </NuxtLink>
              
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
                
                <div class="flex gap-2">
                  <NuxtLink 
                    v-if="canManageMembers && outpost"
                    :to="`/outposts/${outpost.id}/projects/${project.id}/members`"
                  >
                    <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Members
                    </button>
                  </NuxtLink>
                  <NuxtLink 
                    v-if="canManageSettings && outpost"
                    :to="`/outposts/${outpost.id}/projects/${project.id}/settings`"
                  >
                    <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Settings
                    </button>
                  </NuxtLink>
                </div>
              </div>
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

            <!-- Quick Links -->
            <div v-if="outpost && project" class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <NuxtLink 
                v-if="canManageMembers"
                :to="`/outposts/${outpost.id}/projects/${project.id}/members`"
                class="p-6 border rounded-lg hover:shadow-md transition-shadow"
              >
                <h3 class="font-semibold text-lg mb-2">Team Members</h3>
                <p class="text-gray-600 text-sm">Manage who has access to this project</p>
              </NuxtLink>

              <NuxtLink 
                v-if="canManageSettings"
                :to="`/outposts/${outpost.id}/projects/${project.id}/settings`"
                class="p-6 border rounded-lg hover:shadow-md transition-shadow"
              >
                <h3 class="font-semibold text-lg mb-2">Project Settings</h3>
                <p class="text-gray-600 text-sm">Update project details and configuration</p>
              </NuxtLink>

              <NuxtLink 
                v-if="outpost"
                :to="`/outposts/${outpost.id}/projects`"
                class="p-6 border rounded-lg hover:shadow-md transition-shadow"
              >
                <h3 class="font-semibold text-lg mb-2">All Projects</h3>
                <p class="text-gray-600 text-sm">View all projects in this outpost</p>
              </NuxtLink>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

