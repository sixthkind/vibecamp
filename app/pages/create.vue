<script setup lang="ts">
import { ref } from 'vue';
import { pb } from '~/utils/pb';
import { setCurrentOutpost } from '~/utils/permissions';

definePageMeta({
  middleware: "auth"
});

const name = ref('');
const description = ref('');
const avatar = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);
const creating = ref(false);
const error = ref('');

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

async function createOutpost() {
  if (!name.value.trim()) {
    error.value = 'Outpost name is required';
    return;
  }

  creating.value = true;
  error.value = '';

  try {
    const userId = pb.authStore.record?.id;
    console.log('Creating outpost for user:', userId);
    
    const formData = new FormData();
    formData.append('name', name.value.trim());
    formData.append('owner', userId);
    
    if (description.value.trim()) {
      formData.append('description', description.value.trim());
    }
    
    if (avatar.value) {
      formData.append('avatar', avatar.value);
    }

    console.log('Sending create request...');
    const outpost = await pb.collection('outposts').create(formData);
    console.log('Outpost created successfully:', outpost);

    // Wait for hook to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Manually create membership if hook failed
    console.log('Creating membership...');
    try {
      await pb.collection('memberships').create({
        user: userId,
        outpost: outpost.id,
        role: 'owner',
      });
      console.log('Membership created successfully');
    } catch (membershipError: any) {
      console.log('Membership creation result:', membershipError.message);
      // If it already exists or we can't create it, that's okay if we can access the outpost
    }

    // Verify we can access the outpost
    console.log('Verifying access...');
    const verifiedOutpost = await pb.collection('outposts').getOne(outpost.id);
    console.log('Access verified:', verifiedOutpost);

    // Set as current outpost
    setCurrentOutpost(outpost.id);
    console.log('Set as current outpost');

    // Navigate to home
    navigateTo('/');
  } catch (err: any) {
    console.error('Error creating outpost:', err);
    error.value = err.message || 'Failed to create outpost';
  } finally {
    creating.value = false;
  }
}
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
            <h1 class="text-3xl font-bold">Create New Outpost</h1>
            <p class="text-gray-600 mt-2">
              An outpost is your team's workspace where you can collaborate on projects.
            </p>
          </div>

          <form @submit.prevent="createOutpost" class="space-y-6">
            <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {{ error }}
            </div>

            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                Outpost Name *
              </label>
              <input
                id="name"
                v-model="name"
                type="text"
                required
                placeholder="e.g., My Team, ACME Corp"
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
                placeholder="What is this outpost for?"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  @change="handleFileChange"
                  class="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            <div class="flex gap-4 pt-4">
              <button
                type="submit"
                :disabled="creating"
                class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ creating ? 'Creating...' : 'Create Outpost' }}
              </button>
              <NuxtLink
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

