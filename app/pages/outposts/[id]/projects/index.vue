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
const statusFilter = ref<string>('all');

const statusOptions = [
  { value: 'all', label: 'All Projects' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
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
                  {{ outpost?.name || '' }}
                </p>
              </div>
              <NuxtLink 
                v-if="canCreateProject"
                :to="`/outposts/${outpostId}/projects/create`"
              >
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Project
                </button>
              </NuxtLink>
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

          <template v-if="loading"></template>

          <div v-else-if="projects.length === 0" class="text-center py-12">
            <p class="text-gray-600 mb-4">No projects yet.</p>
            <NuxtLink 
              v-if="canCreateProject"
              :to="`/outposts/${outpostId}/projects/create`"
            >
              <button class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Your First Project
              </button>
            </NuxtLink>
          </div>

          <div v-else-if="filteredProjects.length === 0" class="text-center py-12">
            <p class="text-gray-600">No {{ statusFilter }} projects found.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NuxtLink
              v-for="project in filteredProjects"
              :key="project.id"
              :to="`/outposts/${outpostId}/projects/${project.id}`"
              class="flex min-h-32 items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center transition-colors hover:border-gray-300"
            >
              <h3 class="text-lg font-medium text-gray-900">{{ project.name }}</h3>
            </NuxtLink>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
