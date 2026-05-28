<script setup lang="ts">
definePageMeta({
  middleware: [
    "auth",
    (to) => navigateTo(
      `/${to.params.id}/projects/${to.params.projectId}/todos`,
      { replace: true },
    ),
  ],
});
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="flex h-full items-center justify-center">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>
    </ion-content>
  </ion-page>
</template>
