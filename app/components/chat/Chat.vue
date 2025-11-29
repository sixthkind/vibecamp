<template>
  <div class="chat-container">
    <!-- Chat Header -->
    <div class="chat-header">
      <h2 class="chat-title">{{ chatName }}</h2>
      <div class="chat-actions">
        <button v-if="canManage" @click="toggleEditMode" class="action-button" :class="{ active: editMode }">
          <Icon :name="editMode ? 'lucide:check' : 'lucide:edit-2'" size="18px" />
          <span>{{ editMode ? 'Done' : 'Edit' }}</span>
        </button>
      </div>
    </div>

    <!-- Messages Container -->
    <div class="messages-container" ref="messagesContainer">
      <!-- Load More Button -->
      <div v-if="hasMoreMessages && !isLoadingMore && !isLoading" class="load-more-container">
        <button @click="loadMoreMessages" class="load-more-button">
          <Icon name="lucide:chevron-up" size="18px" />
          <span>Load More Messages</span>
        </button>
      </div>

      <!-- Loading Spinner -->
      <div v-if="isLoadingMore" class="loader-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>

      <!-- Empty State -->
      <div v-if="messages.length === 0 && !isLoading" class="empty-state">
        <Icon name="lucide:message-square" size="48px" class="text-gray-300" />
        <p class="text-gray-500 mt-3">No messages yet. Start the conversation!</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loader-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p class="text-gray-500 mt-3">Loading messages...</p>
      </div>

      <!-- Messages -->
      <div v-for="message in messages" :key="message.id">
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
        <div class="message-timestamp">
          {{ formatMessageDate(message.created) }}
        </div>
      </div>

      <!-- Typing Indicator (placeholder for future) -->
      <div v-if="isTyping" class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <!-- Input Container -->
    <div class="input-container">
      <!-- File Preview Area -->
      <div v-if="selectedFiles.length > 0" class="file-preview-container">
        <div v-for="(file, index) in selectedFiles" :key="index" class="file-preview-item">
          <!-- Image Preview -->
          <img v-if="isImageFile(file)" :src="getFilePreview(file)" :alt="file.name" class="file-preview-image" />
          <!-- File Icon for non-images -->
          <div v-else class="file-preview-icon">
            <Icon name="lucide:file-text" size="32px" class="text-gray-400" />
          </div>
          <!-- File Name -->
          <div class="file-preview-name">{{ file.name }}</div>
          <!-- Remove Button -->
          <button @click="removeFile(index)" class="file-remove-button">
            <Icon name="lucide:x" size="16px" />
          </button>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <!-- File Attachment Button -->
        <button @click="triggerFileUpload" class="attachment-button" :disabled="isSending" title="Attach file">
          <Icon name="lucide:paperclip" size="20px" />
        </button>

        <!-- Hidden file input -->
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.rtf"
          @change="handleFileSelect"
          style="display: none;"
        />

        <!-- Message Input -->
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          type="text"
          placeholder="Type a message..."
          class="message-input"
          ref="messageInput"
          :disabled="isSending"
        />

        <!-- Send Button -->
        <button @click="sendMessage" class="send-button" :disabled="(!newMessage.trim() && selectedFiles.length === 0) || isSending">
          <ion-spinner v-if="isSending" name="crescent" color="primary"></ion-spinner>
          <Icon v-else name="lucide:send" size="20px" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { pb } from '~/utils/pb';
import { alertController } from '@ionic/vue';

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
  subscribeToMessages();
});

onUnmounted(() => {
  if (unsubscribe) {
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

function subscribeToMessages() {
  unsubscribe = pb.collection('chat_messages').subscribe('*', async (e) => {
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

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: white;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #E5E7EB;
  background-color: white;
}

.chat-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #F3F4F6;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  color: #6B7280;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: #E5E7EB;
}

.action-button.active {
  background-color: #3B82F6;
  color: white;
  border-color: #3B82F6;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #F9FAFB;
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.load-more-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #E5E7EB;
  border-radius: 20px;
  color: #6B7280;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.load-more-button:hover {
  background-color: #F3F4F6;
}

.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
}

.message-timestamp {
  text-align: center;
  font-size: 11px;
  color: #9CA3AF;
  margin-bottom: 16px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background-color: #F3F4F6;
  border-radius: 18px;
  width: fit-content;
  margin-bottom: 12px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #9CA3AF;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

.input-container {
  background-color: white;
  border-top: 1px solid #E5E7EB;
  padding: 16px 20px;
}

.file-preview-container {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding: 8px 0;
}

.file-preview-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.file-preview-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #E5E7EB;
}

.file-preview-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F3F4F6;
  border-radius: 8px;
  border: 2px solid #E5E7EB;
}

.file-preview-name {
  font-size: 11px;
  color: #6B7280;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-remove-button {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  background-color: #EF4444;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-remove-button:hover {
  background-color: #DC2626;
}

.input-area {
  display: flex;
  gap: 12px;
  align-items: center;
}

.attachment-button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F3F4F6;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s;
}

.attachment-button:hover:not(:disabled) {
  background-color: #E5E7EB;
}

.attachment-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 20px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: #3B82F6;
}

.message-input:disabled {
  background-color: #F3F4F6;
  cursor: not-allowed;
}

.send-button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3B82F6;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: #2563EB;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

