<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { alertController } from '@ionic/vue';
import { pb } from '~/utils/pb';
import { getProjectWithToolPageData } from '~/utils/tools';

definePageMeta({
  middleware: "auth",
});

const route = useRoute();
const router = useRouter();

const projectId = String(route.params.projectId);
const outpostId = String(route.params.id);
const todoId = String(route.params.todoId);

const loading = ref(true);
const error = ref('');
const project = ref<any>(null);
const todo = ref<any>(null);

const assigneeName = computed(() => {
  const assignee = todo.value?.expand?.assignee;
  return assignee?.name || assignee?.email || '';
});

const creatorName = computed(() => {
  const creator = todo.value?.expand?.created_by;
  return creator?.name || creator?.email || '';
});

async function loadData() {
  loading.value = true;
  error.value = '';

  try {
    const [projectRecord, todoRecord] = await Promise.all([
      getProjectWithToolPageData(projectId),
      pb.collection('todo_items').getOne(todoId, {
        expand: 'assignee,created_by,todo_list',
      }),
    ]);

    project.value = projectRecord;
    todo.value = todoRecord;
  } catch (err: any) {
    console.error('Error loading to-do:', err);
    if (err.status === 404) {
      error.value = 'To-do not found';
    } else if (err.status === 403) {
      error.value = 'You do not have access to this to-do';
    } else {
      error.value = 'Failed to load to-do';
    }
  } finally {
    loading.value = false;
  }
}

async function handleToggleComplete() {
  if (!todo.value) return;

  const completed = !todo.value.completed;
  const currentUserId = pb.authStore.record?.id;
  const updateData: Record<string, any> = { completed };

  if (completed) {
    updateData.completed_at = new Date().toISOString();
    updateData.completed_by = currentUserId;
  } else {
    updateData.completed_at = null;
    updateData.completed_by = null;
  }

  todo.value = await pb.collection('todo_items').update(todoId, updateData, {
    expand: 'assignee,created_by,todo_list',
  });
}

async function handleDelete() {
  const alert = await alertController.create({
    header: 'Delete To-do',
    message: 'Are you sure you want to delete this to-do?',
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
            await pb.collection('todo_items').delete(todoId);
            router.push(`/${outpostId}/projects/${projectId}/todos`);
          } catch (error) {
            console.error('Error deleting to-do:', error);
            const errorAlert = await alertController.create({
              header: 'Error',
              message: 'Failed to delete to-do. Please try again.',
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">

      <CommonProjectObjectPaperStack
        v-if="loading"
        :project="project"
        :outpost-id="outpostId"
        :project-id="projectId"
        parent-title="ToDos"
        :parent-path="`/${outpostId}/projects/${projectId}/todos`"
      />

      <div v-else-if="error" class="flex items-center justify-center h-full p-4">
        <div class="max-w-md text-center">
          <Icon name="lucide:alert-circle" size="48px" class="text-red-500 mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ error }}</h2>
          <NuxtLink :to="`/${outpostId}/projects/${projectId}/todos`">
            <button class="mt-4 px-6 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100">
              Back to ToDos
            </button>
          </NuxtLink>
        </div>
      </div>

      <CommonProjectObjectPaperStack
        v-else-if="todo"
        :project="project"
        :outpost-id="outpostId"
        :project-id="projectId"
        parent-title="ToDos"
        :parent-path="`/${outpostId}/projects/${projectId}/todos`"
      >
        <div class="content-pop-in mx-auto max-w-3xl px-6 py-8">
          <div class="mb-6 flex justify-end">
            <button
              @click="handleDelete"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Icon name="lucide:trash-2" size="20px" />
              <span>Delete</span>
            </button>
          </div>

          <div class="bg-white p-8">
            <div class="mb-6 flex items-start gap-5">
              <button
                @click="handleToggleComplete"
                class="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center transition-all"
                :class="todo.completed ? 'bg-blue-600' : 'bg-white hover:bg-blue-50'"
                :style="todo.completed
                  ? 'border: 2px solid #2563eb; border-radius: 4px;'
                  : 'border: 2px solid #d1d5db; border-radius: 4px;'"
                type="button"
                aria-label="Toggle completion"
              >
                <Icon v-if="todo.completed" name="lucide:check" size="24px" class="text-white" />
              </button>
              <div class="min-w-0 flex-1">
                <h1
                  class="text-3xl font-bold text-gray-900"
                  :class="{ 'line-through opacity-60': todo.completed }"
                >
                  {{ todo.content }}
                </h1>
              </div>
            </div>

            <p v-if="todo.description" class="mb-6 whitespace-pre-wrap text-gray-700">
              {{ todo.description }}
            </p>

            <div class="space-y-3 text-sm text-gray-600">
              <div v-if="assigneeName" class="flex items-center gap-2">
                <Icon name="lucide:user" size="16px" />
                <span>Assigned to {{ assigneeName }}</span>
              </div>
              <div v-if="todo.due_date" class="flex items-center gap-2">
                <Icon name="lucide:calendar" size="16px" />
                <span>Due {{ formatDate(todo.due_date) }}</span>
              </div>
              <div v-if="creatorName" class="flex items-center gap-2">
                <Icon name="lucide:user-plus" size="16px" />
                <span>Created by {{ creatorName }}</span>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <CommentsSection
              :project-id="projectId"
              target-collection="todo_items"
              :target-id="todoId"
            />
          </div>
        </div>
      </CommonProjectObjectPaperStack>
    </ion-content>
  </ion-page>
</template>
