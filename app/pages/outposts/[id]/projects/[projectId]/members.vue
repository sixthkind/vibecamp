<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { 
  getProjectRole,
  canUserPerformOnProject,
  getProjectMembers,
  getOutpostMembers,
  updateProjectMemberRole,
  removeProjectMember,
  createProjectMembership,
  hasHigherRole,
  type Role 
} from '~/utils/permissions';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const project = ref<any>(null);
const projectMembers = ref<any[]>([]);
const outpostMembers = ref<any[]>([]);
const userRole = ref<Role | null>(null);
const canManageMembers = ref(false);
const currentUserId = pb.authStore.record?.id;

const loading = ref(true);
const showAddModal = ref(false);
const addingMember = ref(false);
const selectedUserId = ref('');
const selectedRole = ref<Role>('member');
const error = ref('');
const success = ref('');

const availableOutpostMembers = computed(() => {
  const projectMemberIds = new Set(projectMembers.value.map(m => m.userId));
  return outpostMembers.value.filter(m => !projectMemberIds.has(m.userId));
});

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    const projectId = String(route.params.projectId);
    const outpostId = String(route.params.id);
    
    project.value = await pb.collection('projects').getOne(projectId, {
      expand: 'outpost',
    });
    projectMembers.value = await getProjectMembers(projectId);
    outpostMembers.value = await getOutpostMembers(outpostId);
    userRole.value = await getProjectRole(projectId);
    canManageMembers.value = await canUserPerformOnProject('manage_members', projectId);
  } catch (err: any) {
    console.error('Error loading data:', err);
    error.value = 'Failed to load members';
  } finally {
    loading.value = false;
  }
}

async function changeRole(membershipId: string, newRole: Role, currentRole: Role) {
  const membership = projectMembers.value.find(m => m.id === membershipId);
  if (membership?.userId === currentUserId) {
    error.value = 'You cannot change your own role';
    return;
  }

  if (userRole.value && !hasHigherRole(userRole.value, currentRole)) {
    error.value = 'You cannot modify users with equal or higher roles';
    return;
  }

  try {
    const projectId = route.params.projectId as string;
    await updateProjectMemberRole(membershipId, newRole, projectId);
    success.value = 'Role updated successfully';
    await loadData();
    
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Failed to update role';
  }
}

async function removeMemberFromProject(membershipId: string, memberUserId: string) {
  if (memberUserId === currentUserId) {
    error.value = 'You cannot remove yourself from the project';
    return;
  }

  if (!confirm('Are you sure you want to remove this member from the project?')) {
    return;
  }

  try {
    const projectId = route.params.projectId as string;
    await removeProjectMember(membershipId, projectId);
    success.value = 'Member removed successfully';
    await loadData();
    
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Failed to remove member';
  }
}

function openAddModal() {
  selectedUserId.value = '';
  selectedRole.value = 'member';
  error.value = '';
  showAddModal.value = true;
}

function closeAddModal() {
  showAddModal.value = false;
  selectedUserId.value = '';
  selectedRole.value = 'member';
}

async function addMember() {
  if (!selectedUserId.value) {
    error.value = 'Please select a user';
    return;
  }

  addingMember.value = true;
  const projectId = route.params.projectId as string;
  error.value = '';

  try {
    await createProjectMembership(projectId, selectedUserId.value, selectedRole.value);
    success.value = 'Member added successfully';
    closeAddModal();
    await loadData();
    
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Failed to add member';
  } finally {
    addingMember.value = false;
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
        <div class="max-w-4xl mx-auto py-8 px-4">
          <div class="mb-8">
            <NuxtLink :to="`/outposts/${outpostId}/projects/${projectId}`" class="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
              <span>←</span> Back to Project
            </NuxtLink>
            <div class="flex justify-between items-center">
              <div>
                <h1 class="text-3xl font-bold">Project Members</h1>
                <p class="text-gray-600 mt-2">
                  {{ project?.name || 'Loading...' }}
                </p>
              </div>
              <button
                v-if="canManageMembers"
                @click="openAddModal"
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
                    <th v-if="canManageMembers" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="member in projectMembers" :key="member.id" class="hover:bg-gray-50">
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
                        @click="removeMemberFromProject(member.id, member.userId)"
                        class="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="projectMembers.length === 0" class="text-center py-12 text-gray-500">
              No members yet
            </div>
          </div>
        </div>
      </CommonContainer>

      <!-- Add Member Modal -->
      <div 
        v-if="showAddModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="closeAddModal"
      >
        <div class="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 class="text-xl font-bold mb-4">Add Project Member</h2>
          
          <div v-if="availableOutpostMembers.length === 0" class="text-center py-4 text-gray-500">
            All outpost members are already in this project
          </div>

          <div v-else class="space-y-4">
            <div>
              <label for="user" class="block text-sm font-medium text-gray-700 mb-2">
                Select User *
              </label>
              <select
                id="user"
                v-model="selectedUserId"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a user...</option>
                <option 
                  v-for="member in availableOutpostMembers" 
                  :key="member.userId" 
                  :value="member.userId"
                >
                  {{ member.user?.name || member.user?.email }}
                </option>
              </select>
            </div>

            <div>
              <label for="role" class="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                id="role"
                v-model="selectedRole"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent capitalize"
              >
                <option value="viewer">Viewer</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="owner" v-if="userRole === 'owner'">Owner</option>
              </select>
            </div>

            <div class="flex gap-4 pt-4">
              <button
                @click="addMember"
                :disabled="addingMember || !selectedUserId"
                class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ addingMember ? 'Adding...' : 'Add Member' }}
              </button>
              <button
                @click="closeAddModal"
                :disabled="addingMember"
                class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

