<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

definePageMeta({
  middleware: "auth"
});

const route = useRoute();
const outpostId = computed(() => String(route.params.id));

const adminLinks = computed(() => [
  {
    label: 'Manage team',
    path: `/${outpostId.value}/members`,
  },
  {
    label: 'Archived projects',
    path: `/${outpostId.value}/projects?archived=true`,
  },
]);
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="max-w-3xl mx-auto py-8 px-4">
          <h1 class="text-2xl font-semibold text-gray-900 mb-6">Admin</h1>

          <div class="divide-y divide-gray-200 border-y border-gray-200">
            <NuxtLink
              v-for="item in adminLinks"
              :key="item.path"
              :to="item.path"
              class="block py-4 text-gray-900 hover:text-gray-600"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
