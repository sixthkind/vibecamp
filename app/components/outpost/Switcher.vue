<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { pb } from '~/utils/pb';
import { getUserOutposts, getCurrentOutpostId, setCurrentOutpost } from '~/utils/permissions';

const outposts = ref<any[]>([]);
const currentOutpost = ref<any>(null);
const showDropdown = ref(false);
const loading = ref(true);

async function loadOutposts() {
  loading.value = true;
  try {
    outposts.value = await getUserOutposts();
    const currentId = getCurrentOutpostId();
    
    if (currentId) {
      currentOutpost.value = outposts.value.find(o => o.id === currentId);
    }
    
    // If no current outpost but we have outposts, set the first one
    if (!currentOutpost.value && outposts.value.length > 0) {
      currentOutpost.value = outposts.value[0];
      setCurrentOutpost(currentOutpost.value.id);
    }
  } catch (error) {
    console.error('Error loading outposts:', error);
  } finally {
    loading.value = false;
  }
}

function selectOutpost(outpost: any) {
  currentOutpost.value = outpost;
  setCurrentOutpost(outpost.id);
  showDropdown.value = false;
  
  // Reload the page to refresh data for the new outpost
  window.location.reload();
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

function handleOutpostChange(event: CustomEvent) {
  loadOutposts();
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.outpost-switcher')) {
    showDropdown.value = false;
  }
}

onMounted(() => {
  loadOutposts();
  window.addEventListener('outpost-changed', handleOutpostChange as EventListener);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('outpost-changed', handleOutpostChange as EventListener);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="relative outpost-switcher">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      :disabled="loading"
    >
      <div v-if="loading" class="w-8 h-8 rounded bg-gray-200 animate-pulse"></div>
      <div v-else-if="currentOutpost">
        <div v-if="currentOutpost.avatar" class="w-8 h-8 rounded overflow-hidden">
          <img 
            :src="`${pb.baseUrl}/api/files/${currentOutpost.collectionId}/${currentOutpost.id}/${currentOutpost.avatar}`"
            :alt="currentOutpost.name"
            class="w-full h-full object-cover"
          />
        </div>
        <div v-else class="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span class="text-white text-sm font-bold">
            {{ currentOutpost.name.charAt(0).toUpperCase() }}
          </span>
        </div>
      </div>
      <div v-else class="w-8 h-8 rounded bg-gray-300"></div>

      <div class="text-left hidden sm:block">
        <div v-if="loading" class="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
        <div v-else-if="currentOutpost" class="font-medium text-sm">{{ currentOutpost.name }}</div>
        <div v-else class="text-sm text-gray-500">No outpost</div>
      </div>

      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <div
      v-if="showDropdown"
      class="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <div class="max-h-96 overflow-y-auto">
        <div class="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Your Outposts
          </div>
        </div>

        <div v-if="outposts.length === 0" class="px-4 py-8 text-center text-gray-500 text-sm">
          No outposts yet
        </div>

        <button
          v-for="outpost in outposts"
          :key="outpost.id"
          @click="selectOutpost(outpost)"
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          :class="{ 'bg-blue-50': outpost.id === currentOutpost?.id }"
        >
          <div v-if="outpost.avatar" class="w-10 h-10 rounded overflow-hidden flex-shrink-0">
            <img 
              :src="`${pb.baseUrl}/api/files/${outpost.collectionId}/${outpost.id}/${outpost.avatar}`"
              :alt="outpost.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div v-else class="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold">
              {{ outpost.name.charAt(0).toUpperCase() }}
            </span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm truncate">{{ outpost.name }}</div>
            <div class="text-xs text-gray-500 capitalize">{{ outpost.userRole }}</div>
          </div>

          <div v-if="outpost.id === currentOutpost?.id" class="flex-shrink-0">
            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </button>
      </div>

      <div class="border-t border-gray-200">
        <NuxtLink
          to="/outposts"
          class="block px-4 py-3 text-sm text-blue-600 hover:bg-gray-50 transition-colors"
          @click="showDropdown = false"
        >
          Manage Outposts
        </NuxtLink>
        <NuxtLink
          to="/create"
          class="block px-4 py-3 text-sm text-blue-600 hover:bg-gray-50 transition-colors font-medium"
          @click="showDropdown = false"
        >
          + Create New Outpost
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

