// Global state
let currentUser = null;
let isGuest = false;
let chatHistory = [];
let recognition = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  // Check if user is logged in
  const savedUser = localStorage.getItem('preaid-user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showApp();
  } else {
    showAuthModal();
  }
  
  setupEventListeners();
  initializeTheme();
  initializeSpeechRecognition();
  initializeSpeechSynthesis();
}

function initializeSpeechSynthesis() {
  if ('speechSynthesis' in window) {
    // Force voice loading
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log(`Loaded ${voices.length} voices for speech synthesis`);
        return true;
      }
      return false;
    };
    
    // Try to load voices immediately
    if (!loadVoices()) {
      // If voices not loaded, wait for the event
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
      
      // Fallback: trigger voice loading
      setTimeout(() => {
        if (window.speechSynthesis.getVoices().length === 0) {
          // Some browsers need a dummy utterance to load voices
          const dummy = new SpeechSynthesisUtterance('');
          window.speechSynthesis.speak(dummy);
          window.speechSynthesis.cancel();
        }
      }, 100);
    }
  }
}

// Authentication
function showAuthModal() {
  document.getElementById('auth-modal').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('auth-modal').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  
  if (currentUser) {
    document.getElementById('user-name').textContent = currentUser.name || currentUser.email;
    loadUserHistory();
  } else {
    document.getElementById('user-name').textContent = 'Guest User';
  }
}

function setupEventListeners() {
  // Auth tabs
  document.getElementById('login-tab').addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('register-tab').addEventListener('click', () => switchAuthTab('register'));
  document.getElementById('guest-tab').addEventListener('click', continueAsGuest);
  
  // Auth form
  document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
  
  // Main app
  document.getElementById('send-button').addEventListener('click', sendMessage);
  document.getElementById('health-issue').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  document.getElementById('mic-button').addEventListener('click', toggleVoiceInput);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('history-toggle').addEventListener('click', toggleHistory);
  document.getElementById('clear-chat').addEventListener('click', clearChat);
  document.getElementById('share-chat').addEventListener('click', shareChat);
  document.getElementById('toggle-history').addEventListener('click', () => {
    document.getElementById('history-panel').classList.add('hidden');
  });
}

function switchAuthTab(tab) {
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(t => t.classList.remove('active'));
  
  if (tab === 'login') {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('auth-title').textContent = 'Welcome Back';
    document.getElementById('auth-subtitle').textContent = 'Sign in to access your health history';
    document.getElementById('auth-submit').textContent = 'Sign In';
    document.getElementById('register-fields').classList.remove('show');
  } else if (tab === 'register') {
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('auth-title').textContent = 'Join PreAid';
    document.getElementById('auth-subtitle').textContent = 'Create your account to save your health journey';
    document.getElementById('auth-submit').textContent = 'Sign Up';
    document.getElementById('register-fields').classList.add('show');
  }
}

function continueAsGuest() {
  isGuest = true;
  currentUser = null;
  showApp();
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value;
  const isLogin = document.getElementById('login-tab').classList.contains('active');
  
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: isLogin ? 'login' : 'register',
        email,
        password,
        name
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data.user;
      localStorage.setItem('preaid-user', JSON.stringify(currentUser));
      showApp();
    } else {
      alert(data.error || 'Authentication failed');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

function logout() {
  currentUser = null;
  isGuest = false;
  chatHistory = [];
  localStorage.removeItem('preaid-user');
  document.getElementById('chat-messages').innerHTML = '';
  showAuthModal();
}

// Chat functionality
async function sendMessage() {
  const input = document.getElementById('health-issue');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message
  addMessage(message, 'user');
  input.value = '';
  
  // Show loading
  const loadingId = addMessage('Analyzing your concern...', 'ai', true);
  
  try {
    const response = await fetch('/api/health-advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentUser ? `Bearer ${currentUser.id}` : 'Guest'
      },
      body: JSON.stringify({ 
        issue: message,
        userId: currentUser?.id || 'guest'
      })
    });
    
    const data = await response.json();
    
    // Remove loading message
    document.getElementById(loadingId).remove();
    
    if (response.ok) {
      addMessage(data.advice, 'ai');
      
      // Save to history if not guest
      if (!isGuest && currentUser) {
        await saveToHistory(message, data.advice);
      }
    } else {
      addMessage('Sorry, I encountered an error. Please try again.', 'ai');
    }
  } catch (error) {
    document.getElementById(loadingId).remove();
    // Offline mode - provide basic health advice
    const offlineAdvice = getOfflineHealthAdvice(message);
    addMessage('🏥 **PreAid Offline Mode** - ' + offlineAdvice, 'ai');
  }
}

function getOfflineHealthAdvice(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('headache') || msg.includes('head pain') || msg.includes('migraine')) {
    return "I understand headaches can be really uncomfortable. Here's what might help:\n\n**Immediate Relief:**\n• Rest in a quiet, dark room\n• Apply a cold compress to your forehead or warm compress to neck\n• Stay well hydrated\n• Gentle neck and shoulder stretches\n\n**When to seek help:** If headache is sudden/severe, with fever, stiff neck, vision changes, or after head injury.";
  }
  
  if (msg.includes('fever') || msg.includes('temperature') || msg.includes('hot') || msg.includes('chills')) {
    return "Fever can make you feel awful, but it's often your body fighting infection. Here's how to manage it:\n\n**Care steps:**\n• Rest and drink plenty of fluids\n• Use fever reducers as directed (acetaminophen/ibuprofen)\n• Wear light, breathable clothing\n• Take lukewarm baths or use cool cloths\n\n**Seek immediate care if:** Fever >103°F (39.4°C), lasts >3 days, or with severe symptoms like difficulty breathing.";
  }
  
  if (msg.includes('cough') || msg.includes('throat') || msg.includes('sore')) {
    return "Throat discomfort and coughs can be really bothersome. Let's help you feel better:\n\n**Soothing remedies:**\n• Warm liquids (tea with honey, warm salt water gargle)\n• Throat lozenges or hard candies\n• Use a humidifier or breathe steam\n• Rest your voice\n\n**See a doctor if:** Symptoms persist >1 week, severe difficulty swallowing, or breathing problems.";
  }
  
  if (msg.includes('stomach') || msg.includes('nausea') || msg.includes('vomit') || msg.includes('diarrhea')) {
    return "Stomach troubles are never fun. Here's gentle care to help you recover:\n\n**Gentle approach:**\n• Small, frequent sips of clear fluids\n• BRAT diet when ready (bananas, rice, applesauce, toast)\n• Avoid dairy, fatty, or spicy foods\n• Rest and let your stomach settle\n\n**Get medical help for:** Severe dehydration, blood in vomit/stool, high fever, or symptoms lasting >2 days.";
  }
  
  if (msg.includes('pain') || msg.includes('hurt') || msg.includes('ache')) {
    return "I'm sorry you're experiencing pain. Here are some general comfort measures:\n\n**Pain management:**\n• Rest the affected area\n• Apply ice for acute injuries, heat for muscle tension\n• Over-the-counter pain relievers if appropriate\n• Gentle movement as tolerated\n\n**Important:** For severe, persistent, or worsening pain, please consult a healthcare provider.";
  }
  
  if (msg.includes('cut') || msg.includes('wound') || msg.includes('bleeding')) {
    return "For minor cuts and wounds:\n\n**First aid steps:**\n• Clean your hands first\n• Apply direct pressure to stop bleeding\n• Clean wound gently with water\n• Apply antibiotic ointment and bandage\n• Keep wound clean and dry\n\n**Seek immediate care for:** Deep cuts, excessive bleeding, signs of infection, or if you can't clean the wound properly.";
  }
  
  return "Thank you for reaching out about your health concern. While I'm in offline mode and can't provide AI-powered analysis right now, here are some general wellness tips:\n\n**General care:**\n• Monitor your symptoms\n• Stay hydrated and get adequate rest\n• Maintain good hygiene\n• Consider appropriate over-the-counter remedies\n\n**Remember:** This is general information only. For persistent, severe, or concerning symptoms, please consult a healthcare professional. If this is an emergency, call emergency services immediately.";
}

function addMessage(content, sender, isLoading = false) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageId = 'msg-' + Date.now();
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.id = messageId;
  
  const avatar = sender === 'user' ? 
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
       <circle cx="12" cy="7" r="4"/>
     </svg>` : 
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
       <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
     </svg>`;
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  messageDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      ${isLoading ? `
        <div class="loading">
          <span>${content}</span>
          <div class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
        </div>
      ` : `
        <div class="message-text">${formatMessage(content)}</div>
        ${sender === 'ai' ? `
          <div class="message-actions">
            <div class="speech-controls">
              <button class="speak-btn" onclick="toggleSpeech('${messageId}')" title="Play/Pause speech">
                <svg class="play-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <svg class="pause-icon hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              </button>
              <div class="speed-control">
                <label>Speed:</label>
                <input type="range" class="speed-slider" min="0.5" max="2" step="0.1" value="1">
                <span class="speed-value">1x</span>
              </div>
            </div>
            <button class="copy-btn" onclick="copyMessage('${messageId}')" title="Copy advice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        ` : ''}
        <div class="message-time">${time}</div>
      `}
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Add to chat history
  if (!isLoading) {
    chatHistory.push({ content, sender, time });
  }
  
  // Setup speed control for AI messages
  if (sender === 'ai' && !isLoading) {
    const speedSlider = messageDiv.querySelector('.speed-slider');
    const speedValue = messageDiv.querySelector('.speed-value');
    
    if (speedSlider && speedValue) {
      // Load saved speed
      const savedSpeed = localStorage.getItem('speech-speed') || '1';
      speedSlider.value = savedSpeed;
      speedValue.textContent = savedSpeed + 'x';
      
      speedSlider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        speedValue.textContent = speed + 'x';
        localStorage.setItem('speech-speed', speed);
        
        // If currently speaking this message, restart with new speed after delay
        if (currentMessageId === messageId && window.speechSynthesis.speaking) {
          clearTimeout(speedChangeTimeout);
          speedChangeTimeout = setTimeout(() => {
            restartSpeechWithNewSpeed(messageId, speed);
          }, 500);
        }
      });
    }
  }
  
  return messageId;
}

function formatMessage(text) {
  // Basic markdown-like formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/- (.*?)(?=\n|$)/g, '• $1');
}

// Speech functionality
let currentUtterance = null;
let currentMessageId = null;
let isPaused = false;
let speedChangeTimeout = null;
let currentText = '';
let currentPosition = 0;

function toggleSpeech(messageId) {
  const messageElement = document.getElementById(messageId);
  const speakBtn = messageElement.querySelector('.speak-btn');
  const playIcon = speakBtn.querySelector('.play-icon');
  const pauseIcon = speakBtn.querySelector('.pause-icon');
  
  if (!('speechSynthesis' in window)) {
    alert('Text-to-speech not supported in your browser');
    return;
  }
  
  // If currently speaking this message
  if (currentMessageId === messageId && window.speechSynthesis.speaking) {
    if (isPaused) {
      window.speechSynthesis.resume();
      isPaused = false;
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    } else {
      window.speechSynthesis.pause();
      isPaused = true;
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }
    return;
  }
  
  // Stop any current speech
  window.speechSynthesis.cancel();
  resetAllSpeechButtons();
  
  // Ensure voices are loaded before starting
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    // Try to load voices and retry
    setTimeout(() => {
      const retryVoices = window.speechSynthesis.getVoices();
      if (retryVoices.length > 0) {
        startSpeechWithVoices(messageId);
      } else {
        alert('Speech voices not available. Please try again.');
      }
    }, 500);
    return;
  }
  
  startSpeechWithVoices(messageId);
}

function startSpeechWithVoices(messageId) {
  const messageElement = document.getElementById(messageId);
  const textElement = messageElement.querySelector('.message-text');
  const text = textElement.textContent;
  const speedSlider = messageElement.querySelector('.speed-slider');
  const speed = parseFloat(speedSlider.value);
  
  startSpeech(messageId, text, speed);
}

function startSpeech(messageId, text, speed) {
  const messageElement = document.getElementById(messageId);
  const speakBtn = messageElement.querySelector('.speak-btn');
  const playIcon = speakBtn.querySelector('.play-icon');
  const pauseIcon = speakBtn.querySelector('.pause-icon');
  
  // Clean text for more natural speech
  const cleanText = cleanTextForSpeech(text);
  
  currentUtterance = new SpeechSynthesisUtterance(cleanText);
  
  // Get better voice with proper settings
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = selectBestVoice(voices);
  if (preferredVoice) {
    currentUtterance.voice = preferredVoice;
  }
  
  // Natural speech settings
  currentUtterance.rate = Math.max(0.7, Math.min(speed, 1.2)); // Limit speed for naturalness
  currentUtterance.pitch = 0.9; // Slightly lower pitch for medical advice
  currentUtterance.volume = 0.8;
  
  currentMessageId = messageId;
  currentText = text;
  isPaused = false;
  
  // Update UI
  playIcon.classList.add('hidden');
  pauseIcon.classList.remove('hidden');
  speakBtn.style.color = 'var(--primary-color)';
  
  currentUtterance.onend = () => {
    resetSpeechButton(messageId);
    currentUtterance = null;
    currentMessageId = null;
    currentText = '';
  };
  
  currentUtterance.onerror = () => {
    resetSpeechButton(messageId);
    currentUtterance = null;
    currentMessageId = null;
    currentText = '';
  };
  
  // Actually start speaking
  window.speechSynthesis.speak(currentUtterance);
}

function restartSpeechWithNewSpeed(messageId, newSpeed) {
  if (currentMessageId === messageId && currentText) {
    // Stop current speech
    window.speechSynthesis.cancel();
    
    // Restart with new speed
    setTimeout(() => {
      startSpeech(messageId, currentText, newSpeed);
    }, 100);
  }
}

function resetSpeechButton(messageId) {
  const messageElement = document.getElementById(messageId);
  if (messageElement) {
    const speakBtn = messageElement.querySelector('.speak-btn');
    const playIcon = speakBtn.querySelector('.play-icon');
    const pauseIcon = speakBtn.querySelector('.pause-icon');
    
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    speakBtn.style.color = '';
  }
}

function selectBestVoice(voices) {
  if (!voices || voices.length === 0) return null;
  
  // Priority order for natural-sounding voices
  const voicePreferences = [
    // High-quality neural voices
    /microsoft.*neural/i,
    /google.*wavenet/i,
    /amazon.*neural/i,
    
    // Standard high-quality voices
    /samantha/i,
    /alex/i,
    /karen/i,
    /daniel/i,
    /susan/i,
    /victoria/i,
    
    // Female voices (often more pleasant for medical advice)
    /female/i,
    /woman/i,
    
    // Any English voice
    /en-us/i,
    /en-gb/i,
    /en-au/i,
    /^en/i
  ];
  
  // Try each preference in order
  for (const preference of voicePreferences) {
    const voice = voices.find(v => 
      (v.name && preference.test(v.name)) || 
      (v.lang && preference.test(v.lang))
    );
    if (voice) return voice;
  }
  
  // Fallback to first English voice or default
  return voices.find(v => v.lang && v.lang.startsWith('en')) || voices[0];
}

function cleanTextForSpeech(text) {
  return text
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    
    // Medical text improvements
    .replace(/\b(mg|ml|cm|mm)\b/g, ' $1 ') // Add spaces around units
    .replace(/\b(\d+)([a-zA-Z])/g, '$1 $2') // Space between numbers and letters
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Space in camelCase
    
    // Punctuation for natural pauses
    .replace(/\n\n/g, '. ') // Double newlines become periods
    .replace(/\n/g, ', ') // Single newlines become commas
    .replace(/•/g, '. ') // Bullets become periods
    .replace(/- /g, '. ') // Dashes become periods
    .replace(/:/g, ': ') // Ensure space after colons
    
    // Common medical abbreviations
    .replace(/\bDr\./g, 'Doctor')
    .replace(/\bMD\b/g, 'M D')
    .replace(/\bRN\b/g, 'R N')
    .replace(/\bER\b/g, 'Emergency Room')
    .replace(/\bICU\b/g, 'I C U')
    .replace(/\bECG\b/g, 'E C G')
    .replace(/\bMRI\b/g, 'M R I')
    .replace(/\bCT\b/g, 'C T')
    
    // Clean up extra spaces and punctuation
    .replace(/\s+/g, ' ')
    .replace(/\s*([.,;:!?])\s*/g, '$1 ')
    .replace(/\.{2,}/g, '.')
    .trim();
}

function resetAllSpeechButtons() {
  document.querySelectorAll('.speak-btn').forEach(btn => {
    const playIcon = btn.querySelector('.play-icon');
    const pauseIcon = btn.querySelector('.pause-icon');
    
    if (playIcon && pauseIcon) {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      btn.style.color = '';
    }
  });
}

function copyMessage(messageId) {
  const messageElement = document.getElementById(messageId);
  const textElement = messageElement.querySelector('.message-text');
  const text = textElement.textContent;
  
  navigator.clipboard.writeText(text).then(() => {
    const copyBtn = messageElement.querySelector('.copy-btn');
    const originalColor = copyBtn.style.color;
    copyBtn.style.color = 'var(--accent-color)';
    setTimeout(() => {
      copyBtn.style.color = originalColor;
    }, 1000);
  });
}

// Voice input
function initializeSpeechRecognition() {
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      document.getElementById('health-issue').value = transcript;
      resetMicButton();
    };
    
    recognition.onend = function() {
      resetMicButton();
    };
    
    recognition.onerror = function() {
      resetMicButton();
    };
  } else {
    document.getElementById('mic-button').style.display = 'none';
  }
}

function toggleVoiceInput() {
  const micBtn = document.getElementById('mic-button');
  
  if (micBtn.classList.contains('listening')) {
    recognition.stop();
    resetMicButton();
  } else {
    micBtn.classList.add('listening');
    micBtn.innerHTML = `
      <svg class="mic-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    `;
    recognition.start();
  }
}

function resetMicButton() {
  const micBtn = document.getElementById('mic-button');
  micBtn.classList.remove('listening');
  micBtn.innerHTML = `
    <svg class="mic-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  `;
}

// History management
async function loadUserHistory() {
  if (isGuest || !currentUser) return;
  
  try {
    const response = await fetch('/api/history', {
      headers: { 'Authorization': `Bearer ${currentUser.id}` }
    });
    
    if (response.ok) {
      const history = await response.json();
      displayHistory(history);
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

async function saveToHistory(issue, advice) {
  if (isGuest || !currentUser) return;
  
  try {
    await fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.id}`
      },
      body: JSON.stringify({ issue, advice })
    });
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

function displayHistory(history) {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
  
  history.slice(-10).reverse().forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-issue">${item.issue}</div>
      <div class="history-date">${new Date(item.created_at).toLocaleDateString()}</div>
    `;
    
    historyItem.addEventListener('click', () => {
      document.getElementById('health-issue').value = item.issue;
    });
    
    historyList.appendChild(historyItem);
  });
}

function toggleHistory() {
  const historyPanel = document.getElementById('history-panel');
  historyPanel.classList.toggle('hidden');
  
  if (!historyPanel.classList.contains('hidden')) {
    loadUserHistory();
  }
}

// Utility functions
function clearChat() {
  if (confirm('Clear all messages?')) {
    document.getElementById('chat-messages').innerHTML = '';
    chatHistory = [];
  }
}

function shareChat() {
  if (chatHistory.length === 0) {
    alert('No messages to share');
    return;
  }
  
  const chatText = chatHistory
    .map(msg => `${msg.sender === 'user' ? 'You' : 'PreAid'}: ${msg.content}`)
    .join('\n\n');
  
  if (navigator.share) {
    navigator.share({
      title: 'PreAid Health Consultation',
      text: chatText
    });
  } else {
    navigator.clipboard.writeText(chatText).then(() => {
      alert('Chat copied to clipboard!');
    });
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('preaid-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('preaid-theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const themeIcon = document.querySelector('.theme-icon');
  if (theme === 'light') {
    themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  } else {
    themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  }
}