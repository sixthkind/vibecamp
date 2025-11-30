<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { pb } from '~/utils/pb';
import {
  getProjectTools,
  canUserManageTool,
  createProjectTool,
  toggleToolActive,
  deleteProjectTool,
  getToolIcon,
  getToolDescription,
} from '~/utils/tools';
import { alertController } from '@ionic/vue';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();
const router = useRouter();

const projectId = String(route.params.projectId);
const outpostId = String(route.params.id);

const loading = ref(true);
const error = ref('');
const project = ref<any>(null);
const tools = ref<any[]>([]);
const canManage = ref(false);

const availableToolTypes = [
  { value: 'chat', label: 'Chat', description: 'Real-time group chat for project communication' },
  { value: 'docs', label: 'Docs & Files', description: 'Shared documents and wikis' },
  { value: 'tasks', label: 'To-dos', description: 'Task lists and to-do items' },
  { value: 'schedule', label: 'Schedule', description: 'Project calendar and event scheduling' },
  { value: 'board', label: 'Board', description: 'Message board for announcements and updates' },
];

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    project.value = await pb.collection('projects').getOne(projectId, {
      expand: 'outpost',
    });
    
    canManage.value = await canUserManageTool(projectId);
    
    if (!canManage.value) {
      error.value = 'You do not have permission to manage tools for this project';
      return;
    }

    tools.value = await getProjectTools(projectId);
  } catch (err: any) {
    console.error('Error loading tools:', err);
    if (err.status === 404) {
      error.value = 'Project not found';
    } else if (err.status === 403) {
      error.value = 'You do not have access to this project';
    } else {
      error.value = 'Failed to load project tools';
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

async function handleToggleActive(tool: any) {
  const newStatus = !tool.active;
  const success = await toggleToolActive(tool.id, newStatus);
  
  if (success) {
    tool.active = newStatus;
  } else {
    alert('Failed to update tool status');
  }
}

async function handleAddTool() {
  const existingTypes = tools.value.map(t => t.tool_type);
  const availableTypes = availableToolTypes.filter(t => !existingTypes.includes(t.value));

  if (availableTypes.length === 0) {
    const alert = await alertController.create({
      header: 'All Tools Added',
      message: 'You have already added all available tools to this project.',
      buttons: ['OK'],
    });
    await alert.present();
    return;
  }

  const alert = await alertController.create({
    header: 'Add Tool',
    message: 'Select a tool to add to this project',
    inputs: availableTypes.map(tool => ({
      type: 'radio' as const,
      label: tool.label,
      value: tool.value,
      checked: false,
    })),
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Add',
        handler: async (selectedType) => {
          if (selectedType) {
            const toolType = availableTypes.find(t => t.value === selectedType);
            if (toolType) {
              const newTool = await createProjectTool(
                projectId,
                toolType.value,
                toolType.label,
                true
              );
              
              if (newTool) {
                tools.value.push(newTool);
              } else {
                alert('Failed to add tool');
              }
            }
          }
        },
      },
    ],
  });

  await alert.present();
}

async function handleDeleteTool(tool: any) {
  const alert = await alertController.create({
    header: 'Remove Tool',
    message: `Are you sure you want to remove "${tool.name}" from this project? This will delete all associated data.`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Remove',
        role: 'destructive',
        handler: async () => {
          const success = await deleteProjectTool(tool.id);
          if (success) {
            tools.value = tools.value.filter(t => t.id !== tool.id);
          } else {
            alert('Failed to remove tool');
          }
        },
      },
    ],
  });

  await alert.present();
}

function goBack() {
  router.push(`/${outpostId}/projects/${projectId}`);
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <Icon name="lucide:arrow-left" size="24px" />
          </ion-button>
        </ion-buttons>
        <ion-title>Manage Tools</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="canManage && !loading" @click="handleAddTool">
            <Icon name="lucide:plus" size="24px" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <CommonContainer>
        <div class="max-w-4xl mx-auto py-8 px-4">
          <div class="mb-8">
            <h1 class="text-2xl font-bold mb-2">Project Tools</h1>
            <p class="text-gray-600">{{ project?.name || 'Loading...' }}</p>
          </div>

          <div v-if="loading" class="text-center py-12">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p class="text-gray-500 mt-4">Loading tools...</p>
          </div>

          <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {{ error }}
          </div>

          <div v-else>
            <!-- Tools List -->
            <div class="space-y-4">
              <div
                v-for="tool in tools"
                :key="tool.id"
                class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-start gap-4 flex-1">
                    <div class="tool-icon">
                      <Icon :name="getToolIcon(tool.tool_type)" size="32px" class="text-blue-600" />
                    </div>
                    <div class="flex-1">
                      <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ tool.name }}</h3>
                      <p class="text-sm text-gray-600 mb-3">{{ getToolDescription(tool.tool_type) }}</p>
                      
                      <div class="flex items-center gap-2">
                        <span
                          :class="[
                            'px-3 py-1 text-xs font-medium rounded-full',
                            tool.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          ]"
                        >
                          {{ tool.active ? 'Active' : 'Inactive' }}
                        </span>
                        <span class="text-xs text-gray-500">
                          Added {{ new Date(tool.created).toLocaleDateString() }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2 ml-4">
                    <button
                      @click="handleToggleActive(tool)"
                      :class="[
                        'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                        tool.active
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      ]"
                    >
                      {{ tool.active ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button
                      @click="handleDeleteTool(tool)"
                      class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Tool Button -->
            <div v-if="tools.length > 0" class="mt-4">
              <button
                @click="handleAddTool"
                class="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Icon name="lucide:plus" size="20px" class="inline mr-2 mb-[-3px]" />
                Add Tool
              </button>
            </div>

            <!-- Empty State -->
            <div v-if="tools.length === 0" class="text-center py-12">
              <Icon name="lucide:package" size="48px" class="text-gray-300 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-gray-900 mb-2">No Tools Added</h3>
              <p class="text-gray-600 mb-6">Add tools to enable collaboration features for this project.</p>
              <button
                @click="handleAddTool"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Icon name="lucide:plus" size="20px" class="inline mr-2" />
                Add Your First Tool
              </button>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.tool-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #EFF6FF;
  border-radius: 12px;
  flex-shrink: 0;
}
</style>

