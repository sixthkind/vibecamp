<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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

interface AdminLink {
  label: string;
  path: string;
}

const adminLinks = computed<AdminLink[]>(() => {
  if (!outpost.value || !project.value) {
    return [];
  }

  const links: AdminLink[] = [];

  if (canManageMembers.value) {
    links.push({
      label: 'Team members',
      path: `/outposts/${outpost.value.id}/projects/${project.value.id}/members`,
    });
  }

  if (canManageSettings.value) {
    links.push({
      label: 'Project settings',
      path: `/outposts/${outpost.value.id}/projects/${project.value.id}/settings`,
    });
  }

  return links;
});

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
      <CommonContainer>
        <div class="max-w-3xl mx-auto py-8 px-4">
          <div v-if="loading" class="text-center py-12">
            <ion-spinner></ion-spinner>
            <p class="mt-4 text-gray-600">Loading project admin...</p>
          </div>

          <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {{ error }}
          </div>

          <div v-else>
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
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
