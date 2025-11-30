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
const postId = String(route.params.postId);

const loading = ref(true);
const error = ref('');
const post = ref<any>(null);
const project = ref<any>(null);
const canManage = ref(false);

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    // Fetch project
    project.value = await pb.collection('projects').getOne(projectId);
    
    // Fetch post
    post.value = await pb.collection('board_posts').getOne(postId, {
      expand: 'created_by',
    });

    // Check if user can manage
    canManage.value = await canUserPerformOnProject('manage_settings', projectId);
  } catch (err: any) {
    console.error('Error loading post:', err);
    if (err.status === 404) {
      error.value = 'Post not found';
    } else if (err.status === 403) {
      error.value = 'You do not have access to this post';
    } else {
      error.value = 'Failed to load post';
    }
  } finally {
    loading.value = false;
  }
}

function getAuthorName() {
  if (post.value?.expand?.created_by) {
    return post.value.expand.created_by.name || post.value.expand.created_by.email || 'Unknown';
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

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric'
  });
}

async function handleDelete() {
  const alert = await alertController.create({
    header: 'Delete Post',
    message: `Are you sure you want to delete "${post.value?.title}"?`,
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
            await pb.collection('board_posts').delete(postId);
            router.push(`/${outpostId}/projects/${projectId}/board`);
          } catch (error) {
            console.error('Error deleting post:', error);
            const errorAlert = await alertController.create({
              header: 'Error',
              message: 'Failed to delete post. Please try again.',
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
    <ion-content :fullscreen="true">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="text-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="text-gray-500 mt-4">Loading post...</p>
        </div>
      </div>

      <div v-else-if="error" class="flex items-center justify-center h-full p-4">
        <div class="max-w-md text-center">
          <Icon name="lucide:alert-circle" size="48px" class="text-red-500 mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ error }}</h2>
          <NuxtLink :to="`/${outpostId}/projects/${projectId}/board`">
            <button class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Board
            </button>
          </NuxtLink>
        </div>
      </div>

      <div v-else-if="post" class="max-w-5xl mx-auto py-6 px-4 pt-20">
        <!-- Action Buttons -->
        <div class="flex justify-end gap-2 mb-4">
          <button
            v-if="canManage"
            @click="handleDelete"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Icon name="lucide:trash-2" size="20px" />
            <span>Delete</span>
          </button>
        </div>

        <!-- Post Content -->
        <div class="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <!-- Post Header -->
          <div class="mb-6 pb-6 border-b border-gray-200">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ post.title }}</h1>
            <div class="flex items-center gap-4 text-sm text-gray-600">
              <div class="flex items-center gap-2">
                <Icon name="lucide:user" size="16px" />
                <span class="font-medium">{{ getAuthorName() }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="lucide:calendar" size="16px" />
                <span>{{ formatShortDate(post.created) }}</span>
              </div>
            </div>
          </div>

          <!-- Post Content -->
          <div class="prose max-w-none" v-html="post.content"></div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
ion-content {
  --background: #f9fafb;
}

/* Style for post content */
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
