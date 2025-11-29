<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { canUserPerform, getCurrentOutpostId } from '~/utils/permissions';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const outpost = ref<any>(null);
const name = ref('');
const description = ref('');
const status = ref('active');
const color = ref('#3B82F6'); // Default blue color
const avatar = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);
const creating = ref(false);
const error = ref('');
const canCreate = ref(false);

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'completed', label: 'Completed' },
];

async function loadOutpost() {
  error.value = '';
  
  try {
    const outpostId = String(route.params.id || getCurrentOutpostId() || '');
    outpost.value = await pb.collection('outposts').getOne(outpostId);
    canCreate.value = await canUserPerform('create', outpostId);
    
    if (!canCreate.value) {
      error.value = 'You do not have permission to create projects in this outpost';
    }
  } catch (err: any) {
    console.error('Error loading outpost:', err);
    if (err.status === 404) {
      error.value = 'Outpost not found';
    } else if (err.status === 403) {
      error.value = 'You do not have access to this outpost';
    } else {
      error.value = `Failed to load outpost: ${err.message || 'Unknown error'}`;
    }
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

async function createProject() {
  if (!name.value.trim()) {
    error.value = 'Project name is required';
    return;
  }

  if (!canCreate.value) {
    error.value = 'You do not have permission to create projects';
    return;
  }

  creating.value = true;
  const outpostId = String(route.params.id || getCurrentOutpostId() || '');
  error.value = '';

  try {
    const userId = pb.authStore.record?.id;
    
    const formData = new FormData();
    formData.append('outpost', outpostId);
    formData.append('name', name.value.trim());
    formData.append('status', status.value);
    
    if (description.value.trim()) {
      formData.append('description', description.value.trim());
    }
    
    if (color.value && !avatar.value) {
      formData.append('color', color.value);
    }
    
    if (avatar.value) {
      formData.append('avatar', avatar.value);
    }

    const project = await pb.collection('projects').create(formData);

    // Create project membership for the creator as owner
    try {
      await pb.collection('project_memberships').create({
        project: project.id,
        user: userId,
        role: 'owner',
      });
    } catch (membershipError: any) {
      console.log('Project membership creation result:', membershipError.message);
    }

    // Navigate to the new project
    navigateTo(`/${route.params.id}/projects/${project.id}`);
  } catch (err: any) {
    console.error('Error creating project:', err);
    error.value = err.message || 'Failed to create project';
  } finally {
    creating.value = false;
  }
}

onMounted(() => {
  loadOutpost();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="max-w-2xl mx-auto py-8 px-4">
          <div class="mb-8">
            <NuxtLink to="/" class="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
              <span>←</span> Back to Dashboard
            </NuxtLink>
            <h1 class="text-3xl font-bold">Create New Project</h1>
            <p class="text-gray-600 mt-2">
              {{ outpost?.name || 'Loading...' }}
            </p>
          </div>

          <form @submit.prevent="createProject" class="space-y-6">
            <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {{ error }}
            </div>

            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                id="name"
                v-model="name"
                type="text"
                required
                placeholder="e.g., Website Redesign, Marketing Campaign"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                placeholder="What is this project about?"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>

            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                v-model="status"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
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
                      @change="handleFileChange"
                      class="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                    class="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <span class="text-sm text-gray-600">{{ color }}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-4 pt-4">
              <button
                type="submit"
                :disabled="creating || !canCreate"
                class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ creating ? 'Creating...' : 'Create Project' }}
              </button>
              <NuxtLink
                v-if="outpost"
                to="/"
                class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </NuxtLink>
            </div>
          </form>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

