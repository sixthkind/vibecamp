<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose" :initial-breakpoint="0.9" :breakpoints="[0, 0.9]">
    <ion-header>
      <ion-toolbar>
        <ion-title>Upload Files</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <Icon name="lucide:x" size="24px" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="max-w-3xl mx-auto py-6">
        <!-- Upload Area -->
        <div
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @click="triggerFileInput"
          :class="[
            'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all',
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          ]"
        >
          <Icon 
            name="lucide:upload-cloud" 
            size="64px" 
            :class="isDragging ? 'text-blue-500' : 'text-gray-400'"
            class="mx-auto mb-4"
          />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {{ isDragging ? 'Drop files here' : 'Drop files to upload' }}
          </h3>
          <p class="text-gray-600 mb-4">
            or click to browse
          </p>
          <p class="text-sm text-gray-500">
            Supports: Images, PDFs, Documents, Spreadsheets, Presentations (Max 20MB)
          </p>
        </div>

        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.zip,.rar"
          @change="handleFileSelect"
          class="hidden"
        />

        <!-- File List -->
        <div v-if="selectedFiles.length > 0" class="mt-6 space-y-3">
          <h4 class="text-sm font-semibold text-gray-900 mb-3">
            Selected Files ({{ selectedFiles.length }})
          </h4>
          
          <div
            v-for="(fileItem, index) in selectedFiles"
            :key="index"
            class="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4"
          >
            <!-- File Preview/Icon -->
            <div class="flex-shrink-0">
              <img
                v-if="fileItem.preview"
                :src="fileItem.preview"
                alt="Preview"
                class="w-16 h-16 object-cover rounded"
              />
              <div v-else class="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                <Icon :name="getFileIcon(fileItem.file)" size="32px" class="text-gray-400" />
              </div>
            </div>

            <!-- File Info -->
            <div class="flex-1 min-w-0">
              <input
                v-model="fileItem.title"
                type="text"
                placeholder="Enter file title..."
                class="w-full mb-2 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500">
                {{ fileItem.file.name }} ({{ formatFileSize(fileItem.file.size) }})
              </p>
            </div>

            <!-- Upload Progress -->
            <div v-if="fileItem.uploading" class="flex-shrink-0">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
            </div>

            <!-- Remove Button -->
            <button
              v-else
              @click="removeFile(index)"
              class="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
            >
              <Icon name="lucide:x" size="20px" />
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div v-if="selectedFiles.length > 0" class="mt-6 flex justify-end gap-3">
          <button
            @click="clearFiles"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button
            @click="handleUpload"
            :disabled="isUploading || !canUpload"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ion-spinner v-if="isUploading" name="crescent" class="w-4 h-4"></ion-spinner>
            <span>{{ isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}` }}</span>
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

interface FileItem {
  file: File;
  title: string;
  preview: string | null;
  uploading: boolean;
}

const props = defineProps<{
  isOpen: boolean;
  projectToolId: string;
  folderId: string | null;
}>();

const emit = defineEmits<{
  close: [];
  uploaded: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<FileItem[]>([]);
const isDragging = ref(false);
const isUploading = ref(false);

const canUpload = computed(() => {
  return selectedFiles.value.every(f => f.title.trim().length > 0);
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    clearFiles();
  }
});

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files) {
    addFiles(Array.from(files));
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files) {
    addFiles(Array.from(files));
  }
}

function addFiles(files: File[]) {
  files.forEach(file => {
    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      alert(`File ${file.name} is too large. Max size is 20MB.`);
      return;
    }

    const fileItem: FileItem = {
      file,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension from title
      preview: null,
      uploading: false,
    };

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileItem.preview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }

    selectedFiles.value.push(fileItem);
  });
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

function clearFiles() {
  selectedFiles.value = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

async function handleUpload() {
  if (!canUpload.value) {
    const alert = await alertController.create({
      header: 'Missing Titles',
      message: 'Please provide a title for each file.',
      buttons: ['OK'],
    });
    await alert.present();
    return;
  }

  isUploading.value = true;

  try {
    const userId = pb.authStore.record?.id;

    for (const fileItem of selectedFiles.value) {
      fileItem.uploading = true;

      const formData = new FormData();
      formData.append('project_tool', props.projectToolId);
      formData.append('type', 'file');
      formData.append('title', fileItem.title.trim());
      formData.append('file', fileItem.file);
      formData.append('created_by', userId!);
      
      if (props.folderId) {
        formData.append('folder', props.folderId);
      }

      try {
        await pb.collection('docs_items').create(formData);
      } catch (error) {
        console.error(`Error uploading ${fileItem.file.name}:`, error);
        throw error;
      }
    }

    emit('uploaded');
  } catch (error) {
    console.error('Error uploading files:', error);
    const alert = await alertController.create({
      header: 'Upload Error',
      message: 'Failed to upload some files. Please try again.',
      buttons: ['OK'],
    });
    await alert.present();
  } finally {
    isUploading.value = false;
  }
}

function handleClose() {
  if (selectedFiles.value.length > 0 && !isUploading.value) {
    alertController.create({
      header: 'Discard Files',
      message: 'Are you sure you want to discard the selected files?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Discard',
          role: 'destructive',
          handler: () => {
            emit('close');
          },
        },
      ],
    }).then(alert => alert.present());
  } else {
    emit('close');
  }
}

function getFileIcon(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  const iconMap: Record<string, string> = {
    'pdf': 'lucide:file-text',
    'doc': 'lucide:file-text',
    'docx': 'lucide:file-text',
    'txt': 'lucide:file-text',
    'rtf': 'lucide:file-text',
    'xls': 'lucide:file-spreadsheet',
    'xlsx': 'lucide:file-spreadsheet',
    'csv': 'lucide:file-spreadsheet',
    'ppt': 'lucide:file-presentation',
    'pptx': 'lucide:file-presentation',
    'zip': 'lucide:file-archive',
    'rar': 'lucide:file-archive',
  };
  
  return iconMap[ext] || 'lucide:file';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style>

