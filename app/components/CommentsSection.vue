<template>
  <section class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Comments</h2>
        <p class="text-sm text-gray-500">
          {{ comments.length === 1 ? '1 comment' : `${comments.length} comments` }}
        </p>
      </div>
      <Icon name="lucide:messages-square" size="24px" class="text-gray-400 flex-shrink-0" />
    </div>

    <div v-if="!isSupportedTarget" class="px-6 py-6 text-sm text-gray-500">
      Comments are not available for this {{ targetLabel }}.
    </div>

    <div v-else class="px-6 py-5">
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-8">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p class="text-gray-500 mt-3 text-sm">Loading comments...</p>
      </div>

      <div v-else>
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {{ error }}
        </div>

        <div v-if="comments.length === 0" class="py-8 text-center">
          <Icon name="lucide:message-square" size="40px" class="text-gray-300 mx-auto mb-3" />
          <p class="text-gray-500">No comments yet.</p>
        </div>

        <div v-else class="space-y-5 mb-6">
          <article
            v-for="comment in comments"
            :key="comment.id"
            class="flex items-start gap-3"
          >
            <div class="w-10 h-10 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
              <img
                v-if="getAvatarUrl(comment)"
                :src="getAvatarUrl(comment)"
                :alt="getAuthorName(comment)"
                class="w-full h-full object-cover"
              />
              <span v-else>{{ getInitials(getAuthorName(comment)) }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                <span class="font-medium text-gray-900">{{ getAuthorName(comment) }}</span>
                <span class="text-xs text-gray-500">{{ formatDate(comment.created) }}</span>
                <span v-if="comment.updated !== comment.created" class="text-xs text-gray-400">edited</span>
              </div>

              <div v-if="editingCommentId === comment.id" class="space-y-2">
                <textarea
                  v-model="editingContent"
                  rows="3"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  :disabled="isSavingEdit"
                ></textarea>
                <div class="flex items-center gap-2">
                  <button
                    @click="saveEdit(comment)"
                    class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    :disabled="!editingContent.trim() || isSavingEdit"
                  >
                    <ion-spinner v-if="isSavingEdit" name="crescent"></ion-spinner>
                    <Icon v-else name="lucide:check" size="16px" />
                    <span>Save</span>
                  </button>
                  <button
                    @click="cancelEdit"
                    class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                    :disabled="isSavingEdit"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <p v-else class="text-gray-700 whitespace-pre-wrap break-words">{{ comment.content }}</p>
            </div>

            <div
              v-if="canManageComment(comment) && editingCommentId !== comment.id"
              class="flex items-center gap-1 flex-shrink-0"
            >
              <button
                @click="startEdit(comment)"
                class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit comment"
                type="button"
              >
                <Icon name="lucide:edit-2" size="16px" />
              </button>
              <button
                @click="confirmDelete(comment)"
                class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete comment"
                type="button"
              >
                <Icon name="lucide:trash-2" size="16px" />
              </button>
            </div>
          </article>
        </div>

        <form class="border-t border-gray-200 pt-5" @submit.prevent="createComment">
          <label class="sr-only" :for="composerId">Add a comment</label>
          <textarea
            :id="composerId"
            v-model="newComment"
            rows="3"
            placeholder="Add a comment..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-y"
            :disabled="isPosting"
          ></textarea>
          <div class="mt-3 flex justify-end">
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              :disabled="!newComment.trim() || isPosting"
            >
              <ion-spinner v-if="isPosting" name="crescent"></ion-spinner>
              <Icon v-else name="lucide:send" size="18px" />
              <span>Comment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { alertController } from '@ionic/vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { COMMENT_TARGET_LABELS, isCommentTargetCollection, type CommentTargetCollection } from '~/utils/comments';
import { canUserPerformOnProject } from '~/utils/permissions';
import { pb } from '~/utils/pb';

interface CommentRecord {
  id: string;
  project: string;
  target_collection: string;
  target_id: string;
  content: string;
  created_by: string;
  created: string;
  updated: string;
  collectionId: string;
  expand?: {
    created_by?: {
      id: string;
      name?: string;
      email?: string;
      avatar?: string;
      collectionId: string;
    };
  };
}

const props = defineProps<{
  projectId: string;
  targetCollection: CommentTargetCollection | string;
  targetId: string;
}>();

const comments = ref<CommentRecord[]>([]);
const newComment = ref('');
const editingCommentId = ref<string | null>(null);
const editingContent = ref('');
const isLoading = ref(true);
const isPosting = ref(false);
const isSavingEdit = ref(false);
const canModerate = ref(false);
const error = ref('');

let unsubscribe: (() => void) | null = null;

const currentUserId = computed(() => pb.authStore.record?.id);
const isSupportedTarget = computed(() => isCommentTargetCollection(props.targetCollection));
const targetLabel = computed(() => {
  return isSupportedTarget.value
    ? COMMENT_TARGET_LABELS[props.targetCollection as CommentTargetCollection]
    : 'item';
});
const composerId = computed(() => `comment-composer-${props.targetCollection}-${props.targetId}`);

onMounted(() => {
  loadCommentsContext();
});

onUnmounted(() => {
  unsubscribe?.();
});

watch(
  () => [props.projectId, props.targetCollection, props.targetId],
  () => {
    loadCommentsContext();
  }
);

async function loadCommentsContext() {
  unsubscribe?.();
  unsubscribe = null;
  comments.value = [];
  error.value = '';
  editingCommentId.value = null;
  editingContent.value = '';

  if (!isSupportedTarget.value) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  try {
    await Promise.all([
      fetchComments(),
      fetchModerationPermission(),
    ]);
    await subscribeToComments();
  } finally {
    isLoading.value = false;
  }
}

async function fetchComments() {
  try {
    comments.value = await pb.collection('comments').getFullList<CommentRecord>({
      filter: getTargetFilter(),
      sort: 'created',
      expand: 'created_by',
    });
  } catch (err) {
    console.error('Error loading comments:', err);
    error.value = 'Failed to load comments.';
  }
}

async function fetchModerationPermission() {
  canModerate.value = await canUserPerformOnProject('manage_settings', props.projectId);
}

async function subscribeToComments() {
  unsubscribe = await pb.collection('comments').subscribe('*', async (event) => {
    const record = event.record as CommentRecord;

    if (!isSameTarget(record)) return;

    if (event.action === 'delete') {
      comments.value = comments.value.filter((comment) => comment.id !== record.id);
      return;
    }

    try {
      const fullComment = await pb.collection('comments').getOne<CommentRecord>(record.id, {
        expand: 'created_by',
      });

      if (!isSameTarget(fullComment)) return;

      const index = comments.value.findIndex((comment) => comment.id === fullComment.id);
      if (index === -1) {
        comments.value = [...comments.value, fullComment].sort(sortByCreated);
      } else {
        comments.value[index] = fullComment;
        comments.value = [...comments.value].sort(sortByCreated);
      }
    } catch (err) {
      console.error('Error syncing comment:', err);
    }
  });
}

async function createComment() {
  const content = newComment.value.trim();
  if (!content || isPosting.value || !currentUserId.value || !isSupportedTarget.value) return;

  isPosting.value = true;
  error.value = '';

  try {
    await pb.collection('comments').create({
      project: props.projectId,
      target_collection: props.targetCollection,
      target_id: props.targetId,
      content,
      created_by: currentUserId.value,
    });
    newComment.value = '';
    await fetchComments();
  } catch (err) {
    console.error('Error posting comment:', err);
    error.value = 'Failed to post comment.';
  } finally {
    isPosting.value = false;
  }
}

function startEdit(comment: CommentRecord) {
  editingCommentId.value = comment.id;
  editingContent.value = comment.content;
}

function cancelEdit() {
  editingCommentId.value = null;
  editingContent.value = '';
}

async function saveEdit(comment: CommentRecord) {
  const content = editingContent.value.trim();
  if (!content || isSavingEdit.value) return;

  isSavingEdit.value = true;
  error.value = '';

  try {
    const updated = await pb.collection('comments').update<CommentRecord>(comment.id, { content }, {
      expand: 'created_by',
    });
    const index = comments.value.findIndex((current) => current.id === updated.id);
    if (index !== -1) {
      comments.value[index] = updated;
      comments.value = [...comments.value].sort(sortByCreated);
    }
    cancelEdit();
  } catch (err) {
    console.error('Error updating comment:', err);
    error.value = 'Failed to update comment.';
  } finally {
    isSavingEdit.value = false;
  }
}

async function confirmDelete(comment: CommentRecord) {
  const alert = await alertController.create({
    header: 'Delete Comment',
    message: 'Are you sure you want to delete this comment?',
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
            await pb.collection('comments').delete(comment.id);
            comments.value = comments.value.filter((current) => current.id !== comment.id);
          } catch (err) {
            console.error('Error deleting comment:', err);
            error.value = 'Failed to delete comment.';
          }
        },
      },
    ],
  });

  await alert.present();
}

function canManageComment(comment: CommentRecord) {
  return comment.created_by === currentUserId.value || canModerate.value;
}

function getTargetFilter() {
  return `project = "${escapeFilterValue(props.projectId)}" && target_collection = "${escapeFilterValue(props.targetCollection)}" && target_id = "${escapeFilterValue(props.targetId)}"`;
}

function isSameTarget(comment: CommentRecord) {
  return comment.project === props.projectId
    && comment.target_collection === props.targetCollection
    && comment.target_id === props.targetId;
}

function escapeFilterValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function sortByCreated(a: CommentRecord, b: CommentRecord) {
  return new Date(a.created).getTime() - new Date(b.created).getTime();
}

function getAuthorName(comment: CommentRecord) {
  const author = comment.expand?.created_by;
  return author?.name || author?.email || 'Unknown';
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getAvatarUrl(comment: CommentRecord) {
  const author = comment.expand?.created_by;
  if (!author?.avatar) return '';
  return `${pb.baseUrl}/api/files/${author.collectionId}/${author.id}/${author.avatar}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
</script>
