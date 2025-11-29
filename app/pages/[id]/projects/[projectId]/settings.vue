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
const canArchive = ref(false);
const canDeleteProject = ref(false);

const name = ref('');
const description = ref('');
const status = ref('active');
const color = ref('#3B82F6');
const avatar = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);

const updating = ref(false);
const deleting = ref(false);
const showDeleteConfirm = ref(false);
const error = ref('');
const success = ref('');

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'completed', label: 'Completed' },
];

async function loadProject() {
  try {
    const projectId = String(route.params.projectId);
    
    project.value = await pb.collection('projects').getOne(projectId, {
      expand: 'outpost',
    });
    outpost.value = project.value.expand?.outpost;
    
    name.value = project.value.name;
    description.value = project.value.description || '';
    status.value = project.value.status;
    color.value = project.value.color || '#3B82F6';
    
    if (project.value.avatar) {
      avatarPreview.value = `${pb.baseUrl}/api/files/${project.value.collectionId}/${project.value.id}/${project.value.avatar}`;
    }

    userRole.value = await getProjectRole(projectId);
    canManageSettings.value = await canUserPerformOnProject('manage_settings', projectId);
    canArchive.value = await canUserPerformOnProject('archive', projectId);
    canDeleteProject.value = await canUserPerformOnProject('delete_project', projectId);
  } catch (err: any) {
    console.error('Error loading project:', err);
    error.value = 'Failed to load project';
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    avatar.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

async function updateProject() {
  if (!canManageSettings.value) {
    error.value = 'You do not have permission to update settings';
    return;
  }

  if (!name.value.trim()) {
    error.value = 'Project name is required';
    return;
  }

  updating.value = true;
  const projectId = route.params.projectId as string;
  error.value = '';
  success.value = '';

  try {
    const formData = new FormData();
    formData.append('name', name.value.trim());
    formData.append('description', description.value.trim());
    formData.append('status', status.value);
    
    if (color.value && !avatar.value) {
      formData.append('color', color.value);
    }
    
    if (avatar.value) {
      formData.append('avatar', avatar.value);
    }

    await pb.collection('projects').update(projectId, formData);
    success.value = 'Project updated successfully!';
    
    setTimeout(() => {
      success.value = '';
    }, 3000);

    // Reload to get updated data
    await loadProject();
  } catch (err: any) {
    console.error('Error updating project:', err);
    error.value = err.message || 'Failed to update project';
  } finally {
    updating.value = false;
  }
}

async function deleteProject() {
  if (!canDeleteProject.value) {
    error.value = 'Only project owners can delete the project';
    return;
  }

  deleting.value = true;
  const projectId = route.params.projectId as string;
  const outpostId = route.params.id as string;
  error.value = '';

  try {
    await pb.collection('projects').delete(projectId);
    navigateTo(`/${outpostId}/projects`);
  } catch (err: any) {
    console.error('Error deleting project:', err);
    error.value = err.message || 'Failed to delete project';
    deleting.value = false;
    showDeleteConfirm.value = false;
  }
}

onMounted(() => {
  loadProject();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="max-w-2xl mx-auto py-8 px-4">
          <div class="mb-8">
            <NuxtLink :to="`/${outpostId}/projects/${projectId}`" class="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
              <span>←</span> Back to Project
            </NuxtLink>
            <h1 class="text-3xl font-bold">Project Settings</h1>
            <p v-if="userRole" class="text-gray-600 mt-2">
              Your role: <span class="capitalize font-medium">{{ userRole }}</span>
            </p>
          </div>

          <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {{ error }}
          </div>

          <div v-if="success" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {{ success }}
          </div>

          <div v-if="!canManageSettings" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            You don't have permission to edit these settings. Only project admins and owners can modify project settings.
          </div>

          <form @submit.prevent="updateProject" class="space-y-6">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                id="name"
                v-model="name"
                type="text"
                required
                :disabled="!canManageSettings"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                v-model="description"
                rows="3"
                :disabled="!canManageSettings"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              ></textarea>
            </div>

            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                v-model="status"
                :disabled="!canArchive"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <p v-if="!canArchive" class="mt-1 text-sm text-gray-500">
                Only admins and owners can change project status
              </p>
            </div>

            <div>
              <label for="avatar" class="block text-sm font-medium text-gray-700 mb-2">
                Project Image or Color
              </label>
              <div class="space-y-4">
                <!-- Preview -->
                <div class="flex items-center gap-4">
                  <div v-if="avatarPreview" class="w-24 h-24 rounded-lg overflow-hidden">
                    <img :src="avatarPreview" alt="Avatar preview" class="w-full h-full object-cover" />
                  </div>
                  <div 
                    v-else 
                    class="w-24 h-24 rounded-lg flex items-center justify-center text-white text-3xl font-bold"
                    :style="{ backgroundColor: color }"
                  >
                    {{ name ? name.charAt(0).toUpperCase() : '?' }}
                  </div>
                  
                  <div class="flex-1">
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      :disabled="!canManageSettings"
                      @change="handleFileChange"
                      class="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <!-- Color Picker -->
                <div v-if="!avatar" class="flex items-center gap-4">
                  <label for="color" class="text-sm font-medium text-gray-700">
                    Background Color:
                  </label>
                  <input
                    id="color"
                    v-model="color"
                    type="color"
                    :disabled="!canManageSettings"
                    class="w-16 h-10 border border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span class="text-sm text-gray-600">{{ color }}</span>
                </div>
              </div>
            </div>

            <div v-if="canManageSettings" class="flex gap-4 pt-4">
              <button
                type="submit"
                :disabled="updating"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ updating ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>

          <div v-if="canDeleteProject" class="mt-12 pt-8 border-t border-gray-200">
            <h2 class="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
            <p class="text-gray-600 mb-4">
              Once you delete a project, there is no going back. This will permanently delete the project and all associated data.
            </p>
            
            <div v-if="!showDeleteConfirm">
              <button
                @click="showDeleteConfirm = true"
                class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Project
              </button>
            </div>

            <div v-else class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-800 font-semibold mb-4">
                Are you absolutely sure? This action cannot be undone.
              </p>
              <div class="flex gap-4">
                <button
                  @click="deleteProject"
                  :disabled="deleting"
                  class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ deleting ? 'Deleting...' : 'Yes, Delete Forever' }}
                </button>
                <button
                  @click="showDeleteConfirm = false"
                  :disabled="deleting"
                  class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

