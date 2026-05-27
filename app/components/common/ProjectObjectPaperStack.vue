<script setup lang="ts">
const props = defineProps<{
  project?: {
    id: string;
    name: string;
  } | null;
  outpostId: string;
  projectId: string;
  parentTitle: string;
  parentPath: string;
}>();
</script>

<template>
  <div class="project-object-paper-stack px-4 pt-24">
    <div class="project-object-paper-project mx-auto h-10 max-w-3xl rounded-t-3xl px-8 pt-2 text-center">
      <NuxtLink
        :to="`/${props.outpostId}/projects/${props.projectId}`"
        class="text-sm font-medium text-gray-500 hover:text-gray-800"
      >
        {{ props.project?.name || 'Project' }}
      </NuxtLink>
    </div>

    <div class="project-object-paper-parent mx-auto -mt-2 h-11 max-w-4xl rounded-t-3xl px-8 pt-2.5 text-center">
      <NuxtLink
        :to="props.parentPath"
        class="text-sm font-medium text-gray-500 hover:text-gray-800"
      >
        {{ props.parentTitle }}
      </NuxtLink>
    </div>

    <div class="project-object-paper-front mx-auto -mt-3 min-h-screen max-w-5xl overflow-hidden rounded-t-3xl">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.project-object-paper-stack {
  min-height: 100%;
}

.project-object-paper-project {
  background: #fbf8ef;
}

.project-object-paper-parent {
  background: #fcfaf4;
}

.project-object-paper-front {
  background: #fffefa;
}
</style>
