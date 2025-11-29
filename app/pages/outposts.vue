<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUserOutposts, setCurrentOutpost, getCurrentOutpostId } from '~/utils/permissions';

definePageMeta({
  middleware: "auth"
});

const outposts = ref<any[]>([]);
const loading = ref(true);
const currentOutpostId = ref<string | null>(null);

async function loadOutposts() {
  loading.value = true;
  try {
    outposts.value = await getUserOutposts();
    currentOutpostId.value = getCurrentOutpostId();
  } catch (error) {
    console.error('Error loading outposts:', error);
  } finally {
    loading.value = false;
  }
}

function selectOutpost(outpostId: string) {
  setCurrentOutpost(outpostId);
  currentOutpostId.value = outpostId;
  navigateTo('/');
}

onMounted(() => {
  loadOutposts();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="max-w-4xl mx-auto py-8 px-4">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold">Your Outposts</h1>
            <NuxtLink to="/create">
              <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Outpost
              </button>
            </NuxtLink>
          </div>

          <div v-if="loading" class="text-center py-12">
            <ion-spinner></ion-spinner>
            <p class="mt-4 text-gray-600">Loading your outposts...</p>
          </div>

          <div v-else-if="outposts.length === 0" class="text-center py-12">
            <p class="text-gray-600 mb-4">You don't belong to any outposts yet.</p>
            <NuxtLink to="/create">
              <button class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Your First Outpost
              </button>
            </NuxtLink>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="outpost in outposts"
              :key="outpost.id"
              class="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
              :class="{ 'ring-2 ring-blue-500': outpost.id === currentOutpostId }"
              @click="selectOutpost(outpost.id)"
            >
              <div v-if="outpost.id === currentOutpostId" class="absolute top-4 right-4">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  Active
                </span>
              </div>
              
              <div class="flex items-start gap-4">
                <div v-if="outpost.avatar" class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    :src="`${pb.baseUrl}/api/files/${outpost.collectionId}/${outpost.id}/${outpost.avatar}`"
                    :alt="outpost.name"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div v-else class="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-2xl font-bold">
                    {{ outpost.name.charAt(0).toUpperCase() }}
                  </span>
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="text-xl font-semibold mb-1">{{ outpost.name }}</h3>
                  <p v-if="outpost.description" class="text-gray-600 text-sm mb-2 line-clamp-2">
                    {{ outpost.description }}
                  </p>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded capitalize">
                      {{ outpost.userRole }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="mt-4 flex gap-2">
                <NuxtLink 
                  :to="`/${outpost.id}/settings`"
                  class="text-sm text-blue-600 hover:text-blue-800"
                  @click.stop
                >
                  Settings
                </NuxtLink>
                <NuxtLink 
                  :to="`/${outpost.id}/members`"
                  class="text-sm text-blue-600 hover:text-blue-800"
                  @click.stop
                >
                  Members
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

