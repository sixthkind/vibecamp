<template>
  <div
    class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group relative"
    @click="$emit('click')"
  >
    <!-- Item Icon/Preview -->
    <div class="flex flex-col items-center text-center mb-3">
      <div v-if="item.type === 'document'" class="relative">
        <Icon name="lucide:file-text" size="48px" class="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
      </div>
      <div v-else-if="isImageFile" class="relative w-full h-32 mb-2 rounded overflow-hidden bg-gray-100">
        <img 
          :src="getFileUrl()" 
          :alt="item.title" 
          class="w-full h-full object-cover group-hover:scale-105 transition-transform"
          @error="handleImageError"
        />
      </div>
      <div v-else class="relative">
        <Icon :name="getFileIcon()" size="48px" :class="getFileIconColor()" class="mb-2 group-hover:scale-110 transition-transform" />
      </div>
    </div>

    <!-- Item Title -->
    <h3 class="text-sm font-semibold text-gray-900 truncate w-full mb-2" :title="item.title">
      {{ item.title }}
    </h3>

    <!-- Item Metadata -->
    <div class="text-xs text-gray-500 space-y-1">
      <div class="flex items-center gap-1">
        <Icon name="lucide:user" size="12px" />
        <span class="truncate">{{ getCreatorName() }}</span>
      </div>
      <div class="flex items-center gap-1">
        <Icon name="lucide:clock" size="12px" />
        <span>{{ formatDate(item.created) }}</span>
      </div>
      <div v-if="item.type === 'file' && item.file" class="flex items-center gap-1">
        <Icon name="lucide:file" size="12px" />
        <span>{{ getFileExtension() }}</span>
      </div>
    </div>

    <!-- Actions Menu -->
    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        @click.stop="toggleMenu"
        class="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition-colors"
      >
        <Icon name="lucide:more-vertical" size="16px" class="text-gray-600" />
      </button>
      
      <!-- Dropdown Menu -->
      <div 
        v-if="showMenu" 
        class="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
        @click.stop
      >
        <button
          @click="handleEdit"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <Icon name="lucide:edit-2" size="14px" />
          <span>Edit</span>
        </button>
        <button
          @click="handleMove"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <Icon name="lucide:folder" size="14px" />
          <span>Move</span>
        </button>
        <button
          v-if="item.type === 'file'"
          @click="handleDownload"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <Icon name="lucide:download" size="14px" />
          <span>Download</span>
        </button>
        <hr class="my-1 border-gray-200" />
        <button
          @click="handleDelete"
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        >
          <Icon name="lucide:trash-2" size="14px" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { pb } from '~/utils/pb';

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

const props = defineProps<{
  item: DocsItem;
}>();

const emit = defineEmits<{
  click: [];
  edit: [];
  delete: [];
  move: [];
}>();

const showMenu = ref(false);
const imageError = ref(false);

const isImageFile = computed(() => {
  if (props.item.type !== 'file' || !props.item.file) return false;
  const ext = getFileExtension().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
});

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function handleEdit() {
  showMenu.value = false;
  emit('edit');
}

function handleMove() {
  showMenu.value = false;
  emit('move');
}

function handleDelete() {
  showMenu.value = false;
  emit('delete');
}

function handleDownload() {
  showMenu.value = false;
  const url = getFileUrl();
  const link = document.createElement('a');
  link.href = url;
  link.download = props.item.title;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getFileUrl() {
  if (props.item.type === 'file' && props.item.file) {
    return pb.files.getURL(props.item, props.item.file);
  }
  return '';
}

function getFileExtension() {
  if (!props.item.file) return '';
  const parts = props.item.file.split('.');
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
    'jpg': 'lucide:file-image',
    'jpeg': 'lucide:file-image',
    'png': 'lucide:file-image',
    'gif': 'lucide:file-image',
    'webp': 'lucide:file-image',
    'svg': 'lucide:file-image',
  };
  
  return iconMap[ext] || 'lucide:file';
}

function getFileIconColor() {
  const ext = getFileExtension().toLowerCase();
  
  if (['pdf'].includes(ext)) return 'text-red-500';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'text-blue-500';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'text-green-500';
  if (['ppt', 'pptx'].includes(ext)) return 'text-orange-500';
  if (['zip', 'rar'].includes(ext)) return 'text-purple-500';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'text-pink-500';
  
  return 'text-gray-500';
}

function getCreatorName() {
  if (props.item.expand?.created_by) {
    return props.item.expand.created_by.name || props.item.expand.created_by.email || 'Unknown';
  }
  return 'Unknown';
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function handleImageError() {
  imageError.value = true;
}

// Close menu when clicking outside
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    showMenu.value = false;
  });
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style>

