<script setup lang="ts">
import { ref } from 'vue';
import { pb } from '~/utils/pb';
import { createMembership, type Role } from '~/utils/permissions';

const props = defineProps<{
  outpostId: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const email = ref('');
const role = ref<Role>('member');
const inviting = ref(false);
const error = ref('');
const success = ref('');
const searchResults = ref<any[]>([]);
const selectedUser = ref<any>(null);
const searching = ref(false);

async function searchUsers() {
  if (!email.value.trim()) {
    searchResults.value = [];
    return;
  }

  searching.value = true;
  try {
    const users = await pb.collection('users').getFullList({
      filter: `email ~ "${email.value.trim()}"`,
      limit: 5,
    });
    searchResults.value = users;
  } catch (err) {
    console.error('Error searching users:', err);
    searchResults.value = [];
  } finally {
    searching.value = false;
  }
}

function selectUser(user: any) {
  selectedUser.value = user;
  email.value = user.email;
  searchResults.value = [];
}

async function inviteUser() {
  if (!selectedUser.value) {
    error.value = 'Please select a user from the search results';
    return;
  }

  inviting.value = true;
  error.value = '';
  success.value = '';

  try {
    await createMembership(props.outpostId, selectedUser.value.id, role.value);
    success.value = `Successfully invited ${selectedUser.value.email}!`;
    
    // Reset form
    setTimeout(() => {
      emit('close');
    }, 1500);
  } catch (err: any) {
    console.error('Error inviting user:', err);
    error.value = err.message || 'Failed to invite user';
  } finally {
    inviting.value = false;
  }
}

function close() {
  emit('close');
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>;
function handleEmailInput() {
  clearTimeout(searchTimeout);
  selectedUser.value = null;
  searchTimeout = setTimeout(() => {
    searchUsers();
  }, 300);
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-md w-full p-6 relative">
      <button
        @click="close"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 class="text-2xl font-bold mb-4">Invite Member</h2>
      <p class="text-gray-600 mb-6">
        Search for a user by email and assign them a role in this outpost.
      </p>

      <form @submit.prevent="inviteUser" class="space-y-4">
        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ error }}
        </div>

        <div v-if="success" class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {{ success }}
        </div>

        <div class="relative">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            User Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="user@example.com"
            @input="handleEmailInput"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <!-- Search Results Dropdown -->
          <div
            v-if="searchResults.length > 0"
            class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10"
          >
            <button
              v-for="user in searchResults"
              :key="user.id"
              type="button"
              @click="selectUser(user)"
              class="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
            >
              <div v-if="user.avatar" class="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  :src="`${pb.baseUrl}/api/files/_pb_users_auth_/${user.id}/${user.avatar}`"
                  :alt="user.name || user.email"
                  class="w-full h-full object-cover"
                />
              </div>
              <div v-else class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span class="text-white text-sm font-bold">
                  {{ (user.name || user.email).charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="flex-1">
                <div class="font-medium text-sm">{{ user.name || 'Unnamed User' }}</div>
                <div class="text-xs text-gray-500">{{ user.email }}</div>
              </div>
            </button>
          </div>

          <div v-if="searching" class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
            <ion-spinner class="w-5 h-5"></ion-spinner>
            <p class="text-sm text-gray-500 mt-2">Searching...</p>
          </div>
        </div>

        <div v-if="selectedUser" class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center gap-3">
            <div v-if="selectedUser.avatar" class="w-10 h-10 rounded-full overflow-hidden">
              <img 
                :src="`${pb.baseUrl}/api/files/_pb_users_auth_/${selectedUser.id}/${selectedUser.avatar}`"
                :alt="selectedUser.name || selectedUser.email"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span class="text-white font-bold">
                {{ (selectedUser.name || selectedUser.email).charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="flex-1">
              <div class="font-medium text-sm">{{ selectedUser.name || 'Unnamed User' }}</div>
              <div class="text-xs text-gray-600">{{ selectedUser.email }}</div>
            </div>
          </div>
        </div>

        <div>
          <label for="role" class="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            id="role"
            v-model="role"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="viewer">Viewer - Can view content</option>
            <option value="member">Member - Can view and create content</option>
            <option value="admin">Admin - Can manage members and settings</option>
          </select>
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="submit"
            :disabled="inviting || !selectedUser"
            class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ inviting ? 'Inviting...' : 'Invite User' }}
          </button>
          <button
            type="button"
            @click="close"
            :disabled="inviting"
            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

