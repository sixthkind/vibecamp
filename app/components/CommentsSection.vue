<template>
  <section v-if="isSupportedTarget" class="space-y-4 border-t border-gray-200 pt-5">
    <div v-if="comments.length > 0">
      <article
        v-for="(comment, index) in comments"
        :key="comment.id"
      >
        <div v-if="index > 0" class="mx-6 my-4 border-t border-gray-200"></div>
        <div class="space-y-1 px-6">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span class="font-medium text-gray-800">{{ getAuthorName(comment) }}</span>
            <span class="text-xs text-gray-500">{{ formatDate(comment.created) }}</span>
          </div>
          <p class="whitespace-pre-wrap break-words text-gray-700">
            {{ comment.content }}
          </p>
        </div>
      </article>
    </div>

    <form class="space-y-3" @submit.prevent="createComment">
      <div v-if="comments.length > 0" class="mx-6 border-t border-gray-200"></div>
      <div class="px-6">
        <label class="sr-only" :for="composerId">Add a comment</label>
        <textarea
          :id="composerId"
          v-model="newComment"
          rows="3"
          placeholder="Add a comment..."
          class="w-full resize-y bg-transparent px-0 py-1 focus:outline-none disabled:opacity-60"
          :disabled="isPosting || isLoading"
        ></textarea>
        <div class="flex justify-end">
          <button
            type="submit"
            class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!newComment.trim() || isPosting || isLoading"
          >
            Comment
          </button>
        </div>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { isCommentTargetCollection, type CommentTargetCollection } from '~/utils/comments';
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
const isLoading = ref(true);
const isPosting = ref(false);
const error = ref('');

let unsubscribe: (() => void) | null = null;

const currentUserId = computed(() => pb.authStore.record?.id);
const isSupportedTarget = computed(() => isCommentTargetCollection(props.targetCollection));
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

  if (!isSupportedTarget.value) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  try {
    await fetchComments();
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
    console.error('Error posting comment:', err, (err as any)?.response);
    error.value = 'Failed to post comment.';
  } finally {
    isPosting.value = false;
  }
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

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };

  if (date.getFullYear() !== new Date().getFullYear()) {
    options.year = 'numeric';
  }

  return date.toLocaleDateString('en-US', options);
}
</script>
