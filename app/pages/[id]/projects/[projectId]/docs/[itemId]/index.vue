<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { pb } from '~/utils/pb';
import { canUserPerformOnProject } from '~/utils/permissions';
import { alertController } from '@ionic/vue';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();
const router = useRouter();

const projectId = String(route.params.projectId);
const outpostId = String(route.params.id);
const itemId = String(route.params.itemId);

const loading = ref(true);
const error = ref('');
const item = ref<any>(null);
const project = ref<any>(null);
const canManage = ref(false);

const isImage = ref(false);
const isVideo = ref(false);
const isPDF = ref(false);
const showDetails = ref(false);

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    // Fetch project
    project.value = await pb.collection('projects').getOne(projectId);
    
    // Fetch item
    item.value = await pb.collection('docs_items').getOne(itemId, {
      expand: 'created_by',
    });

    // Determine file type
    if (item.value.type === 'file' && item.value.file) {
      const ext = getFileExtension().toLowerCase();
      isImage.value = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
      isVideo.value = ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
      isPDF.value = ext === 'pdf';
    }

    // Check if user can manage
    canManage.value = await canUserPerformOnProject('manage_settings', projectId);
  } catch (err: any) {
    console.error('Error loading item:', err);
    if (err.status === 404) {
      error.value = 'Item not found';
    } else if (err.status === 403) {
      error.value = 'You do not have access to this item';
    } else {
      error.value = 'Failed to load item';
    }
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push(`/${outpostId}/projects/${projectId}/docs`);
}

function getFileUrl() {
  if (item.value?.type === 'file' && item.value.file) {
    return pb.files.getURL(item.value, item.value.file);
  }
  return '';
}

function getFileExtension() {
  if (!item.value?.file) return '';
  const parts = item.value.file.split('.');
  return parts[parts.length - 1].toUpperCase();
}

function getFileIcon() {
  const ext = getFileExtension().toLowerCase();
  
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

function getFileIconColor() {
  const ext = getFileExtension().toLowerCase();
  
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'text-blue-500';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'text-green-500';
  if (['ppt', 'pptx'].includes(ext)) return 'text-orange-500';
  if (['zip', 'rar'].includes(ext)) return 'text-purple-500';
  
  return 'text-gray-500';
}

function getCreatorName() {
  if (item.value?.expand?.created_by) {
    return item.value.expand.created_by.name || item.value.expand.created_by.email || 'Unknown';
  }
  return 'Unknown';
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function handleDownload() {
  const url = getFileUrl();
  const link = document.createElement('a');
  link.href = url;
  link.download = item.value?.title || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function handleEdit() {
  router.push(`/${outpostId}/projects/${projectId}/docs/${itemId}/edit`);
}

async function handleDelete() {
  const alert = await alertController.create({
    header: 'Delete Item',
    message: `Are you sure you want to delete "${item.value?.title}"?`,
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
            await pb.collection('docs_items').delete(itemId);
            goBack();
          } catch (error) {
            console.error('Error deleting item:', error);
            const errorAlert = await alertController.create({
              header: 'Error',
              message: 'Failed to delete item. Please try again.',
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

onMounted(() => {
  loadData();
});
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
        <ion-title>{{ item?.title || 'File Details' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleDownload" v-if="item?.type === 'file'">
            <Icon name="lucide:download" size="24px" />
          </ion-button>
          <ion-button @click="handleEdit" v-if="canManage">
            <Icon name="lucide:edit-2" size="24px" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="text-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>

      <div v-else-if="error" class="flex items-center justify-center h-full p-4">
        <div class="max-w-md text-center">
          <Icon name="lucide:alert-circle" size="48px" class="text-red-500 mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ error }}</h2>
          <button @click="goBack" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Docs & Files
          </button>
        </div>
      </div>

      <div v-else-if="item" class="max-w-5xl mx-auto py-6 px-4">
        <!-- Document Content -->
        <div v-if="item.type === 'document'" class="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ item.title }}</h1>
          <p v-if="item.description" class="text-gray-600 mb-6">{{ item.description }}</p>
          <div class="prose max-w-none" v-html="item.content"></div>
        </div>

        <!-- File Preview -->
        <div v-else class="mb-6">
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <!-- Image Preview -->
            <div v-if="isImage" class="flex items-center justify-center bg-gray-50 p-8">
              <img 
                :src="getFileUrl()" 
                :alt="item.title" 
                class="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
              />
            </div>

            <!-- Video Preview -->
            <div v-else-if="isVideo" class="flex items-center justify-center bg-gray-900 p-4">
              <video 
                :src="getFileUrl()" 
                controls 
                class="max-w-full max-h-[70vh] rounded"
              >
                Your browser does not support video playback.
              </video>
            </div>

            <!-- PDF Preview -->
            <div v-else-if="isPDF" class="h-[80vh]">
              <iframe 
                :src="getFileUrl()" 
                class="w-full h-full"
                frameborder="0"
              >
                Your browser does not support PDFs. Please download the file to view it.
              </iframe>
            </div>

            <!-- Other Files - Icon and Info -->
            <div v-else class="flex flex-col items-center justify-center p-16 bg-gray-50">
              <Icon :name="getFileIcon()" size="96px" :class="getFileIconColor()" class="mb-4" />
              <p class="text-lg font-semibold text-gray-900 mb-2">{{ item.title }}</p>
              <p class="text-sm text-gray-600 mb-4">{{ getFileExtension() }} File</p>
              <button
                @click="handleDownload"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Icon name="lucide:download" size="20px" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Details Section -->
        <div class="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <button
            @click="showDetails = !showDetails"
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h3 class="text-lg font-semibold text-gray-900">Details</h3>
            <Icon 
              :name="showDetails ? 'lucide:chevron-up' : 'lucide:chevron-down'" 
              size="20px" 
              class="text-gray-500"
            />
          </button>
          
          <div 
            v-show="showDetails" 
            class="px-6 pb-6 pt-4 space-y-3 border-t border-gray-200 animated fadeInDown"
          >
            <div class="flex items-start gap-3">
              <Icon :name="item.type === 'document' ? 'lucide:file-text' : 'lucide:file'" size="20px" class="text-gray-400 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-700">{{ item.type === 'document' ? 'Document' : 'File' }} Name</p>
                <p class="text-sm text-gray-900">{{ item.title }}</p>
              </div>
            </div>

            <div v-if="item.description" class="flex items-start gap-3">
              <Icon name="lucide:align-left" size="20px" class="text-gray-400 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-700">Description</p>
                <p class="text-sm text-gray-900">{{ item.description }}</p>
              </div>
            </div>

            <div v-if="item.type === 'file'" class="flex items-start gap-3">
              <Icon name="lucide:file-type" size="20px" class="text-gray-400 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-700">File Type</p>
                <p class="text-sm text-gray-900">{{ getFileExtension() }}</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <Icon name="lucide:user" size="20px" class="text-gray-400 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-700">Created By</p>
                <p class="text-sm text-gray-900">{{ getCreatorName() }}</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <Icon name="lucide:calendar" size="20px" class="text-gray-400 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-700">Created</p>
                <p class="text-sm text-gray-900">{{ formatDate(item.created) }}</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <Icon name="lucide:clock" size="20px" class="text-gray-400 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-700">Last Modified</p>
                <p class="text-sm text-gray-900">{{ formatDate(item.updated) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div v-if="canManage" class="flex gap-3">
          <button
            @click="handleEdit"
            class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="lucide:edit-2" size="20px" />
            <span>Edit</span>
          </button>
          <button
            @click="handleDelete"
            class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="lucide:trash-2" size="20px" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
ion-content {
  --background: #f9fafb;
}

/* Style for document content */
.prose {
  color: #374151;
  line-height: 1.75;
}

.prose h1 {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.prose h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.prose ul, .prose ol {
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.prose blockquote {
  border-left: 4px solid #e5e7eb;
  padding-left: 1em;
  margin: 1em 0;
  color: #6b7280;
}

.prose pre {
  background: #f3f4f6;
  padding: 1em;
  border-radius: 0.375rem;
  overflow-x: auto;
}

.prose a {
  color: #2563eb;
  text-decoration: underline;
}
</style>

