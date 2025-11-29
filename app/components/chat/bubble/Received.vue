<template>
  <div class="flex justify-start">
    <div class="max-w-[70%]">
      <div class="flex items-start gap-2 mb-2">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span class="text-white text-sm font-semibold">{{ getUserInitials() }}</span>
        </div>
        <span class="text-sm font-medium text-gray-700 mt-1">{{ userName }}</span>
      </div>
      
      <div class="bg-white border border-gray-200 rounded-lg px-4 py-2 ml-10">
        <div v-if="message.content" class="text-[15px] leading-relaxed text-gray-900 whitespace-pre-wrap">{{ message.content }}</div>
        
        <!-- File attachments -->
        <div v-if="message.files && message.files.length > 0" :class="message.content ? 'mt-2' : ''" class="space-y-2">
          <div v-for="(file, index) in message.files" :key="index" @click="openFile(file)" class="cursor-pointer hover:opacity-80 transition-opacity">
            <img 
              v-if="isImage(file)" 
              :src="getFileURL(file)" 
              :alt="file" 
              class="max-w-full rounded-lg"
            />
            <div v-else class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <Icon name="lucide:file-text" size="20px" class="text-gray-500" />
              <span class="text-sm text-gray-700 truncate">{{ file }}</span>
            </div>
          </div>
        </div>

        <!-- Edit indicator -->
        <div v-if="message.edited" class="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <Icon name="lucide:pencil" size="10px" />
          <span>edited</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { pb } from '~/utils/pb';

interface Message {
  id: string;
  content: string;
  files?: string[];
  edited?: boolean;
  created: string;
  updated: string;
  user: string;
  expand?: {
    user?: {
      name?: string;
      email?: string;
    };
  };
}

const props = defineProps<{
  message: Message;
}>();

const userName = ref('User');

onMounted(async () => {
  if (props.message.expand?.user?.name) {
    userName.value = props.message.expand.user.name;
  } else if (props.message.expand?.user?.email) {
    userName.value = props.message.expand.user.email.split('@')[0];
  } else {
    // Fetch user info if not expanded
    try {
      const user = await pb.collection('users').getOne(props.message.user);
      userName.value = user.name || user.email?.split('@')[0] || 'User';
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }
});

function getUserInitials(): string {
  return userName.value.charAt(0).toUpperCase();
}

function isImage(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

function getFileURL(filename: string): string {
  if (!props.message.id) return '';
  return `${pb.baseUrl}/api/files/chat_messages/${props.message.id}/${filename}`;
}

function openFile(filename: string) {
  window.open(getFileURL(filename), '_blank');
}
</script>


