// B-LOCKER Core Logic

const apps = [
    { id: 'insta', name: 'Instagram', icon: '📸', color: '#E4405F', usage: 0 },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000', usage: 0 },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: '#1DA1F2', usage: 0 },
    { id: 'fb', name: 'Facebook', icon: '👥', color: '#1877F2', usage: 0 }
];

let state = {
    currentApp: null,
    sessionLimit: 0,
    startTime: null,
    timerInterval: null,
    totalUsage: parseInt(localStorage.getItem('totalUsage') || '0'),
    sessionCount: parseInt(localStorage.getItem('sessionCount') || '0')
};

// DOM Elements
const appListEl = document.getElementById('app-list');
const entryModal = document.getElementById('entry-modal');
const hurdleModal = document.getElementById('hurdle-modal');
const simulatedApp = document.getElementById('simulated-app');
const totalUsageEl = document.getElementById('total-usage');
const sessionCountEl = document.getElementById('session-count');
const hurdleInput = document.getElementById('hurdle-input');
const extendBtn = document.getElementById('extend-session-btn');
const timerDisplay = document.getElementById('timer-display');

// Initialize
function init() {
    renderAppList();
    updateStats();
    setupEventListeners();
}

function renderAppList() {
    appListEl.innerHTML = apps.map(app => `
        <div class="app-item glass-card" onclick="openEntryModal('${app.id}')">
            <div class="app-icon" style="color: ${app.color}">${app.icon}</div>
            <div class="app-info">
                <div class="app-name">${app.name}</div>
                <div class="app-usage">Tap to unlock session</div>
            </div>
            <div class="app-status"></div>
        </div>
    `).join('');
}

function updateStats() {
    const hours = Math.floor(state.totalUsage / 60);
    const mins = state.totalUsage % 60;
    totalUsageEl.textContent = `${hours}h ${mins}m`;
    sessionCountEl.textContent = state.sessionCount;
}

function setupEventListeners() {
    // Time Selection
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.sessionLimit = parseInt(btn.dataset.time);
        };
    });

    // Start Session
    document.getElementById('start-session-btn').onclick = startSession;

    // Hurdle Logic
    hurdleInput.oninput = (e) => {
        const prompt = `I have spent ${state.sessionLimit} minutes on ${state.currentApp.name}`;
        if (e.target.value.trim() === prompt) {
            extendBtn.disabled = false;
        } else {
            extendBtn.disabled = true;
        }
    };

    // Extend Session
    extendBtn.onclick = extendSession;

    // Close App
    document.getElementById('close-app-btn').onclick = endSession;
}

window.openEntryModal = (appId) => {
    state.currentApp = apps.find(a => a.id === appId);
    document.getElementById('entry-app-name').textContent = state.currentApp.name;
    entryModal.classList.add('active');
};

function startSession() {
    if (!state.sessionLimit) {
        alert('Please select a time limit');
        return;
    }

    entryModal.classList.remove('active');
    simulatedApp.classList.add('active');
    document.getElementById('sim-app-name').textContent = state.currentApp.name;
    
    state.startTime = Date.now();
    state.sessionCount++;
    localStorage.setItem('sessionCount', state.sessionCount);
    updateStats();

    startTimer(state.sessionLimit * 60);
}

function startTimer(seconds) {
    clearInterval(state.timerInterval);
    let remaining = seconds;
    
    updateTimerDisplay(remaining);

    state.timerInterval = setInterval(() => {
        remaining--;
        updateTimerDisplay(remaining);

        if (remaining <= 0) {
            clearInterval(state.timerInterval);
            triggerHurdle();
        }
    }, 1000);
}

function updateTimerDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function triggerHurdle() {
    // Update usage stats before hurdle
    state.totalUsage += state.sessionLimit;
    localStorage.setItem('totalUsage', state.totalUsage);
    updateStats();

    // Show hurdle
    document.getElementById('hurdle-prompt').innerHTML = 
        `I have spent <span>${state.sessionLimit} minutes</span> on <span>${state.currentApp.name}</span>`;
    hurdleInput.value = '';
    extendBtn.disabled = true;
    hurdleModal.classList.add('active');
}

function extendSession() {
    hurdleModal.classList.remove('active');
    // Extend for 5 more minutes
    state.sessionLimit = 5; 
    startTimer(5 * 60);
}

function endSession() {
    clearInterval(state.timerInterval);
    hurdleModal.classList.remove('active');
    simulatedApp.classList.remove('active');
    state.currentApp = null;
    state.sessionLimit = 0;
}

init();
