<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
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
const saving = ref(false);
const error = ref('');
const item = ref<any>(null);
const title = ref('');
const description = ref('');
const content = ref('');
const trixEditor = ref<any>(null);

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    // Check permissions
    const canEdit = await canUserPerformOnProject('manage_settings', projectId);
    if (!canEdit) {
      error.value = 'You do not have permission to edit this item';
      return;
    }

    // Fetch item
    item.value = await pb.collection('docs_items').getOne(itemId);
    title.value = item.value.title;
    description.value = item.value.description || '';
    content.value = item.value.content || '';
    
    // Initialize Trix editor content if it's a document
    if (item.value.type === 'document' && content.value) {
      await nextTick();
      setTimeout(() => {
        if (trixEditor.value?.editor) {
          trixEditor.value.editor.loadHTML(content.value);
        }
      }, 100);
    }
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
  router.push(`/${outpostId}/projects/${projectId}/docs/${itemId}`);
}

async function handleSave() {
  if (!title.value.trim()) {
    const alert = await alertController.create({
      header: 'Missing Title',
      message: 'Please enter a title.',
      buttons: ['OK'],
    });
    await alert.present();
    return;
  }

  saving.value = true;

  try {
    const data: any = {
      title: title.value.trim(),
      description: description.value.trim() || null,
    };
    
    // Include content if it's a document
    if (item.value.type === 'document') {
      data.content = content.value;
    }
    
    await pb.collection('docs_items').update(itemId, data);

    goBack();
  } catch (error) {
    console.error('Error saving:', error);
    const alert = await alertController.create({
      header: 'Error',
      message: 'Failed to save changes. Please try again.',
      buttons: ['OK'],
    });
    await alert.present();
  } finally {
    saving.value = false;
  }
}

function handleTrixChange(event: any) {
  content.value = event.target.innerHTML;
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
        <ion-title>Edit {{ item?.type === 'document' ? 'Document' : 'File' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleSave" :disabled="saving">
            <Icon name="lucide:check" size="24px" />
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
            Go Back
          </button>
        </div>
      </div>

      <div v-else class="max-w-3xl mx-auto py-6 px-4">
        <!-- Title Input -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="Enter title..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Description Input -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            v-model="description"
            placeholder="Add a description..."
            rows="4"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <!-- Trix Editor for Documents -->
        <div v-if="item?.type === 'document'" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <div class="trix-wrapper border border-gray-300 rounded-lg overflow-hidden">
            <input id="trix-input-edit" type="hidden" v-model="content" />
            <trix-editor 
              ref="trixEditor"
              input="trix-input-edit" 
              class="trix-content"
              @trix-change="handleTrixChange"
            ></trix-editor>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
            @click="goBack"
            class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSave"
            :disabled="!title.trim() || saving"
            class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ion-spinner v-if="saving" name="crescent" class="w-4 h-4"></ion-spinner>
            <span>{{ saving ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style>
ion-content {
  --background: #f9fafb;
}

/* Trix Editor Customization */
.trix-wrapper {
  background: white;
}

.trix-content {
  min-height: 400px;
  padding: 1rem;
  outline: none;
}

trix-toolbar {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.5rem;
}

trix-toolbar .trix-button-group {
  margin-bottom: 0;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

trix-toolbar .trix-button {
  border: none;
  background: white;
  border-right: 1px solid #e5e7eb;
}

trix-toolbar .trix-button:last-child {
  border-right: none;
}

trix-toolbar .trix-button:hover {
  background: #f3f4f6;
}

trix-toolbar .trix-button.trix-active {
  background: #dbeafe;
  color: #1e40af;
}

trix-editor {
  border: none;
}

/* Improve Trix content appearance */
.trix-content h1 {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.trix-content h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.trix-content ul, .trix-content ol {
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.trix-content blockquote {
  border-left: 4px solid #e5e7eb;
  padding-left: 1em;
  margin: 1em 0;
  color: #6b7280;
}

.trix-content pre {
  background: #f3f4f6;
  padding: 1em;
  border-radius: 0.375rem;
  overflow-x: auto;
}

.trix-content a {
  color: #2563eb;
  text-decoration: underline;
}
</style>

