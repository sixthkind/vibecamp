<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { getUserProjects, canUserPerform } from '~/utils/permissions';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const projects = ref<any[]>([]);
const outpost = ref<any>(null);
const loading = ref(true);
const canCreateProject = ref(false);
const showArchived = ref(false);

const filteredProjects = computed(() => {
  if (showArchived.value) {
    return projects.value.filter(p => p.status === 'archived');
  }
  return projects.value.filter(p => p.status === 'active');
});

async function loadData() {
  loading.value = true;
  
  try {
    const outpostId = String(route.params.id);
    outpost.value = await pb.collection('outposts').getOne(outpostId);
    projects.value = await getUserProjects(outpostId);
    canCreateProject.value = await canUserPerform('create', outpostId);
  } catch (error) {
    console.error('Error loading projects:', error);
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

function getProjectImage(project: any) {
  if (project.avatar) {
    return `${pb.baseUrl}/api/files/${project.collectionId}/${project.id}/${project.avatar}`;
  }
  return null;
}

</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="max-w-6xl mx-auto py-8 px-4">
          <div class="mb-8">
            <NuxtLink :to="`/outposts`" class="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
              <span>←</span> Back to Outposts
            </NuxtLink>
            <div class="flex justify-between items-start mb-6">
              <div>
                <h1 class="text-3xl font-bold">Projects</h1>
                <p class="text-gray-600 mt-2">
                  {{ outpost?.name || 'Loading...' }}
                </p>
              </div>
              <NuxtLink 
                v-if="canCreateProject"
                :to="`/${outpostId}/projects/create`"
              >
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Project
                </button>
              </NuxtLink>
            </div>

          </div>

          <div v-if="loading" class="text-center py-12">
            <ion-spinner></ion-spinner>
            <p class="mt-4 text-gray-600">Loading projects...</p>
          </div>

          <div v-else-if="projects.length === 0" class="text-center py-12">
            <p class="text-gray-600 mb-4">No projects yet.</p>
            <NuxtLink 
              v-if="canCreateProject"
              :to="`/${outpostId}/projects/create`"
            >
              <button class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Your First Project
              </button>
            </NuxtLink>
          </div>

          <div v-else-if="filteredProjects.length === 0" class="text-center py-12">
            <p class="text-gray-600">No {{ showArchived ? 'archived' : 'active' }} projects found.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NuxtLink
              v-for="project in filteredProjects"
              :key="project.id"
              :to="`/${outpostId}/projects/${project.id}`"
              class="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
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
          
          <!-- Show Archived Toggle -->
          <div v-if="projects.length > 0" class="mt-12 pt-8 border-t border-gray-200">
            <div class="flex justify-center">
              <button
                @click="showArchived = !showArchived"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  showArchived 
                    ? 'bg-gray-200 text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                Archived Projects
              </button>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

