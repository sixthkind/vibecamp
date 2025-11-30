<template>
  <div class="flex flex-col h-full bg-gray-50">
    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4 pt-20">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Message Board</h1>
            <p class="text-gray-600 text-sm mt-1">Share announcements and updates with your team</p>
          </div>
          
          <button
            @click="openNewPostModal"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm font-medium"
          >
            <Icon name="lucide:plus" size="18px" />
            <span>New Post</span>
          </button>
        </div>
        
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-16">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="text-gray-500 mt-4">Loading posts...</p>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="posts.length === 0" class="flex flex-col items-center justify-center py-16">
          <Icon name="lucide:message-circle" size="64px" class="text-gray-300 mb-4" />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
          <p class="text-gray-600 mb-6">Be the first to share an announcement or update</p>
          <button
            @click="openNewPostModal"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Icon name="lucide:plus" size="20px" />
            <span>Create Your First Post</span>
          </button>
        </div>
        
        <!-- Posts List -->
        <div v-else class="space-y-4">
          <PostItem
            v-for="post in posts"
            :key="post.id"
            :post="post"
            @click="handlePostClick(post)"
          />
        </div>
      </div>
    </div>

    <!-- Post Editor Modal -->
    <PostEditor
      :is-open="isEditorOpen"
      :post="editingPost"
      :project-tool-id="projectToolId"
      @close="closeEditor"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';
import { alertController } from '@ionic/vue';
import PostItem from './PostItem.vue';
import PostEditor from './PostEditor.vue';

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
  projectToolId: string;
  projectId: string;
  canManage: boolean;
}>();

const route = useRoute();
const outpostId = String(route.params.id);

const isLoading = ref(true);
const posts = ref<BoardPost[]>([]);
const isEditorOpen = ref(false);
const editingPost = ref<BoardPost | null>(null);

// Methods
async function loadData() {
  isLoading.value = true;
  
  try {
    // Load posts
    const postsData = await pb.collection('board_posts').getFullList<BoardPost>({
      filter: `project_tool = "${props.projectToolId}"`,
      sort: '-created',
      expand: 'created_by',
    });
    posts.value = postsData;
  } catch (error) {
    console.error('Error loading posts:', error);
    const errorAlert = await alertController.create({
      header: 'Error',
      message: 'Failed to load posts',
      buttons: ['OK'],
    });
    await errorAlert.present();
  } finally {
    isLoading.value = false;
  }
}

function handlePostClick(post: BoardPost) {
  // Navigate to the post detail page
  navigateTo(`/${outpostId}/projects/${props.projectId}/board/${post.id}`);
}

function openNewPostModal() {
  editingPost.value = null;
  isEditorOpen.value = true;
}

function closeEditor() {
  isEditorOpen.value = false;
  editingPost.value = null;
}

async function handleSave() {
  closeEditor();
  await loadData();
}

let postsUnsubscribe: (() => void) | null = null;

onMounted(async () => {
  await loadData();
  
  // Subscribe to realtime updates
  try {
    postsUnsubscribe = await pb.collection('board_posts').subscribe('*', (e) => {
      console.log('Board posts update:', e.action, e.record);
      if (e.record.project_tool === props.projectToolId) {
        loadData();
      }
    });
  } catch (error) {
    console.error('Error subscribing to realtime updates:', error);
  }
});

onUnmounted(() => {
  if (postsUnsubscribe) postsUnsubscribe();
});
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
