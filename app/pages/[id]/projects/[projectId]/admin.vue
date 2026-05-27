<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { canUserPerformOnProject } from '~/utils/permissions';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();
const outpostId = String(route.params.id);
const projectId = String(route.params.projectId);

const project = ref<any>(null);
const outpost = ref<any>(null);
const canManageSettings = ref(false);
const canManageMembers = ref(false);
const loading = ref(true);
const error = ref('');

interface AdminLink {
  label: string;
  path: string;
}

const adminLinks = computed<AdminLink[]>(() => {
  if (!outpost.value || !project.value) {
    return [];
  }

  const links: AdminLink[] = [];

  if (canManageSettings.value) {
    links.push({
      label: 'Manage tools',
      path: `/${outpost.value.id}/projects/${project.value.id}/tools`,
    });
  }

  if (canManageMembers.value) {
    links.push({
      label: 'Team members',
      path: `/${outpost.value.id}/projects/${project.value.id}/members`,
    });
  }

  if (canManageSettings.value) {
    links.push({
      label: 'Project settings',
      path: `/${outpost.value.id}/projects/${project.value.id}/settings`,
    });
  }

  return links;
});

async function loadData() {
  loading.value = true;
  error.value = '';

  try {
    project.value = await pb.collection('projects').getOne(projectId, {
      expand: 'outpost',
    });
    outpost.value = project.value.expand?.outpost;
    canManageSettings.value = await canUserPerformOnProject('manage_settings', projectId);
    canManageMembers.value = await canUserPerformOnProject('manage_members', projectId);
  } catch (err) {
    console.error('Error loading project admin:', err);
    error.value = 'Failed to load project admin';
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
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="text-center">
          <ion-spinner></ion-spinner>
          <p class="mt-4 text-gray-600">Loading project admin...</p>
        </div>
      </div>

      <div v-else-if="error" class="flex items-center justify-center h-full p-4">
        <div class="max-w-md p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {{ error }}
        </div>
      </div>

      <CommonProjectPaperStack
        v-else
        :project="project"
        :outpost-id="outpostId"
        :project-id="projectId"
      >
        <div class="max-w-3xl mx-auto px-6 py-8">
          <h1 class="text-2xl font-semibold text-gray-900 mb-6">Project admin</h1>

          <div v-if="adminLinks.length > 0" class="divide-y divide-gray-200 border-y border-gray-200">
            <NuxtLink
              v-for="item in adminLinks"
              :key="item.path"
              :to="item.path"
              class="block py-4 text-gray-900 hover:text-gray-600"
            >
              {{ item.label }}
            </NuxtLink>
          </div>

          <p v-else class="text-gray-600">No project admin options available.</p>
        </div>
      </CommonProjectPaperStack>
    </ion-content>
  </ion-page>
</template>
