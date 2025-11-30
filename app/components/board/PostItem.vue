<template>
  <div
    @click="$emit('click')"
    class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
  >
    <!-- Post Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
          {{ post.title }}
        </h3>
        <div class="flex items-center gap-4 text-sm text-gray-600">
          <div class="flex items-center gap-2">
            <Icon name="lucide:user" size="14px" />
            <span>{{ getAuthorName() }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:calendar" size="14px" />
            <span>{{ formatDate(post.created) }}</span>
          </div>
        </div>
      </div>
      
      <!-- Arrow Icon -->
      <div class="ml-4">
        <Icon 
          name="lucide:chevron-right" 
          size="20px" 
          class="text-gray-400 group-hover:text-blue-600 transition-colors"
        />
      </div>
    </div>

    <!-- Post Preview (optional) -->
    <div v-if="contentPreview" class="text-sm text-gray-600 line-clamp-2 mt-2">
      {{ contentPreview }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface BoardPost {
  id: string;
  project_tool: string;
  title: string;
  content: string;
  created_by: string;
  pinned: boolean;
  created: string;
  updated: string;
  expand?: any;
}

const props = defineProps<{
  post: BoardPost;
}>();

defineEmits<{
  click: [];
}>();

function getAuthorName() {
  if (props.post?.expand?.created_by) {
    return props.post.expand.created_by.name || props.post.expand.created_by.email || 'Unknown';
  }
  return 'Unknown';
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  }
}

const contentPreview = computed(() => {
  if (!props.post.content) return '';
  
  // Strip HTML tags for preview
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = props.post.content;
  const text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Return first 150 characters
  return text.length > 150 ? text.substring(0, 150) + '...' : text;
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
