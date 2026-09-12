let tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
let activityLog = JSON.parse(localStorage.getItem('study_activity_log')) || [];

const todayStr = new Date().toDateString();
const lastActiveDate = localStorage.getItem('study_last_active_date');

if (lastActiveDate !== todayStr) {
  activityLog = [];
  localStorage.setItem('study_activity_log', JSON.stringify(activityLog));
  localStorage.setItem('study_last_active_date', todayStr);
}

// --- FLASHCARD STATE ---
let flashcardDeck = [];
let currentCardIndex = 0;
let isShowingFront = true;

let currentQuizQuestions = [];
let currentQuizIndex = 0;
let userScore = 0;
let currentCorrectAnswer = "";

// --- API KEY HELPER ---
function getApiKey() {
  return "AQ.Ab8RN6Jdtf6omjiuCV10qUkJ8SnZpalvcHUJ80jKLxO5GBK5Zw";
}

// --- THEME / DARK MODE MANAGER ---
let currentTheme = localStorage.getItem('study_hub_theme') || 'light';

function applyTheme(theme) {
  const body = document.getElementById('body-layout');
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const cards = document.querySelectorAll('.theme-card');
  const texts = document.querySelectorAll('.theme-text');
  const textSubs = document.querySelectorAll('.theme-text-sub');
  const inputs = document.querySelectorAll('.theme-input');
  const tableHeaders = document.querySelectorAll('.theme-table-header');

  if (theme === 'dark') {
    if (body) { body.style.background = '#0f172a'; body.style.color = '#f8fafc'; }
    if (toggleBtn) { toggleBtn.innerText = '☀️ Light Mode'; toggleBtn.style.background = '#334155'; toggleBtn.style.color = '#f8fafc'; }
    
    cards.forEach(card => { card.style.background = '#1e293b'; card.style.border = '1px solid #334155'; });
    texts.forEach(t => t.style.color = '#f8fafc');
    textSubs.forEach(ts => ts.style.color = '#94a3b8');
    inputs.forEach(inp => { inp.style.borderColor = '#475569'; inp.style.color = '#f8fafc'; });
    tableHeaders.forEach(th => { th.style.background = '#0f172a'; th.style.color = '#cbd5e1'; });
  } else {
    if (body) { body.style.background = '#f1f5f9'; body.style.color = '#1e293b'; }
    if (toggleBtn) { toggleBtn.innerText = '🌙 Dark Mode'; toggleBtn.style.background = '#e2e8f0'; toggleBtn.style.color = '#1e293b'; }
    
    cards.forEach(card => { card.style.background = 'white'; card.style.border = 'none'; });
    texts.forEach(t => t.style.color = '#334155');
    textSubs.forEach(ts => ts.style.color = '#64748b');
    inputs.forEach(inp => { inp.style.borderColor = '#cbd5e1'; inp.style.color = '#1e293b'; });
    tableHeaders.forEach(th => { th.style.background = '#f8fafc'; th.style.color = '#475569'; });
  }
}

window.toggleDarkMode = function() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('study_hub_theme', currentTheme);
  applyTheme(currentTheme);
  renderTasks();
  renderScheduleTable();
  renderFlashcardPlayer();
};

// --- TASK MANAGER ---
const addTaskBtn = document.getElementById('add-task-btn');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

function renderTasks() {
  if (!taskList) return;
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    const isDark = currentTheme === 'dark';
    li.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid ${isDark ? '#334155' : '#e5e7eb'};`;
    li.innerHTML = `
      <span style="${task.completed ? 'text-decoration: line-through; color: #9ca3af;' : (isDark ? 'color: #f8fafc;' : 'color: #1f2937;')}">${task.text}</span>
      <div style="display: flex; align-items: center; gap: 10px;">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})" style="width: 18px; height: 18px; cursor: pointer;">
        <button onclick="deleteTask(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
      </div>
    `;
    taskList.appendChild(li);
  });
  updateAnalyticsDisplay();
}

window.toggleTask = function(index) {
  tasks[index].completed = !tasks[index].completed;
  if (tasks[index].completed) recordActivity('tasks', 1);
  localStorage.setItem('study_tasks', JSON.stringify(tasks));
  renderTasks();
};

window.deleteTask = function(index) {
  tasks.splice(index, 1);
  localStorage.setItem('study_tasks', JSON.stringify(tasks));
  renderTasks();
};

if (addTaskBtn && taskInput) {
  addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (text) {
      tasks.push({ text, completed: false });
      taskInput.value = '';
      localStorage.setItem('study_tasks', JSON.stringify(tasks));
      renderTasks();
    }
  });
}

// --- ACTIVITY LOG & ANALYTICS ---
function recordActivity(type, amount) {
  activityLog.push({ type, amount, date: new Date().toISOString() });
  localStorage.setItem('study_activity_log', JSON.stringify(activityLog));
  updateAnalyticsDisplay();
}

function updateAnalyticsDisplay() {
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const totalFlashcards = activityLog.filter(a => a.type === 'flashcards').reduce((sum, a) => sum + a.amount, 0);
  
  const completedEl = document.getElementById('completed-tasks-metric');
  const flashcardsEl = document.getElementById('flashcards-reviewed-metric');
  
  if (completedEl) completedEl.innerText = completedTasksCount;
  if (flashcardsEl) flashcardsEl.innerText = totalFlashcards;
}

// --- WEEKLY SCHEDULE ---
let weeklyScheduleData = JSON.parse(localStorage.getItem('study_weekly_schedule_grid')) || {
  Sunday: Array(7).fill(''), Monday: Array(7).fill(''), Tuesday: Array(7).fill(''), Wednesday: Array(7).fill(''), Thursday: Array(7).fill('')
};

function renderScheduleTable() {
  const tbody = document.getElementById('schedule-table-body');
  if (!tbody) return;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const isDark = currentTheme === 'dark';
  let html = '';
  for (let i = 0; i < 7; i++) {
    html += `<tr><td style="padding: 8px; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; background: ${isDark ? '#0f172a' : '#f8fafc'}; font-weight: bold; color: ${isDark ? '#cbd5e1' : '#475569'};">Period ${i + 1}</td>`;
    days.forEach(day => {
      const val = weeklyScheduleData[day]?.[i] || '';
      html += `<td style="padding: 6px; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'};"><input type="text" data-day="${day}" data-period="${i}" value="${val}" placeholder="Subject ${i + 1}" style="width: 100%; padding: 6px; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 4px; font-size: 0.85rem; text-align: center; background: ${isDark ? '#0f172a' : 'transparent'}; color: inherit;"></td>`;
    });
    html += `</tr>`;
  }
  tbody.innerHTML = html;
}

window.saveScheduleTable = function() {
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].forEach(day => {
    weeklyScheduleData[day] = [];
    for (let i = 0; i < 7; i++) {
      const input = document.querySelector(`input[data-day="${day}"][data-period="${i}"]`);
      weeklyScheduleData[day].push(input ? input.value.trim() : '');
    }
  });
  localStorage.setItem('study_weekly_schedule_grid', JSON.stringify(weeklyScheduleData));
  const feedback = document.getElementById('schedule-save-feedback');
  if (feedback) { feedback.innerText = "Saved successfully!"; setTimeout(() => { feedback.innerText = ""; }, 2000); }
};

window.toggleScheduleVisibility = function() {
  const wrapper = document.getElementById('schedule-content-wrapper');
  const btn = document.getElementById('toggle-schedule-btn');
  if (!wrapper || !btn) return;
  
  if (wrapper.style.display === 'none' || wrapper.style.display === '') {
    wrapper.style.display = 'block';
    btn.innerText = 'Hide Schedule';
  } else {
    wrapper.style.display = 'none';
    btn.innerText = 'View Schedule';
  }
};

const scheduleWrapper = document.getElementById('schedule-content-wrapper');
const scheduleBtn = document.getElementById('toggle-schedule-btn');
if (scheduleWrapper) scheduleWrapper.style.display = 'none';
if (scheduleBtn) scheduleBtn.innerText = 'View Schedule';

// --- GEMINI API CALL FUNCTION (Updated to gemini-2.5-flash) ---
async function callGeminiAPI(promptText) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key is required.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error (${response.status}): ${errorBody || response.statusText}`);
  }

  const data = await response.json();
  const textOutput = data.candidates[0].content.parts[0].text;
  
  let cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson);
}

// --- AI QUIZ GENERATOR ---
const generateContentBtn = document.getElementById('generate-content-btn');
if (generateContentBtn) {
  generateContentBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('notes-input');
    const countEl = document.getElementById('question-count');
    const displayArea = document.getElementById('content-display-area');

    if (!notesEl || !displayArea) return;
    const notes = notesEl.value.trim();
    const count = parseInt(countEl ? countEl.value : '10', 10) || 10;

    if (!notes) {
      displayArea.innerHTML = "<p style='color: #ef4444;'>Please enter some study notes first.</p>";
      return;
    }

    displayArea.innerHTML = "<p style='color: #94a3b8;'>🤖 Gemini is analyzing your text and generating smart questions...</p>";

    try {
      const prompt = `Based on the following text, generate exactly ${count} multiple-choice quiz questions. 
      Return ONLY valid JSON in this exact array format:
      [
        {
          "question": "Clear question text?",
          "options": ["Correct Answer", "Wrong Option 1", "Wrong Option 2", "Wrong Option 3"],
          "answer": "Correct Answer"
        }
      ]
      Text to analyze: ${notes}`;

      const result = await callGeminiAPI(prompt);
      currentQuizQuestions = result;
      currentQuizIndex = 0;
      userScore = 0;
      renderQuizQuestion();
      recordActivity('quizzes', 1);
    } catch (error) {
      displayArea.innerHTML = `<p style='color: #ef4444;'>Error generating quiz: ${error.message}</p>`;
    }
  });
}

function renderQuizQuestion() {
  const displayArea = document.getElementById('content-display-area');
  if (!displayArea) return;
  const isDark = currentTheme === 'dark';

  if (currentQuizIndex >= currentQuizQuestions.length) {
    displayArea.innerHTML = `
      <div style="background: ${isDark ? '#0f172a' : '#f8fafc'}; padding: 25px; border-radius: 8px; text-align: center; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'};">
        <h3 style="color: #2563eb; margin-top: 0;">Quiz Completed! 🎉 Final Score: ${userScore}/${currentQuizQuestions.length}</h3>
        <button onclick="location.reload()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">Start Over</button>
      </div>
    `;
    return;
  }

  const q = currentQuizQuestions[currentQuizIndex];
  currentCorrectAnswer = q.answer;

  let html = `
    <div style="background: ${isDark ? '#0f172a' : '#f8fafc'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 8px; padding: 20px;">
      <div style="font-size: 0.85rem; color: ${isDark ? '#94a3b8' : '#64748b'}; font-weight: bold; margin-bottom: 10px;">Question ${currentQuizIndex + 1} of ${currentQuizQuestions.length}</div>
      <div style="font-size: 1.1rem; color: inherit; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;" id="options-container">
  `;

  let shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);

  shuffledOptions.forEach((opt, idx) => {
    html += `<button class="quiz-option-btn" onclick="handleOptionClick(this, '${encodeURIComponent(opt)}')" style="text-align: left; padding: 10px 14px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; cursor: pointer; font-size: 0.95rem; color: inherit;">${opt}</button>`;
  });

  html += `</div><div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div><div style="text-align: right; margin-top: 15px;"><button id="next-q-btn" onclick="nextQuestion()" style="display: none; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Next →</button></div></div>`;
  displayArea.innerHTML = html;
}

window.handleOptionClick = function(buttonElement, encodedChosen) {
  const chosen = decodeURIComponent(encodedChosen);
  document.querySelectorAll('.quiz-option-btn').forEach(btn => btn.disabled = true);
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');

  if (chosen.trim() === currentCorrectAnswer.trim()) {
    buttonElement.style.background = "#065f46"; buttonElement.style.borderColor = "#10b981";
    feedbackEl.style.color = "#34d399"; feedbackEl.innerText = "Correct!";
    userScore++;
  } else {
    buttonElement.style.background = "#991b1b"; buttonElement.style.borderColor = "#ef4444";
    feedbackEl.style.color = "#f87171"; feedbackEl.innerText = `Incorrect. Correct Answer: ${currentCorrectAnswer}`;
  }
  if (nextBtn) nextBtn.style.display = 'inline-block';
};

window.nextQuestion = function() { currentQuizIndex++; renderQuizQuestion(); };

// --- AI FLASHCARD GENERATOR ---
function renderFlashcardPlayer() {
  const displayArea = document.getElementById('flashcard-display-area');
  if (!displayArea) return;
  const isDark = currentTheme === 'dark';

  if (flashcardDeck.length === 0) {
    displayArea.innerHTML = `<p style='color: #94a3b8; font-size: 0.9rem; text-align: center; padding: 15px;'>No flashcards available. Generate them above!</p>`;
    return;
  }

  if (currentCardIndex >= flashcardDeck.length) currentCardIndex = 0;
  const currentCard = flashcardDeck[currentCardIndex];

  displayArea.innerHTML = `
    <div style="background: ${isDark ? '#0f172a' : '#f8fafc'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 8px; padding: 20px; text-align: center; min-height: 120px; cursor: pointer; position: relative;" onclick="flipCardContent()">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 0.8rem; color: ${isDark ? '#94a3b8' : '#64748b'}; font-weight: 600;">Card ${currentCardIndex + 1} of ${flashcardDeck.length}</div>
        <button onclick="event.stopPropagation(); deleteCurrentCard(${currentCardIndex})" title="Delete Card" style="background: transparent; color: #ef4444; border: none; cursor: pointer; font-size: 0.85rem;">🗑️</button>
      </div>
      <div style="font-size: 1.1rem; color: inherit; margin: 15px 0; font-weight: 500;">${isShowingFront ? currentCard.front : currentCard.back}</div>
      <div style="font-size: 0.75rem; color: ${isDark ? '#64748b' : '#94a3b8'};">(Click card to flip)</div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
      <button onclick="prevCard()" style="background: ${isDark ? '#334155' : '#e2e8f0'}; color: inherit; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Previous</button>
      <button onclick="flipCardContent()" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Flip</button>
      <button onclick="nextCard()" style="background: ${isDark ? '#334155' : '#e2e8f0'}; color: inherit; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Next</button>
    </div>
  `;
}

window.flipCardContent = function() { isShowingFront = !isShowingFront; renderFlashcardPlayer(); };
window.prevCard = function() { if (currentCardIndex > 0) { currentCardIndex--; isShowingFront = true; renderFlashcardPlayer(); } };
window.nextCard = function() { 
  if (currentCardIndex < flashcardDeck.length - 1) { 
    currentCardIndex++; 
    isShowingFront = true; 
    renderFlashcardPlayer(); 
    recordActivity('flashcards', 1); 
  } 
};
window.deleteCurrentCard = function(index) { flashcardDeck.splice(index, 1); currentCardIndex = 0; renderFlashcardPlayer(); };

const generateFlashcardsBtn = document.getElementById('generate-flashcards-btn');
if (generateFlashcardsBtn) {
  generateFlashcardsBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('flashcard-notes');
    const countEl = document.getElementById('flashcard-count');
    const displayArea = document.getElementById('flashcard-display-area');
    if (!notesEl || !displayArea) return;
    const notes = notesEl.value.trim();
    const count = parseInt(countEl ? countEl.value : '10', 10) || 10;
    if (!notes) return;

    displayArea.innerHTML = "<p style='color: #94a3b8; font-size: 0.9rem;'>🤖 Generating flashcards with Gemini...</p>";

    try {
      const prompt = `Based on the following text, generate exactly ${count} flashcards. 
      Return ONLY valid JSON in this exact array format:
      [
        {
          "front": "Key term or concept",
          "back": "Detailed definition or explanation"
        }
      ]
      Text to analyze: ${notes}`;

      const result = await callGeminiAPI(prompt);
      flashcardDeck = flashcardDeck.concat(result);
      currentCardIndex = flashcardDeck.length - result.length;
      isShowingFront = true;
      notesEl.value = '';
      renderFlashcardPlayer();
    } catch (error) {
      displayArea.innerHTML = `<p style='color: #ef4444;'>Error generating flashcards: ${error.message}</p>`;
    }
  });
}

// Initialize on page load
applyTheme(currentTheme);
renderTasks();
updateAnalyticsDisplay();
renderFlashcardPlayer();
renderScheduleTable();