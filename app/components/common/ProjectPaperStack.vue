<script setup lang="ts">
const props = defineProps<{
  project?: {
    id: string;
    name: string;
  } | null;
  outpostId: string;
  projectId: string;
  fullHeight?: boolean;
}>();
</script>

<template>
  <div
    class="project-paper-stack px-4 pt-24"
    :class="props.fullHeight ? 'h-full min-h-0' : ''"
  >
    <div class="project-paper-under mx-auto h-12 max-w-4xl rounded-t-3xl px-8 pt-2.5 text-center">
      <NuxtLink
        :to="`/${props.outpostId}/projects/${props.projectId}`"
        class="text-sm font-medium text-gray-500 hover:text-gray-800"
      >
        {{ props.project?.name || 'Project' }}
      </NuxtLink>
    </div>

    <div
      class="project-paper-front mx-auto -mt-3 max-w-5xl overflow-hidden rounded-t-3xl"
      :class="props.fullHeight ? 'h-[calc(100%-2.25rem)] min-h-0' : 'min-h-screen'"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.project-paper-stack {
  min-height: 100%;
}

.project-paper-under {
  background: #fcfaf4;
}

.project-paper-front {
  background: #fffefa;
}
</style>
