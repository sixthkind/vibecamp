<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose" :initial-breakpoint="1" :breakpoints="[0, 1]">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ item ? 'Edit Document' : 'New Document' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <Icon name="lucide:x" size="24px" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="max-w-4xl mx-auto py-6">
        <!-- Title Input -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Document Title
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="Enter document title..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @keydown.enter.prevent
          />
        </div>

        <!-- Description Input -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            v-model="description"
            placeholder="Add a brief description..."
            rows="2"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <!-- Trix Editor -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <div class="trix-wrapper border border-gray-300 rounded-lg overflow-hidden">
            <input id="trix-input" type="hidden" v-model="content" />
            <trix-editor 
              ref="trixEditor"
              input="trix-input" 
              class="trix-content"
              @trix-change="handleTrixChange"
            ></trix-editor>
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
            @click="handleSave"
            :disabled="!title.trim() || isSaving"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ion-spinner v-if="isSaving" name="crescent" class="w-4 h-4"></ion-spinner>
            <span>{{ isSaving ? 'Saving...' : 'Save Document' }}</span>
          </button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
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

const props = defineProps<{
  isOpen: boolean;
  item: DocsItem | null;
  projectToolId: string;
  folderId: string | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [];
}>();

const title = ref('');
const description = ref('');
const content = ref('');
const isSaving = ref(false);
const hasUnsavedChanges = ref(false);
const trixEditor = ref<any>(null);

watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    // Reset form
    if (props.item) {
      title.value = props.item.title;
      description.value = props.item.description || '';
      content.value = props.item.content || '';
    } else {
      title.value = '';
      description.value = '';
      content.value = '';
    }
    hasUnsavedChanges.value = false;

    // Initialize Trix editor content
    await nextTick();
    if (process.client && trixEditor.value && content.value) {
      // Wait a bit for Trix to fully initialize
      setTimeout(() => {
        if (trixEditor.value?.editor) {
          trixEditor.value.editor.loadHTML(content.value);
        }
      }, 100);
    }
  }
});

watch([title, description, content], () => {
  if (props.isOpen) {
    hasUnsavedChanges.value = true;
  }
});

function handleTrixChange(event: any) {
  content.value = event.target.innerHTML;
}

async function handleClose() {
  if (hasUnsavedChanges.value) {
    const alert = await alertController.create({
      header: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to close?',
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
    });
    await alert.present();
  } else {
    emit('close');
  }
}

async function handleSave() {
  if (!title.value.trim()) {
    const alert = await alertController.create({
      header: 'Missing Title',
      message: 'Please enter a title for the document.',
      buttons: ['OK'],
    });
    await alert.present();
    return;
  }

  isSaving.value = true;

  try {
    const userId = pb.authStore.record?.id;
    
    const data: any = {
      project_tool: props.projectToolId,
      type: 'document',
      title: title.value.trim(),
      content: content.value,
      description: description.value.trim() || null,
      folder: props.folderId || null,
    };

    if (props.item) {
      // Update existing document
      await pb.collection('docs_items').update(props.item.id, data);
    } else {
      // Create new document
      data.created_by = userId;
      await pb.collection('docs_items').create(data);
    }

    hasUnsavedChanges.value = false;
    emit('save');
  } catch (error) {
    console.error('Error saving document:', error);
    const alert = await alertController.create({
      header: 'Error',
      message: 'Failed to save document. Please try again.',
      buttons: ['OK'],
    });
    await alert.present();
  } finally {
    isSaving.value = false;
  }
}

// Trix is loaded via plugin, no need for onMounted
</script>

<style>
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

