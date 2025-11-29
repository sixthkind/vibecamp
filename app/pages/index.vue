<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { pb } from '~/utils/pb';
import { getCurrentOutpostId, getCurrentOutpost, getUserProjects, canUserPerform } from '~/utils/permissions';

definePageMeta({
  middleware: "auth"
});

const outpost = ref<any>(null);
const projects = ref<any[]>([]);
const loading = ref(true);
const canCreateProject = ref(false);
const statusFilter = ref<string>('active'); // Default to active projects

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All Projects' },
  { value: 'archived', label: 'Archived' },
  { value: 'completed', label: 'Completed' },
];

const filteredProjects = computed(() => {
  if (statusFilter.value === 'all') {
    return projects.value;
  }
  return projects.value.filter(p => p.status === statusFilter.value);
});

async function loadData() {
  loading.value = true;
  try {
    const currentOutpostId = getCurrentOutpostId();
    
    if (!currentOutpostId) {
      // No outpost selected, redirect to outposts page
      loading.value = false;
      return;
    }

    outpost.value = await getCurrentOutpost();
    if (outpost.value) {
      projects.value = await getUserProjects(currentOutpostId);
      canCreateProject.value = await canUserPerform('create', currentOutpostId);
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    loading.value = false;
  }
}

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

function getProjectImage(project: any) {
  if (project.avatar) {
    return `${pb.baseUrl}/api/files/${project.collectionId}/${project.id}/${project.avatar}`;
  }
  return null;
}

onMounted(() => {
  loadData();
  
  // Listen for outpost changes
  window.addEventListener('outpost-changed', loadData as EventListener);
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="max-w-6xl mx-auto py-8 px-4">
          <!-- No Outpost Selected State -->
          <div v-if="!loading && !outpost" class="text-center py-20">
            <div class="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-3">Welcome to Outpost</h2>
            <p class="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by selecting an outpost from the dropdown above, or create your first one.
            </p>
            <div class="flex gap-4 justify-center">
              <NuxtLink to="/outposts">
                <button class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  View Outposts
                </button>
              </NuxtLink>
              <NuxtLink to="/create">
                <button class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Outpost
                </button>
              </NuxtLink>
            </div>
          </div>

          <!-- Dashboard with Projects -->
          <div v-else>
            <!-- Header -->
            <div class="mb-8">
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h1 class="text-3xl font-bold mb-2">{{ outpost?.name || 'Dashboard' }}</h1>
                  <p v-if="outpost?.description" class="text-gray-600 text-lg">
                    {{ outpost.description }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <NuxtLink 
                    v-if="canCreateProject && outpost"
                    :to="`/${outpost.id}/projects/create`"
                  >
                    <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      + New Project
                    </button>
                  </NuxtLink>
                  <NuxtLink 
                    v-if="outpost"
                    :to="`/${outpost.id}/projects`"
                  >
                    <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      All Projects
                    </button>
                  </NuxtLink>
                </div>
              </div>

              <!-- Status Filter -->
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="option in statusOptions"
                  :key="option.value"
                  @click="statusFilter = option.value"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    statusFilter === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-12">
              <ion-spinner></ion-spinner>
              <p class="mt-4 text-gray-600">Loading projects...</p>
            </div>

            <!-- No Projects State -->
            <div v-else-if="projects.length === 0" class="text-center py-20">
              <div class="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 mb-3">No projects yet</h2>
              <p class="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first project to start organizing work and collaborating with your team.
              </p>
              <NuxtLink 
                v-if="canCreateProject && outpost"
                :to="`/${outpost.id}/projects/create`"
              >
                <button class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Your First Project
                </button>
              </NuxtLink>
            </div>

            <!-- No Filtered Projects -->
            <div v-else-if="filteredProjects.length === 0" class="text-center py-12">
              <p class="text-gray-600">No {{ statusFilter }} projects found.</p>
            </div>

            <!-- Projects Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NuxtLink
                v-for="project in filteredProjects"
                :key="project.id"
                :to="`/${outpost.id}/projects/${project.id}`"
                class="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
              >
                <!-- Project Header with Image/Color -->
                <div 
                  v-if="project.avatar || project.color"
                  class="h-32 relative"
                  :style="project.color && !project.avatar ? { backgroundColor: project.color } : ''"
                >
                  <img 
                    v-if="project.avatar"
                    :src="getProjectImage(project)"
                    :alt="project.name"
                    class="w-full h-full object-cover"
                  />
                  <div 
                    v-else-if="project.color"
                    class="w-full h-full flex items-center justify-center text-white text-4xl font-bold"
                  >
                    {{ project.name.charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div 
                  v-else
                  class="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                >
                  <span class="text-white text-4xl font-bold">
                    {{ project.name.charAt(0).toUpperCase() }}
                  </span>
                </div>

                <!-- Project Content -->
                <div class="p-6">
                  <div class="flex items-start justify-between mb-2">
                    <h3 class="text-xl font-semibold flex-1">{{ project.name }}</h3>
                    <span 
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded capitalize',
                        getStatusColor(project.status)
                      ]"
                    >
                      {{ project.status }}
                    </span>
                  </div>
                  
                  <p v-if="project.description" class="text-gray-600 text-sm mb-4 line-clamp-2">
                    {{ project.description }}
                  </p>

                  <div class="flex items-center gap-2 text-xs text-gray-500">
                    <span class="px-2 py-1 bg-gray-100 rounded capitalize">
                      {{ project.userRole }}
                    </span>
                    <span>•</span>
                    <span>{{ new Date(project.created).toLocaleDateString() }}</span>
                  </div>
                </div>
              </NuxtLink>
            </div>

            <!-- Quick Actions Footer -->
            <div v-if="filteredProjects.length > 0" class="mt-12 pt-8 border-t border-gray-200">
              <div class="flex justify-center gap-4">
                <NuxtLink 
                  v-if="outpost"
                  :to="`/${outpost.id}/projects`"
                >
                  <button class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    View All Projects
                  </button>
                </NuxtLink>
                <NuxtLink 
                  v-if="outpost"
                  :to="`/${outpost.id}/members`"
                >
                  <button class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Manage Team
                  </button>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

