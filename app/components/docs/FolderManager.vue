<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 0.9]">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ folder ? 'Edit Folder' : 'New Folder' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <Icon name="lucide:x" size="24px" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="max-w-2xl mx-auto py-6">
        <!-- Folder Name Input -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Folder Name
          </label>
          <input
            v-model="folderName"
            type="text"
            placeholder="Enter folder name..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @keydown.enter="handleSave"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between">
          <button
            v-if="folder"
            @click="handleDelete"
            :disabled="isDeleting"
            class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ion-spinner v-if="isDeleting" name="crescent" class="w-4 h-4"></ion-spinner>
            <Icon v-else name="lucide:trash-2" size="16px" />
            <span>{{ isDeleting ? 'Deleting...' : 'Delete Folder' }}</span>
          </button>
          <div v-else></div>

          <div class="flex gap-3">
            <button
              @click="handleClose"
              class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleSave"
              :disabled="!folderName.trim() || isSaving"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ion-spinner v-if="isSaving" name="crescent" class="w-4 h-4"></ion-spinner>
              <span>{{ isSaving ? 'Saving...' : (folder ? 'Update Folder' : 'Create Folder') }}</span>
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { pb } from '~/utils/pb';
import { alertController } from '@ionic/vue';

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
  folder: DocsFolder | null;
  projectToolId: string;
  parentFolderId: string | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const folderName = ref('');
const isSaving = ref(false);
const isDeleting = ref(false);

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.folder) {
      folderName.value = props.folder.name;
    } else {
      folderName.value = '';
    }
  }
});

function handleClose() {
  emit('close');
}

async function handleSave() {
  if (!folderName.value.trim()) {
    const alert = await alertController.create({
      header: 'Missing Name',
      message: 'Please enter a name for the folder.',
      buttons: ['OK'],
    });
    await alert.present();
    return;
  }

  isSaving.value = true;

  try {
    const data: any = {
      project_tool: props.projectToolId,
      name: folderName.value.trim(),
      parent: props.parentFolderId || null,
    };

    if (props.folder) {
      // Update existing folder
      await pb.collection('docs_folders').update(props.folder.id, data);
    } else {
      // Create new folder
      await pb.collection('docs_folders').create(data);
    }

    emit('saved');
  } catch (error) {
    console.error('Error saving folder:', error);
    const alert = await alertController.create({
      header: 'Error',
      message: 'Failed to save folder. Please try again.',
      buttons: ['OK'],
    });
    await alert.present();
  } finally {
    isSaving.value = false;
  }
}

async function handleDelete() {
  if (!props.folder) return;

  // Check if folder contains items or subfolders
  try {
    const items = await pb.collection('docs_items').getList(1, 1, {
      filter: `folder = "${props.folder.id}"`,
    });

    const subfolders = await pb.collection('docs_folders').getList(1, 1, {
      filter: `parent = "${props.folder.id}"`,
    });

    if (items.totalItems > 0 || subfolders.totalItems > 0) {
      const alert = await alertController.create({
        header: 'Folder Not Empty',
        message: 'This folder contains items or subfolders. Please move or delete them first.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }
  } catch (error) {
    console.error('Error checking folder contents:', error);
  }

  const alert = await alertController.create({
    header: 'Delete Folder',
    message: `Are you sure you want to delete the folder "${props.folder.name}"?`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          isDeleting.value = true;
          try {
            await pb.collection('docs_folders').delete(props.folder!.id);
            emit('saved');
          } catch (error) {
            console.error('Error deleting folder:', error);
            const errorAlert = await alertController.create({
              header: 'Error',
              message: 'Failed to delete folder. Please try again.',
              buttons: ['OK'],
            });
            await errorAlert.present();
          } finally {
            isDeleting.value = false;
          }
        },
      },
    ],
  });
  await alert.present();
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style>

