<template>
  <div class="flex flex-col h-full bg-gray-50">

    <!-- Messages Container -->
    <div class="flex-1 overflow-y-auto px-4 py-6" ref="messagesContainer">
      <div class="max-w-4xl mx-auto">
        <!-- Load More Button -->
        <div v-if="hasMoreMessages && !isLoadingMore && !isLoading" class="flex justify-center mb-6">
          <button 
            @click="loadMoreMessages" 
            class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Icon name="lucide:chevron-up" size="16px" />
            <span>Load More Messages</span>
          </button>
        </div>

        <!-- Loading Spinner -->
        <div v-if="isLoadingMore" class="flex justify-center mb-6">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
        </div>

        <!-- Empty State -->
        <div v-if="messages.length === 0 && !isLoading" class="flex flex-col items-center justify-center py-16">
          <Icon name="lucide:message-square" size="48px" class="text-gray-300 mb-4" />
          <p class="text-gray-500">No messages yet. Start the conversation!</p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-16">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="text-gray-500 mt-4">Loading messages...</p>
        </div>

        <!-- Messages -->
        <div v-for="message in messages" :key="message.id" class="mb-6">
          <ChatBubbleSent
            v-if="message.user === currentUserId"
            :message="message"
            :editMode="editMode"
            @editMessage="editMessage"
            @confirmDelete="confirmDelete"
          />
          <ChatBubbleReceived
            v-else
            :message="message"
          />
          <div class="text-xs text-gray-400 mt-1" :class="message.user === currentUserId ? 'text-right mr-1' : 'text-left ml-1'">
            {{ formatMessageDate(message.created) }}
          </div>
        </div>

        <!-- Typing Indicator (placeholder for future) -->
        <div v-if="isTyping" class="flex gap-1 p-3 bg-white rounded-lg w-fit border border-gray-200">
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
        </div>
      </div>
    </div>

    <!-- Input Container -->
    <div class="bg-white border-t border-gray-200 px-4 py-4">
      <div class="max-w-4xl mx-auto">
        <!-- File Preview Area -->
        <div v-if="selectedFiles.length > 0" class="flex gap-3 mb-3 overflow-x-auto pb-2">
          <div v-for="(file, index) in selectedFiles" :key="index" class="relative flex-shrink-0">
            <!-- Image Preview -->
            <img 
              v-if="isImageFile(file)" 
              :src="getFilePreview(file)" 
              :alt="file.name" 
              class="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
            />
            <!-- File Icon for non-images -->
            <div v-else class="w-20 h-20 flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200">
              <Icon name="lucide:file-text" size="24px" class="text-gray-400" />
              <span class="text-xs text-gray-500 mt-1 truncate w-full px-1 text-center">{{ file.name.split('.').pop() }}</span>
            </div>
            <!-- Remove Button -->
            <button 
              @click="removeFile(index)" 
              class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
            >
              <Icon name="lucide:x" size="14px" />
            </button>
          </div>
        </div>

        <!-- Input Area -->
        <div class="flex gap-2 items-center">
          <!-- Edit Mode Toggle -->
          <button 
            v-if="canManage" 
            @click="toggleEditMode" 
            :class="[
              'px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2',
              editMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
            title="Edit mode"
          >
            <Icon :name="editMode ? 'lucide:check' : 'lucide:edit-2'" size="16px" />
          </button>

          <!-- File Attachment Button -->
          <button 
            @click="triggerFileUpload" 
            class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50" 
            :disabled="isSending" 
            title="Attach file"
          >
            <Icon name="lucide:paperclip" size="20px" />
          </button>

          <!-- Hidden file input -->
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.rtf"
            @change="handleFileSelect"
            class="hidden"
          />

          <!-- Message Input -->
          <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            type="text"
            placeholder="Type a message..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            ref="messageInput"
            :disabled="isSending"
          />

          <!-- Send Button -->
          <button 
            @click="sendMessage" 
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]" 
            :disabled="(!newMessage.trim() && selectedFiles.length === 0) || isSending"
          >
            <ion-spinner v-if="isSending" name="crescent"></ion-spinner>
            <Icon v-else name="lucide:send" size="20px" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { pb } from '~/utils/pb';
import { alertController } from '@ionic/vue';
import ChatBubbleSent from './bubble/Sent.vue';
import ChatBubbleReceived from './bubble/Received.vue';

interface ChatMessage {
  id: string;
  project_tool: string;
  user: string;
  content: string;
  files?: string[];
  edited?: boolean;
  created: string;
  updated: string;
  expand?: {
    user?: any;
  };
}

const props = defineProps<{
  projectToolId: string;
  chatName?: string;
  canManage?: boolean;
}>();

const messagesContainer = ref<HTMLElement | null>(null);
const messageInput = ref<HTMLInputElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const newMessage = ref('');
const messages = ref<ChatMessage[]>([]);
const editMode = ref(false);
const isSending = ref(false);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const isTyping = ref(false);

// File upload
const selectedFiles = ref<File[]>([]);

// Pagination
const currentPage = ref(1);
const pageSize = ref(30);
const hasMoreMessages = ref(true);

// Real-time subscription
let unsubscribe: (() => void) | null = null;

const currentUserId = computed(() => pb.authStore.record?.id);

onMounted(async () => {
  await fetchMessages();
  scrollToBottom();
  await subscribeToMessages();
});

onUnmounted(() => {
  if (unsubscribe && typeof unsubscribe === 'function') {
    unsubscribe();
  }
});

async function fetchMessages(page = 1, append = false) {
  try {
    if (page === 1) {
      isLoading.value = true;
    } else {
      isLoadingMore.value = true;
    }

    const response = await pb.collection('chat_messages').getList(page, pageSize.value, {
      filter: `project_tool = "${props.projectToolId}"`,
      sort: '-created',
      expand: 'user',
    });

    const newMessages = response.items.reverse();

    if (append) {
      messages.value = [...newMessages, ...messages.value];
    } else {
      messages.value = newMessages;
    }

    hasMoreMessages.value = response.page < response.totalPages;
    currentPage.value = page;
  } catch (error) {
    console.error('Error fetching messages:', error);
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
}

async function loadMoreMessages() {
  const scrollContainer = messagesContainer.value;
  const scrollHeightBefore = scrollContainer?.scrollHeight || 0;

  await fetchMessages(currentPage.value + 1, true);

  await nextTick();
  
  if (scrollContainer) {
    const scrollHeightAfter = scrollContainer.scrollHeight;
    scrollContainer.scrollTop = scrollHeightAfter - scrollHeightBefore;
  }
}

async function subscribeToMessages() {
  try {
    unsubscribe = await pb.collection('chat_messages').subscribe('*', async (e) => {
      const message = e.record as ChatMessage;
      
      // Only handle messages for this project tool
      if (message.project_tool !== props.projectToolId) return;

      if (e.action === 'create') {
        // Fetch the message with expanded user data
        try {
          const fullMessage = await pb.collection('chat_messages').getOne(message.id, {
            expand: 'user',
          });
          messages.value.push(fullMessage);
          await nextTick();
          scrollToBottom();
        } catch (error) {
          console.error('Error fetching new message:', error);
        }
      } else if (e.action === 'update') {
        const index = messages.value.findIndex(m => m.id === message.id);
        if (index !== -1) {
          try {
            const fullMessage = await pb.collection('chat_messages').getOne(message.id, {
              expand: 'user',
            });
            messages.value[index] = fullMessage;
          } catch (error) {
            console.error('Error fetching updated message:', error);
          }
        }
      } else if (e.action === 'delete') {
        messages.value = messages.value.filter(m => m.id !== message.id);
      }
    });
  } catch (error) {
    console.error('Error subscribing to messages:', error);
  }
}

async function sendMessage() {
  if ((!newMessage.value.trim() && selectedFiles.value.length === 0) || isSending.value) return;

  isSending.value = true;

  try {
    const formData = new FormData();
    formData.append('project_tool', props.projectToolId);
    formData.append('user', currentUserId.value!);
    
    if (newMessage.value.trim()) {
      formData.append('content', newMessage.value.trim());
    }

    // Add files
    selectedFiles.value.forEach((file) => {
      formData.append('files', file);
    });

    await pb.collection('chat_messages').create(formData);

    // Clear input
    newMessage.value = '';
    selectedFiles.value = [];
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
  } finally {
    isSending.value = false;
    messageInput.value?.focus();
  }
}

async function editMessage(message: ChatMessage) {
  const alert = await alertController.create({
    header: 'Edit Message',
    inputs: [
      {
        name: 'content',
        type: 'textarea',
        value: message.content,
        placeholder: 'Message content',
      },
    ],
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Save',
        handler: async (data) => {
          if (data.content.trim()) {
            try {
              await pb.collection('chat_messages').update(message.id, {
                content: data.content.trim(),
                edited: true,
              });
            } catch (error) {
              console.error('Error updating message:', error);
              alert('Failed to update message.');
            }
          }
        },
      },
    ],
  });

  await alert.present();
}

async function confirmDelete(message: ChatMessage) {
  const alert = await alertController.create({
    header: 'Delete Message',
    message: 'Are you sure you want to delete this message?',
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
            await pb.collection('chat_messages').delete(message.id);
          } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message.');
          }
        },
      },
    ],
  });

  await alert.present();
}

function toggleEditMode() {
  editMode.value = !editMode.value;
}

function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// File Upload Functions
function triggerFileUpload() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  selectedFiles.value = [...selectedFiles.value, ...files];
  // Reset input
  target.value = '';
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

function getFilePreview(file: File): string {
  return URL.createObjectURL(file);
}
</script>


