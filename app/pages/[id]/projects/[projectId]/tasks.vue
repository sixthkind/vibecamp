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
    <ion-content :fullscreen="true"></ion-content>
  </ion-page>
</template>
