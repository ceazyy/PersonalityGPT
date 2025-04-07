// Main Application JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sidebar = document.getElementById('sidebar');
  const conversationsList = document.getElementById('conversations-list');
  const newChatBtn = document.getElementById('new-chat-btn');
  const clearConversationsBtn = document.getElementById('clear-conversations');
  const personalitySelector = document.getElementById('personality-selector');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const menuToggle = document.getElementById('menu-toggle');
  const welcomeScreen = document.getElementById('welcome-screen');
  const chatContainer = document.getElementById('chat-container');
  const personalitiesGrid = document.getElementById('personalities-grid');
  const chatHeader = document.querySelector('.chat-header');

  // State
  let currentConversationId = null;
  let isSending = false;
  let currentPersonality = 'default';
  let justCreatedNewChat = false; // Flag to prevent redirecting to first chat after creating a new one

  // Initialize personality options
  initializePersonalitySelector();
  initializePersonalityCards();
  // Initialize placeholder text
  updatePlaceholderText(currentPersonality);
  
  // Add a "Back to Menu" button to the chat container
  const backToMenuBtn = document.createElement('button');
  backToMenuBtn.id = 'back-to-menu-btn';
  backToMenuBtn.className = 'back-button';
  backToMenuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Back to Menu';
  backToMenuBtn.addEventListener('click', showWelcomeScreen);
  
  // Insert it at the top of the chat container
  if (chatHeader) {
    chatHeader.insertBefore(backToMenuBtn, chatHeader.firstChild);
  }
  
  // Event listeners
  newChatBtn.addEventListener('click', startNewConversation);
  clearConversationsBtn.addEventListener('click', clearCurrentChat); // Changed from clearConversations to clearCurrentChat
  personalitySelector.addEventListener('change', handlePersonalityChange);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  sendButton.addEventListener('click', sendMessage);
  
  // Mobile menu toggle
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('show');
  });
  
  // Adjust textarea height on input
  chatInput.addEventListener('input', () => adjustTextareaHeight(chatInput));
  
  // Load conversations on page load
  loadConversations();
  
  // Function to initialize personality selector from the personalities object
  function initializePersonalitySelector() {
    personalitySelector.innerHTML = '';
    
    Object.entries(PERSONALITIES).forEach(([key, personality]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = personality.name;
      personalitySelector.appendChild(option);
    });
  }
  
  // Function to initialize personality cards in the welcome screen
  function initializePersonalityCards() {
    personalitiesGrid.innerHTML = '';
    
    Object.entries(PERSONALITIES).forEach(([key, personality]) => {
      const card = document.createElement('div');
      card.className = 'personality-card';
      card.dataset.personality = key;
      
      const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-${personality.icon || 'cpu'}">
        ${getFeatherIconPath(personality.icon || 'cpu')}
      </svg>`;
      
      card.innerHTML = `
        <div class="personality-icon">${iconHtml}</div>
        <h3 class="personality-title">${personality.name}</h3>
        <p class="personality-description">${personality.description}</p>
      `;
      
      card.addEventListener('click', () => {
        currentPersonality = key;
        startNewConversation();
      });
      
      personalitiesGrid.appendChild(card);
    });
  }
  
  // Helper function to get SVG path for different Feather icons
  function getFeatherIconPath(iconName) {
    switch (iconName) {
      case 'cpu':
        return '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>';
      case 'book-open':
        return '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>';
      case 'coffee':
        return '<path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line>';
      case 'code':
        return '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>';
      case 'feather':
        return '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line>';
      case 'heart':
        return '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>';
      case 'clipboard':
        return '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>';
      case 'globe':
        return '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>';
      case 'briefcase':
        return '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>';
      case 'award':
        return '<circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>';
      case 'tool':
        return '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>';
      case 'users':
        return '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>';
      case 'activity':
        return '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>';
      case 'music':
        return '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>';
      case 'camera':
        return '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>';
      case 'shield':
        return '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>';
      case 'smile':
        return '<circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>';
      case 'command':
        return '<path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>';
      case 'map':
        return '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line>';
      case 'zap':
        return '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>';
      default:
        return '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>';
    }
  }
  
  // Resize textarea based on content
  function adjustTextareaHeight() {
    chatInput.style.height = 'auto';
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 200)}px`;
  }
  
  // Load conversations from the server
  async function loadConversations(dontAutoSelect = false) {
    try {
      const response = await fetch('/api/conversations', {
        credentials: 'same-origin' // Include cookies in the request
      });
      const data = await response.json();
      
      // Render conversations in the sidebar
      renderConversationsList(data);
      
      // If there are conversations and we should auto-select one
      if (data.length > 0 && !dontAutoSelect && !currentConversationId && !justCreatedNewChat) {
        // Load the first conversation
        await loadConversation(data[0].id);
      } else if (currentConversationId) {
        // Make sure the active conversation is highlighted in the list
        document.querySelectorAll('.conversation-item').forEach(item => {
          item.classList.remove('active');
          if (item.dataset.id === currentConversationId) {
            item.classList.add('active');
          }
        });
      } else {
        // Show welcome screen if no conversation is selected
        showWelcomeScreen();
      }
      
      // Reset the flag after use
      if (justCreatedNewChat) {
        justCreatedNewChat = false;
      }
      
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }
  
  // Render the conversations list in the sidebar
  function renderConversationsList(conversations) {
    conversationsList.innerHTML = '';
    
    if (conversations.length === 0) {
      return;
    }
    
    conversations.forEach(conversation => {
      const listItem = document.createElement('li');
      listItem.className = `conversation-item ${conversation.id === currentConversationId ? 'active' : ''}`;
      listItem.dataset.id = conversation.id;
      
      const personalityIcon = PERSONALITIES[conversation.personality]?.icon || 'message-square';
      
      listItem.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-${personalityIcon}">
          ${getFeatherIconPath(personalityIcon)}
        </svg>
        ${conversation.title}
      `;
      
      listItem.addEventListener('click', () => loadConversation(conversation.id));
      
      conversationsList.appendChild(listItem);
    });
  }
  
  // Load a specific conversation
  async function loadConversation(conversationId) {
    try {
      currentConversationId = conversationId;
      
      const response = await fetch(`/api/conversation/${conversationId}`, {
        credentials: 'same-origin' // Include cookies in the request
      });
      
      const conversation = await response.json();
      
      // Update personality selector
      currentPersonality = conversation.personality || 'default';
      personalitySelector.value = currentPersonality;
      
      // Update input placeholder
      updatePlaceholderText(currentPersonality);
      
      // Render messages
      renderMessages(conversation.messages);
      
      // Show the chat container and hide welcome screen
      hideWelcomeScreen();
      
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }
  
  function renderMessages(messages) {
    chatMessages.innerHTML = '';
    
    messages.forEach(message => {
      appendMessage(message);
    });
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role}`;
    
    let formattedContent = '';
    
    if (message.role === 'assistant') {
      // Use the marked library to render markdown
      formattedContent = markdownToHtml(message.content);
    } else {
      // For user messages, preserve line breaks but don't do markdown
      formattedContent = `<p>${message.content.replace(/\n/g, '<br>')}</p>`;
    }
    
    messageElement.innerHTML = `
      <div class="message-content">
        ${formattedContent}
      </div>
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  
  async function startNewConversation() {
    try {
      // Clear the UI regardless of whether we had a conversation before
      chatMessages.innerHTML = '';
      
      // Set flag to prevent auto-selection of first chat
      justCreatedNewChat = true;
      
      // Create a new conversation
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personality: currentPersonality }),
        credentials: 'same-origin' // Include cookies in the request
      });
      
      if (!response.ok) throw new Error('Failed to create conversation');
      
      const data = await response.json();
      
      // Update the current conversation ID to the new one
      currentConversationId = data.id;
      
      // Reload conversations, but don't auto-select first one
      await loadConversations(true);
      
      // Update the active conversation in the sidebar
      document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === currentConversationId) {
          item.classList.add('active');
        }
      });
      
      // Hide welcome screen and show chat
      hideWelcomeScreen();
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Error creating a new conversation. Please try again.');
    }
  }
  
  async function sendMessage() {
    const messageText = chatInput.value.trim();
    
    if (messageText === '' || isSending) return;
    
    try {
      isSending = true;
      
      // Clear the input and resize it
      chatInput.value = '';
      adjustTextareaHeight(chatInput);
      
      // Add the user message to the UI immediately
      const userMessage = {
        role: 'user',
        content: messageText
      };
      appendMessage(userMessage);
      
      // Start a fetch request to the streaming endpoint
      const response = await fetch(`/api/conversation/${currentConversationId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          personality: currentPersonality
        }),
        credentials: 'same-origin' // Include cookies in the request
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      // Add an empty assistant message that we'll fill with streamed content
      const assistantMessageElement = document.createElement('div');
      assistantMessageElement.className = 'message assistant';
      
      assistantMessageElement.innerHTML = `
        <div class="message-content">
          <div class="assistant-response"></div>
        </div>
      `;
      
      chatMessages.appendChild(assistantMessageElement);
      
      // Get the container for the assistant's response
      const assistantResponseContainer = assistantMessageElement.querySelector('.assistant-response');
      
      // Initialize an empty content buffer
      let contentBuffer = '';
      
      // Set up a stream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the incoming chunks
        const chunk = decoder.decode(value, { stream: true });
        
        // Process each line in the chunk
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              break;
            }
            
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.choices && parsedData.choices[0].delta && parsedData.choices[0].delta.content) {
                // Add the new content to our buffer
                contentBuffer += parsedData.choices[0].delta.content;
                
                // Update the UI with the current total content
                assistantResponseContainer.innerHTML = markdownToHtml(contentBuffer);
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
              }
            } catch (error) {
              console.error('Error parsing SSE message:', error);
            }
          }
        }
      }
      
      // Reload conversations to update titles, but don't auto-select first chat
      loadConversations(true);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      isSending = false;
    }
  }
  
  async function clearCurrentChat() {
    if (!currentConversationId) return;
    
    if (confirm('Are you sure you want to delete this chat? This cannot be undone.')) {
      try {
        const deletedId = currentConversationId;
        
        // Reset current conversation ID before making the API call
        // This prevents any race conditions
        currentConversationId = null;
        
        // Clear chat messages UI
        chatMessages.innerHTML = '';
        
        // Show welcome screen
        showWelcomeScreen();
        
        // Send the delete request
        const response = await fetch(`/api/conversation/${deletedId}`, {
          method: 'DELETE',
          credentials: 'same-origin' // Include cookies in the request
        });
        
        if (!response.ok) throw new Error('Failed to delete conversation');
        
        // Remove from sidebar immediately
        const conversationElement = document.querySelector(`.conversation-item[data-id="${deletedId}"]`);
        if (conversationElement) {
          conversationElement.remove();
        }
        
        // Reload conversations to ensure UI is up to date
        loadConversations(true); // Pass true to prevent auto-selection
        
      } catch (error) {
        console.error('Error deleting conversation:', error);
        alert('Error deleting conversation. Please try again.');
      }
    }
  }
  
  function updatePlaceholderText(personality) {
    const personalityName = PERSONALITIES[personality]?.name || 'Assistant';
    chatInput.placeholder = `Message ${personalityName}...`;
  }
  
  function handlePersonalityChange() {
    const newPersonality = personalitySelector.value;
    
    // If no change or no conversation active, do nothing
    if (newPersonality === currentPersonality || !currentConversationId) return;
    
    // Display a notification about personality change
    const notification = document.createElement('div');
    notification.className = 'personality-change-note';
    notification.textContent = `Switching to ${PERSONALITIES[newPersonality].name}. Your next message will use this personality.`;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
    
    // Update the current personality
    currentPersonality = newPersonality;
    
    // Update placeholder text
    updatePlaceholderText(currentPersonality);
  }
  
  function showWelcomeScreen() {
    chatContainer.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    currentConversationId = null;
  }
  
  function hideWelcomeScreen() {
    welcomeScreen.style.display = 'none';
    chatContainer.style.display = 'flex';
  }
  
  // Clear all conversations button in sidebar footer
  document.getElementById('clear-conversations').addEventListener('click', clearCurrentChat);
  
});

function adjustTextareaHeight(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
}
