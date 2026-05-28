<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getCurrentOutpostId, getCurrentOutpost, getUserProjects, canUserPerform } from '~/utils/permissions';

definePageMeta({
  middleware: "auth"
});

const outpost = ref<any>(null);
const projects = ref<any[]>([]);
const loading = ref(true);
const canCreateProject = ref(false);

const filteredProjects = computed(() => {
  return projects.value.filter(p => p.status === 'active');
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
            </div>

            <!-- No Filtered Projects -->
            <div v-else-if="filteredProjects.length === 0" class="text-center py-12">
              <p class="text-gray-600">No active projects found.</p>
            </div>

            <!-- Projects Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NuxtLink
                v-for="project in filteredProjects"
                :key="project.id"
                :to="`/${outpost.id}/projects/${project.id}`"
                class="flex min-h-32 items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center transition-colors hover:border-gray-300"
              >
                <h3 class="text-lg font-medium text-gray-900">{{ project.name }}</h3>
              </NuxtLink>
            </div>

            <div v-if="!loading && outpost" class="mt-10 flex justify-center gap-6 text-sm">
              <NuxtLink 
                v-if="canCreateProject"
                :to="`/${outpost.id}/projects/create`"
                class="text-gray-600 hover:text-gray-900"
              >
                New project
              </NuxtLink>
              <NuxtLink 
                :to="`/${outpost.id}/admin`"
                class="text-gray-600 hover:text-gray-900"
              >
                Admin
              </NuxtLink>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
