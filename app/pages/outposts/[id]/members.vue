<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { pb } from '~/utils/pb';
import { 
  canUserPerform, 
  getUserRole, 
  getOutpostMembers, 
  updateMemberRole, 
  removeMember,
  hasHigherRole,
  type Role 
} from '~/utils/permissions';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();
const outpostId = route.params.id as string;

const outpost = ref<any>(null);
const members = ref<any[]>([]);
const userRole = ref<Role | null>(null);
const canManageMembers = ref(false);
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
    canManageMembers.value = await canUserPerform('manage_members', outpostId);
  } catch (err: any) {
    console.error('Error loading data:', err);
    error.value = 'Failed to load members';
  } finally {
    loading.value = false;
  }
}

async function changeRole(membershipId: string, newRole: Role, currentRole: Role) {
  // Prevent changing own role
  const membership = members.value.find(m => m.id === membershipId);
  if (membership?.userId === currentUserId) {
    error.value = 'You cannot change your own role';
    return;
  }

  // Check if user has higher role than target
  if (userRole.value && !hasHigherRole(userRole.value, currentRole)) {
    error.value = 'You cannot modify users with equal or higher roles';
    return;
  }

  try {
    await updateMemberRole(membershipId, newRole, outpostId);
    success.value = 'Role updated successfully';
    await loadData();
    
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Failed to update role';
  }
}

async function removeMemberFromOutpost(membershipId: string, memberUserId: string) {
  // Prevent removing self
  if (memberUserId === currentUserId) {
    error.value = 'You cannot remove yourself from the outpost';
    return;
  }

  if (!confirm('Are you sure you want to remove this member from the outpost?')) {
    return;
  }

  try {
    await removeMember(membershipId, outpostId);
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
                v-if="canManageMembers"
                @click="openInviteModal"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Invite Member
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
                    <th v-if="canManageMembers" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <select
                        v-if="canManageMembers && member.userId !== currentUserId && userRole && hasHigherRole(userRole, member.role)"
                        :value="member.role"
                        @change="(e) => changeRole(member.id, (e.target as HTMLSelectElement).value as Role, member.role)"
                        class="px-3 py-1 border border-gray-300 rounded-lg text-sm capitalize focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="owner" v-if="userRole === 'owner'">Owner</option>
                      </select>
                      <span v-else class="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg capitalize inline-block">
                        {{ member.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ new Date(member.created).toLocaleDateString() }}
                    </td>
                    <td v-if="canManageMembers" class="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        v-if="member.userId !== currentUserId && userRole && hasHigherRole(userRole, member.role)"
                        @click="removeMemberFromOutpost(member.id, member.userId)"
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

