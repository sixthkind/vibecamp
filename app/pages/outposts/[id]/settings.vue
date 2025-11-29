<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { pb } from '~/utils/pb';
import { canUserPerform, getUserRole } from '~/utils/permissions';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();
const outpostId = route.params.id as string;

const outpost = ref<any>(null);
const userRole = ref<string | null>(null);
const canManageSettings = ref(false);
const canDeleteOutpost = ref(false);

const name = ref('');
const description = ref('');
const avatar = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);

const updating = ref(false);
const deleting = ref(false);
const showDeleteConfirm = ref(false);
const error = ref('');
const success = ref('');

async function loadOutpost() {
  try {
    outpost.value = await pb.collection('outposts').getOne(outpostId);
    name.value = outpost.value.name;
    description.value = outpost.value.description || '';
    
    if (outpost.value.avatar) {
      avatarPreview.value = `${pb.baseUrl}/api/files/${outpost.value.collectionId}/${outpost.value.id}/${outpost.value.avatar}`;
    }

    userRole.value = await getUserRole(outpostId);
    canManageSettings.value = await canUserPerform('manage_settings', outpostId);
    canDeleteOutpost.value = await canUserPerform('delete_outpost', outpostId);
  } catch (err: any) {
    console.error('Error loading outpost:', err);
    error.value = 'Failed to load outpost';
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

async function updateOutpost() {
  if (!canManageSettings.value) {
    error.value = 'You do not have permission to update settings';
    return;
  }

  if (!name.value.trim()) {
    error.value = 'Outpost name is required';
    return;
  }

  updating.value = true;
  error.value = '';
  success.value = '';

  try {
    const formData = new FormData();
    formData.append('name', name.value.trim());
    formData.append('description', description.value.trim());
    
    if (avatar.value) {
      formData.append('avatar', avatar.value);
    }

    await pb.collection('outposts').update(outpostId, formData);
    success.value = 'Outpost updated successfully!';
    
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err: any) {
    console.error('Error updating outpost:', err);
    error.value = err.message || 'Failed to update outpost';
  } finally {
    updating.value = false;
  }
}

async function deleteOutpost() {
  if (!canDeleteOutpost.value) {
    error.value = 'Only the owner can delete the outpost';
    return;
  }

  deleting.value = true;
  error.value = '';

  try {
    await pb.collection('outposts').delete(outpostId);
    navigateTo('/outposts');
  } catch (err: any) {
    console.error('Error deleting outpost:', err);
    error.value = err.message || 'Failed to delete outpost';
    deleting.value = false;
    showDeleteConfirm.value = false;
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
            <NuxtLink :to="`/outposts`" class="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
              <span>←</span> Back to Outposts
            </NuxtLink>
            <h1 class="text-3xl font-bold">Outpost Settings</h1>
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
            You don't have permission to edit these settings. Only admins and owners can modify outpost settings.
          </div>

          <form @submit.prevent="updateOutpost" class="space-y-6">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                Outpost Name *
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
              <label for="avatar" class="block text-sm font-medium text-gray-700 mb-2">
                Avatar
              </label>
              <div class="flex items-center gap-4">
                <div v-if="avatarPreview" class="w-20 h-20 rounded-lg overflow-hidden">
                  <img :src="avatarPreview" alt="Avatar preview" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                  <span class="text-gray-400 text-2xl">
                    {{ name ? name.charAt(0).toUpperCase() : '?' }}
                  </span>
                </div>
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

          <div v-if="canDeleteOutpost" class="mt-12 pt-8 border-t border-gray-200">
            <h2 class="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
            <p class="text-gray-600 mb-4">
              Once you delete an outpost, there is no going back. This will permanently delete the outpost and all associated data.
            </p>
            
            <div v-if="!showDeleteConfirm">
              <button
                @click="showDeleteConfirm = true"
                class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Outpost
              </button>
            </div>

            <div v-else class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-800 font-semibold mb-4">
                Are you absolutely sure? This action cannot be undone.
              </p>
              <div class="flex gap-4">
                <button
                  @click="deleteOutpost"
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

