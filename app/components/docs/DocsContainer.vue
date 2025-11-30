<template>
  <div class="flex flex-col h-full bg-gray-50">
    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4 pt-20">
      <div class="max-w-7xl mx-auto">
        <!-- Breadcrumb Navigation -->
        <div class="mb-4">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <button 
              @click="navigateToFolder(null)" 
              :class="['hover:text-blue-600 transition-colors', currentFolder ? '' : 'font-semibold text-blue-600']"
            >
              <Icon name="lucide:home" size="16px" class="inline" />
              <span class="ml-1">Home</span>
            </button>
            <template v-if="breadcrumbs.length > 0">
              <Icon v-for="(crumb, index) in breadcrumbs" :key="crumb.id" name="lucide:chevron-right" size="16px" />
              <button 
                v-for="(crumb, index) in breadcrumbs" 
                :key="crumb.id"
                @click="navigateToFolder(crumb.id)"
                :class="['hover:text-blue-600 transition-colors', index === breadcrumbs.length - 1 ? 'font-semibold text-blue-600' : '']"
              >
                {{ crumb.name }}
              </button>
            </template>
          </div>
        </div>

        <!-- Filter and Action Bar -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div class="flex items-center gap-2">
            <button
              @click="filterType = 'all'"
              :class="[
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filterType === 'all' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
            >
              All
            </button>
            <button
              @click="filterType = 'document'"
              :class="[
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filterType === 'document' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
            >
              Docs
            </button>
            <button
              @click="filterType = 'file'"
              :class="[
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filterType === 'file' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
            >
              Files
            </button>
          </div>
          
          <div class="flex items-center gap-2">
            <button
              @click="openNewFolderModal"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
            >
              <Icon name="lucide:folder-plus" size="18px" />
              <span class="hidden sm:inline">New Folder</span>
            </button>
            <button
              @click="openUploadModal"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
            >
              <Icon name="lucide:upload" size="18px" />
              <span class="hidden sm:inline">Upload File</span>
            </button>
            <button
              @click="openNewDocModal"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm font-medium"
            >
              <Icon name="lucide:plus" size="18px" />
              <span class="hidden sm:inline">New Doc</span>
            </button>
          </div>
        </div>
        
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-16">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="text-gray-500 mt-4">Loading...</p>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="displayedFolders.length === 0 && displayedItems.length === 0" class="flex flex-col items-center justify-center py-16">
          <Icon name="lucide:folder-open" size="64px" class="text-gray-300 mb-4" />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No items yet</h3>
          <p class="text-gray-600 mb-6">Create a document, upload a file, or organize with folders</p>
          <div class="flex gap-3">
            <button
              @click="openNewDocModal"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Icon name="lucide:plus" size="20px" />
              <span>Create Your First Doc</span>
            </button>
          </div>
        </div>
        
        <!-- Grid Layout -->
        <div v-else class="space-y-6">
          <!-- Folders -->
          <div v-if="displayedFolders.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div
              v-for="folder in displayedFolders"
              :key="folder.id"
              @click="navigateToFolder(folder.id)"
              class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group relative"
            >
              <div class="flex flex-col items-center text-center">
                <Icon name="lucide:folder" size="48px" class="text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
                <h3 class="text-sm font-semibold text-gray-900 truncate w-full">{{ folder.name }}</h3>
              </div>
              
              <!-- Actions Menu -->
              <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click.stop="openFolderMenu(folder)"
                  class="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition-colors"
                >
                  <Icon name="lucide:more-vertical" size="16px" class="text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <!-- Items (Docs & Files) -->
          <div v-if="displayedItems.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <DocItem
              v-for="item in displayedItems"
              :key="item.id"
              :item="item"
              @click="handleItemClick(item)"
              @edit="openEditModal(item)"
              @delete="confirmDeleteItem(item)"
              @move="openMoveModal(item)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <DocEditor
      :is-open="isEditorOpen"
      :item="editingItem"
      :project-tool-id="projectToolId"
      :folder-id="currentFolder"
      @close="closeEditor"
      @save="handleSave"
    />

    <FileUploader
      :is-open="isUploaderOpen"
      :project-tool-id="projectToolId"
      :folder-id="currentFolder"
      @close="closeUploader"
      @uploaded="handleUploaded"
    />

    <FolderManager
      :is-open="isFolderManagerOpen"
      :folder="managingFolder"
      :project-tool-id="projectToolId"
      :parent-folder-id="currentFolder"
      @close="closeFolderManager"
      @saved="handleFolderSaved"
    />

    <MoveItemModal
      :is-open="isMoveModalOpen"
      :item="movingItem"
      :folders="folders"
      @close="closeMoveModal"
      @moved="handleItemMoved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { alertController } from '@ionic/vue';
import DocItem from './DocItem.vue';
import DocEditor from './DocEditor.vue';
import FileUploader from './FileUploader.vue';
import FolderManager from './FolderManager.vue';
import MoveItemModal from './MoveItemModal.vue';

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
  expand?: any;
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
  projectToolId: string;
  projectId: string;
  canManage: boolean;
}>();

const route = useRoute();
const outpostId = String(route.params.id);

const isLoading = ref(true);
const items = ref<DocsItem[]>([]);
const folders = ref<DocsFolder[]>([]);
const currentFolder = ref<string | null>(null);
const filterType = ref<'all' | 'document' | 'file'>('all');

const isEditorOpen = ref(false);
const isUploaderOpen = ref(false);
const isFolderManagerOpen = ref(false);
const isMoveModalOpen = ref(false);
const editingItem = ref<DocsItem | null>(null);
const managingFolder = ref<DocsFolder | null>(null);
const movingItem = ref<DocsItem | null>(null);

// Computed
const displayedFolders = computed(() => {
  return folders.value.filter(f => {
    // Normalize empty string and null to compare properly
    const folderParent = f.parent || null;
    const current = currentFolder.value || null;
    return folderParent === current;
  });
});

const displayedItems = computed(() => {
  let filtered = items.value.filter(item => {
    // Normalize empty string and null to compare properly
    const itemFolder = item.folder || null;
    const current = currentFolder.value || null;
    return itemFolder === current;
  });
  
  if (filterType.value !== 'all') {
    filtered = filtered.filter(item => item.type === filterType.value);
  }
  
  return filtered.sort((a, b) => (a.position || 0) - (b.position || 0));
});

const breadcrumbs = computed(() => {
  if (!currentFolder.value) return [];
  
  const crumbs: DocsFolder[] = [];
  let folderId: string | null = currentFolder.value;
  
  while (folderId) {
    const folder = folders.value.find(f => f.id === folderId);
    if (!folder) break;
    crumbs.unshift(folder);
    folderId = folder.parent;
  }
  
  return crumbs;
});

// Methods
async function loadData() {
  isLoading.value = true;
  
  try {
    // Load folders
    const foldersData = await pb.collection('docs_folders').getFullList<DocsFolder>({
      filter: `project_tool = "${props.projectToolId}"`,
      sort: 'position,name',
    });
    folders.value = foldersData;

    // Load items
    const itemsData = await pb.collection('docs_items').getFullList<DocsItem>({
      filter: `project_tool = "${props.projectToolId}"`,
      sort: 'position,created',
      expand: 'created_by',
    });
    items.value = itemsData;
  } catch (error) {
    console.error('Error loading docs & files:', error);
    const errorAlert = await alertController.create({
      header: 'Error',
      message: 'Failed to load docs & files',
      buttons: ['OK'],
    });
    await errorAlert.present();
  } finally {
    isLoading.value = false;
  }
}

function navigateToFolder(folderId: string | null) {
  currentFolder.value = folderId;
}

function handleItemClick(item: DocsItem) {
  // Navigate to the item detail page
  navigateTo(`/${outpostId}/projects/${props.projectId}/docs/${item.id}`);
}

function openNewDocModal() {
  editingItem.value = null;
  isEditorOpen.value = true;
}

function openUploadModal() {
  isUploaderOpen.value = true;
}

function openNewFolderModal() {
  managingFolder.value = null;
  isFolderManagerOpen.value = true;
}

function openEditModal(item: DocsItem) {
  editingItem.value = item;
  isEditorOpen.value = true;
}

function openMoveModal(item: DocsItem) {
  movingItem.value = item;
  isMoveModalOpen.value = true;
}

function openFolderMenu(folder: DocsFolder) {
  managingFolder.value = folder;
  isFolderManagerOpen.value = true;
}

async function confirmDeleteItem(item: DocsItem) {
  const alert = await alertController.create({
    header: 'Delete Item',
    message: `Are you sure you want to delete "${item.title}"?`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          try {
            await pb.collection('docs_items').delete(item.id);
            items.value = items.value.filter(i => i.id !== item.id);
          } catch (error) {
            console.error('Error deleting item:', error);
            const errorAlert = await alertController.create({
              header: 'Error',
              message: 'Failed to delete item',
              buttons: ['OK'],
            });
            await errorAlert.present();
          }
        },
      },
    ],
  });
  await alert.present();
}

function closeEditor() {
  isEditorOpen.value = false;
  editingItem.value = null;
}

function closeUploader() {
  isUploaderOpen.value = false;
}

function closeFolderManager() {
  isFolderManagerOpen.value = false;
  managingFolder.value = null;
}

function closeMoveModal() {
  isMoveModalOpen.value = false;
  movingItem.value = null;
}

async function handleSave() {
  closeEditor();
  await loadData();
}

async function handleUploaded() {
  closeUploader();
  await loadData();
}

async function handleFolderSaved() {
  closeFolderManager();
  await loadData();
}

async function handleItemMoved() {
  closeMoveModal();
  await loadData();
}

let itemsUnsubscribe: (() => void) | null = null;
let foldersUnsubscribe: (() => void) | null = null;

onMounted(async () => {
  await loadData();
  
  // Subscribe to realtime updates
  try {
    itemsUnsubscribe = await pb.collection('docs_items').subscribe('*', (e) => {
      console.log('Docs items update:', e.action, e.record);
      if (e.record.project_tool === props.projectToolId) {
        loadData();
      }
    });
    
    foldersUnsubscribe = await pb.collection('docs_folders').subscribe('*', (e) => {
      console.log('Docs folders update:', e.action, e.record);
      if (e.record.project_tool === props.projectToolId) {
        loadData();
      }
    });
  } catch (error) {
    console.error('Error subscribing to realtime updates:', error);
  }
});

onUnmounted(() => {
  if (itemsUnsubscribe) itemsUnsubscribe();
  if (foldersUnsubscribe) foldersUnsubscribe();
});
</script>

<style scoped>
/* Additional custom styles if needed */
</style>

