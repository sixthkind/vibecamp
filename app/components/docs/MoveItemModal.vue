<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose" :initial-breakpoint="0.7" :breakpoints="[0, 0.7, 0.95]">
    <ion-header>
      <ion-toolbar>
        <ion-title>Move "{{ item?.title }}"</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <Icon name="lucide:x" size="24px" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="p-6">
      <div class="max-w-2xl mx-auto p-6">
        <!-- Current Location -->
        <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div class="flex items-center gap-2 text-sm text-gray-700">
            <Icon name="lucide:folder" size="16px" class="text-blue-600" />
            <span class="font-medium">Current location:</span>
            <span>{{ getCurrentLocation() }}</span>
          </div>
        </div>

        <!-- Folder Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Select destination folder
          </label>

          <!-- Root / Home option -->
          <div
            @click="selectFolder(null)"
            :class="[
              'p-4 border-2 rounded-lg cursor-pointer transition-all mb-2',
              selectedFolder === null
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
            ]"
          >
            <div class="flex items-center gap-3">
              <Icon name="lucide:home" size="24px" class="text-gray-600" />
              <div>
                <div class="font-medium text-gray-900">Home</div>
                <div class="text-sm text-gray-500">Move to the top level</div>
              </div>
              <div v-if="selectedFolder === null" class="ml-auto">
                <Icon name="lucide:check-circle" size="20px" class="text-blue-600" />
              </div>
            </div>
          </div>

          <!-- Folder List -->
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="folder in selectableFolders"
              :key="folder.id"
              @click="selectFolder(folder.id)"
              :class="[
                'p-4 border-2 rounded-lg cursor-pointer transition-all',
                selectedFolder === folder.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              ]"
            >
              <div class="flex items-center gap-3">
                <Icon name="lucide:folder" size="24px" class="text-yellow-500" />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">{{ folder.name }}</div>
                  <div class="text-sm text-gray-500">{{ getFolderPath(folder) }}</div>
                </div>
                <div v-if="selectedFolder === folder.id" class="ml-auto">
                  <Icon name="lucide:check-circle" size="20px" class="text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="selectableFolders.length === 0" class="text-center py-8">
            <Icon name="lucide:folder-open" size="48px" class="text-gray-300 mx-auto mb-3" />
            <p class="text-gray-500">No folders available</p>
            <p class="text-sm text-gray-400 mt-1">Create a folder to organize your items</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3">
          <button
            @click="handleClose"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleMove"
            :disabled="isMoving || !hasChanged"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ion-spinner v-if="isMoving" name="crescent" class="w-4 h-4"></ion-spinner>
            <Icon v-else name="lucide:folder-input" size="16px" />
            <span>{{ isMoving ? 'Moving...' : 'Move Here' }}</span>
          </button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { pb } from '~/utils/pb';
import { alertController } from '@ionic/vue';

interface DocsItem {
  id: string;
  project_tool: string;
  folder: string | null;
  type: 'document' | 'file';
  title: string;
  content?: string;
  file?: string;
  description?: string;
  created_by: string;
  position: number;
  created: string;
  updated: string;
}

interface DocsFolder {
  id: string;
  project_tool: string;
  name: string;
  parent: string | null;
  position: number;
  created: string;
  updated: string;
}

const props = defineProps<{
  isOpen: boolean;
  item: DocsItem | null;
  folders: DocsFolder[];
}>();

const emit = defineEmits<{
  close: [];
  moved: [];
}>();

const selectedFolder = ref<string | null>(null);
const isMoving = ref(false);

// Computed properties
const selectableFolders = computed(() => {
  // Return all folders (users can move items to any folder)
  return props.folders.slice().sort((a, b) => {
    // Sort folders alphabetically by name
    return a.name.localeCompare(b.name);
  });
});

const hasChanged = computed(() => {
  if (!props.item) return false;
  // Normalize empty string and null for comparison
  const currentFolder = props.item.folder || null;
  const selected = selectedFolder.value || null;
  return currentFolder !== selected;
});

// Watch for modal opening/closing
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.item) {
    // Set the current folder as selected by default
    selectedFolder.value = props.item.folder || null;
  }
});

// Methods
function selectFolder(folderId: string | null) {
  selectedFolder.value = folderId;
}

function getCurrentLocation() {
  if (!props.item) return '';
  
  const currentFolderId = props.item.folder || null;
  
  if (!currentFolderId) {
    return 'Home';
  }
  
  const folder = props.folders.find(f => f.id === currentFolderId);
  if (!folder) return 'Unknown location';
  
  return getFolderPath(folder);
}

function getFolderPath(folder: DocsFolder): string {
  const path: string[] = [];
  let currentFolder: DocsFolder | undefined = folder;
  
  // Build path from current folder to root
  while (currentFolder) {
    path.unshift(currentFolder.name);
    const parentId = currentFolder.parent;
    currentFolder = parentId ? props.folders.find(f => f.id === parentId) : undefined;
  }
  
  return path.length > 0 ? path.join(' / ') : 'Home';
}

function handleClose() {
  emit('close');
}

async function handleMove() {
  if (!props.item || !hasChanged.value) return;

  isMoving.value = true;

  try {
    // Update the item's folder field
    await pb.collection('docs_items').update(props.item.id, {
      folder: selectedFolder.value || null,
    });

    emit('moved');
  } catch (error) {
    console.error('Error moving item:', error);
    const alert = await alertController.create({
      header: 'Error',
      message: 'Failed to move item. Please try again.',
      buttons: ['OK'],
    });
    await alert.present();
  } finally {
    isMoving.value = false;
  }
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style>

