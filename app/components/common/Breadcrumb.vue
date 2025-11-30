<template>
  <nav v-if="shouldShowBreadcrumbs" class="flex items-center gap-2 text-sm">
    <template v-for="(crumb, index) in breadcrumbs" :key="index">
      <NuxtLink
        v-if="crumb.path"
        :to="crumb.path"
        class="text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap"
      >
        {{ crumb.label }}
      </NuxtLink>
      <span v-else class="text-gray-900 font-medium whitespace-nowrap">
        {{ crumb.label }}
      </span>
      <Icon
        v-if="index < breadcrumbs.length - 1"
        name="lucide:chevron-right"
        size="14px"
        class="text-gray-400 flex-shrink-0"
      />
    </template>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { pb } from '~/utils/pb';

interface Breadcrumb {
  label: string;
  path?: string;
}

const route = useRoute();
const breadcrumbs = ref<Breadcrumb[]>([]);
const loading = ref(false);

// Don't show breadcrumbs on auth pages, home page, or other non-main pages
const shouldShowBreadcrumbs = computed(() => {
  const path = route.path;
  
  // Don't show on home/landing pages
  if (path === '/' || path === '/outposts') return false;
  
  // Don't show on auth pages
  if (path.startsWith('/auth') || path.startsWith('/oauth')) return false;
  
  // Don't show on profile or create pages at root
  if (path === '/profile' || path === '/create') return false;
  
  // Show on main app pages (outpost and project pages)
  return !!path.match(/^\/[^\/]+\/(projects|members|settings)/);
});

// Map tool types to readable labels
const toolLabels: Record<string, string> = {
  chat: 'Chat',
  docs: 'Docs',
  tasks: 'To-dos',
  schedule: 'Schedule',
  todos: 'To-dos',
  members: 'Members',
  settings: 'Settings',
  tools: 'Tools',
};

async function buildBreadcrumbs() {
  if (!shouldShowBreadcrumbs.value) {
    breadcrumbs.value = [];
    return;
  }

  loading.value = true;
  const crumbs: Breadcrumb[] = [];

  try {
    const params = route.params;
    const pathSegments = route.path.split('/').filter(Boolean);

    // Always start with Home
    crumbs.push({ label: '', path: '/' });

    // Extract IDs
    const outpostId = params.id as string;
    const projectId = params.projectId as string;
    const itemId = params.itemId as string;
    const eventId = params.eventId as string;

    // If we have a project, fetch it
    if (projectId) {
      try {
        const project = await pb.collection('projects').getOne(projectId);
        crumbs.push({
          label: project.name,
          path: `/${outpostId}/projects/${projectId}`,
        });

        // Check what tool/section we're in
        const toolIndex = pathSegments.indexOf(projectId) + 1;
        if (toolIndex < pathSegments.length) {
          const toolType = pathSegments[toolIndex];
          
          // Add tool breadcrumb if it's a known tool
          if (toolLabels[toolType]) {
            // For docs and schedule, check if we're on the index or detail page
            if (toolType === 'docs' && itemId) {
              // We're viewing a specific doc item
              crumbs.push({
                label: toolLabels[toolType],
                path: `/${outpostId}/projects/${projectId}/${toolType}`,
              });
              
              // Fetch the doc item
              try {
                const docItem = await pb.collection('docs_items').getOne(itemId);
                const isEditPage = pathSegments[pathSegments.length - 1] === 'edit';
                crumbs.push({
                  label: docItem.title,
                  path: isEditPage ? `/${outpostId}/projects/${projectId}/docs/${itemId}` : undefined,
                });
                
                if (isEditPage) {
                  crumbs.push({ label: 'Edit' });
                }
              } catch (err) {
                console.error('Error fetching doc item:', err);
                crumbs.push({ label: 'Document' });
              }
            } else if (toolType === 'schedule' && eventId) {
              // We're viewing a specific event
              crumbs.push({
                label: toolLabels[toolType],
                path: `/${outpostId}/projects/${projectId}/${toolType}`,
              });
              
              // Fetch the event
              try {
                const event = await pb.collection('calendar_events').getOne(eventId);
                crumbs.push({ label: event.title });
              } catch (err) {
                console.error('Error fetching event:', err);
                crumbs.push({ label: 'Event' });
              }
            } else {
              // Just add the tool name as the current page
              crumbs.push({ label: toolLabels[toolType] });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        crumbs.push({ label: 'Project' });
      }
    } else if (outpostId && pathSegments.includes('members')) {
      // Outpost members page
      crumbs.push({ label: 'Members' });
    } else if (outpostId && pathSegments.includes('settings')) {
      // Outpost settings page
      crumbs.push({ label: 'Settings' });
    }
  } catch (err) {
    console.error('Error building breadcrumbs:', err);
  } finally {
    loading.value = false;
  }

  breadcrumbs.value = crumbs;
}

// Watch for route changes
watch(() => route.path, buildBreadcrumbs, { immediate: true });
watch(() => route.params, buildBreadcrumbs);
</script>

<style scoped>
/* Inline breadcrumb styles */
</style>
