<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { pb } from '~/utils/pb';
import { 
  getUserRole, 
  getOutpostMembers, 
  removeMember,
  type Role 
} from '~/utils/permissions';
import { useRoute } from 'vue-router';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();
const outpostId = route.params.id as string;

const outpost = ref<any>(null);
const members = ref<any[]>([]);
const userRole = ref<Role | null>(null);
const isOwner = ref(false);
const currentUserId = pb.authStore.record?.id;

const loading = ref(true);
const showInviteModal = ref(false);
const error = ref('');
const success = ref('');

async function loadData() {
  loading.value = true;
  try {
    outpost.value = await pb.collection('outposts').getOne(outpostId);
    members.value = await getOutpostMembers(outpostId);
    userRole.value = await getUserRole(outpostId);
    isOwner.value = userRole.value === 'owner';
  } catch (err: any) {
    console.error('Error loading data:', err);
    error.value = 'Failed to load members';
  } finally {
    loading.value = false;
  }
}

async function removeMemberFromOutpost(memberUserId: string) {
  // Prevent removing self
  if (memberUserId === currentUserId) {
    error.value = 'You cannot remove yourself from the outpost';
    return;
  }

  // Prevent removing owner
  if (memberUserId === outpost.value?.owner) {
    error.value = 'Cannot remove the owner from the outpost';
    return;
  }

  if (!confirm('Are you sure you want to remove this member from the outpost?')) {
    return;
  }

  try {
    await removeMember(memberUserId, outpostId);
    success.value = 'Member removed successfully';
    await loadData();
    
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Failed to remove member';
  }
}

function openInviteModal() {
  showInviteModal.value = true;
}

function closeInviteModal() {
  showInviteModal.value = false;
  loadData();
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="max-w-4xl mx-auto py-8 px-4">
          <div class="mb-8">
            <NuxtLink :to="`/outposts`" class="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
              <span>←</span> Back to Outposts
            </NuxtLink>
            <div class="flex justify-between items-center">
              <div>
                <h1 class="text-3xl font-bold">Members</h1>
                <p class="text-gray-600 mt-2">
                  {{ outpost?.name || 'Loading...' }}
                </p>
              </div>
              <button
                v-if="isOwner"
                @click="openInviteModal"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Member
              </button>
            </div>
          </div>

          <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {{ error }}
          </div>

          <div v-if="success" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {{ success }}
          </div>

          <div v-if="loading" class="text-center py-12">
            <ion-spinner></ion-spinner>
            <p class="mt-4 text-gray-600">Loading members...</p>
          </div>

          <div v-else class="bg-white border rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th v-if="isOwner" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="member in members" :key="member.id" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div v-if="member.user?.avatar" class="w-10 h-10 rounded-full overflow-hidden mr-3">
                          <img 
                            :src="`${pb.baseUrl}/api/files/_pb_users_auth_/${member.user.id}/${member.user.avatar}`"
                            :alt="member.user.name || member.user.email"
                            class="w-full h-full object-cover"
                          />
                        </div>
                        <div v-else class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                          <span class="text-white font-semibold">
                            {{ (member.user?.name || member.user?.email || '?').charAt(0).toUpperCase() }}
                          </span>
                        </div>
                        <div>
                          <div class="font-medium text-gray-900">
                            {{ member.user?.name || 'Unnamed User' }}
                            <span v-if="member.userId === currentUserId" class="ml-2 text-xs text-gray-500">(You)</span>
                          </div>
                          <div class="text-sm text-gray-500">{{ member.user?.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span 
                        :class="[
                          'px-3 py-1 text-sm font-medium rounded-lg capitalize inline-block',
                          member.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        ]"
                      >
                        {{ member.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ new Date(member.created).toLocaleDateString() }}
                    </td>
                    <td v-if="isOwner" class="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        v-if="member.role !== 'owner' && member.userId !== currentUserId"
                        @click="removeMemberFromOutpost(member.userId)"
                        class="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="members.length === 0" class="text-center py-12 text-gray-500">
              No members yet
            </div>
          </div>

          <div v-if="!isOwner" class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm text-blue-700">
              <strong>Note:</strong> Only the outpost owner can add or remove members.
            </p>
          </div>
        </div>
      </CommonContainer>

      <!-- Invite Modal -->
      <OutpostInviteModal 
        v-if="showInviteModal"
        :outpost-id="outpostId"
        @close="closeInviteModal"
      />
    </ion-content>
  </ion-page>
</template>
