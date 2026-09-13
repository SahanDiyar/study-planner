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
let currentQuizMode = "mcq"; // "mcq", "blank", "matching", "worksheet"
let shuffledDefinitionsPool = [];

// --- API KEY HELPER ---
function getApiKey() {
  return "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";
}

// --- THEME / DARK MODE MANAGER ---
let currentTheme = localStorage.getItem('study_hub_theme') || 'light';

function applyTheme(theme) {
  const body = document.getElementById('body-layout');
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const cards = document.querySelectorAll('.theme-card');
  const texts = document.querySelectorAll('.theme-text');
  const textSubs = document.querySelectorAll('.theme-text-sub');
  const inputs = document.querySelectorAll('input[type="text"], textarea, select');
  const tableHeaders = document.querySelectorAll('.theme-table-header');

  if (theme === 'dark') {
    if (body) { body.style.background = '#0f172a'; body.style.color = '#f8fafc'; }
    if (toggleBtn) { toggleBtn.innerText = '☀️ Light Mode'; toggleBtn.style.background = '#334155'; toggleBtn.style.color = '#f8fafc'; }
    
    cards.forEach(card => { card.style.background = '#1e293b'; card.style.border = '1px solid #334155'; });
    texts.forEach(t => t.style.color = '#f8fafc');
    textSubs.forEach(ts => ts.style.color = '#94a3b8');
    
    inputs.forEach(inp => { 
      inp.style.background = '#0f172a'; 
      inp.style.borderColor = '#475569'; 
      inp.style.color = '#f8fafc'; 
    });
    
    tableHeaders.forEach(th => { th.style.background = '#0f172a'; th.style.color = '#cbd5e1'; });
  } else {
    if (body) { body.style.background = '#f1f5f9'; body.style.color = '#1e293b'; }
    if (toggleBtn) { toggleBtn.innerText = '🌙 Dark Mode'; toggleBtn.style.background = '#e2e8f0'; toggleBtn.style.color = '#1e293b'; }
    
    cards.forEach(card => { card.style.background = 'white'; card.style.border = 'none'; });
    texts.forEach(t => t.style.color = '#334155');
    textSubs.forEach(ts => ts.style.color = '#64748b');
    
    inputs.forEach(inp => { 
      inp.style.background = '#ffffff'; 
      inp.style.borderColor = '#cbd5e1'; 
      inp.style.color = '#1e293b'; 
    });
    
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
      html += `<td style="padding: 6px; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'};"><input type="text" data-day="${day}" data-period="${i}" value="${val}" placeholder="Subject ${i + 1}" style="width: 100%; padding: 6px; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 4px; font-size: 0.85rem; text-align: center; background: ${isDark ? '#0f172a' : '#ffffff'}; color: ${isDark ? '#f8fafc' : '#1e293b'};"></td>`;
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

// --- GROQ API CALL FUNCTION ---
async function callGeminiAPI(promptText) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key is required.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: promptText }]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error (${response.status}): ${errorBody || response.statusText}`);
  }

  const data = await response.json();
  const textOutput = data.choices[0].message.content;
  
  let cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson);
}

// --- AI QUIZ GENERATOR ---
const generateContentBtn = document.getElementById('generate-content-btn');
if (generateContentBtn) {
  generateContentBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('notes-input');
    const countEl = document.getElementById('question-count');
    const typeEl = document.getElementById('quiz-type') || document.querySelectorAll('select')[0];
    const displayArea = document.getElementById('content-display-area');

    if (!notesEl || !displayArea) return;
    const notes = notesEl.value.trim();
    const count = parseInt(countEl ? countEl.value : '10', 10) || 10;
    const quizType = typeEl ? typeEl.value : 'Multiple Choice (MCQ)';

    if (!notes) {
      displayArea.innerHTML = "<p style='color: #ef4444;'>Please enter some study notes first.</p>";
      return;
    }

    displayArea.innerHTML = "<p style='color: #94a3b8;'>🤖 Groq is analyzing your text and generating your activity...</p>";

    try {
      let prompt = "";
      const lowerType = quizType.toLowerCase();

      if (lowerType.includes("blank") || lowerType.includes("fill")) {
        currentQuizMode = "blank";
        prompt = `Based on the following text, generate exactly ${count} fill-in-the-blank questions. Use underscores (e.g., "_____") for the missing word or phrase.
        Return ONLY valid JSON in this exact array format, with no extra text or markdown formatting outside the JSON array:
        [
          {
            "question": "Sentence with a blank, e.g., Silas worked as a _____ for forty years.",
            "answer": "correct word"
          }
        ]
        Text to analyze: ${notes}`;
      } else if (lowerType.includes("match")) {
        currentQuizMode = "matching";
        prompt = `Based on the following text, generate exactly ${count} matching pairs pairing a key term with its correct definition.
        Return ONLY valid JSON in this exact array format, with no extra text or markdown formatting outside the JSON array:
        [
          {
            "term": "Key term or concept",
            "answer": "Correct definition or explanation"
          }
        ]
        Text to analyze: ${notes}`;
      } else if (lowerType.includes("worksheet") || lowerType.includes("study")) {
        currentQuizMode = "worksheet";
        prompt = `Based on the following text, generate exactly ${count} open-ended study worksheet questions requiring short answers or explanations.
        Return ONLY valid JSON in this exact array format, with no extra text or markdown formatting outside the JSON array:
        [
          {
            "question": "Open-ended study question?",
            "answer": "Detailed model answer / explanation"
          }
        ]
        Text to analyze: ${notes}`;
      } else {
        currentQuizMode = "mcq";
        prompt = `Based on the following text, generate exactly ${count} multiple-choice quiz questions. 
        Return ONLY valid JSON in this exact array format, with no extra text or markdown formatting outside the JSON array:
        [
          {
            "question": "Clear question text?",
            "options": ["Correct Answer", "Wrong Option 1", "Wrong Option 2", "Wrong Option 3"],
            "answer": "Correct Answer"
          }
        ]
        Text to analyze: ${notes}`;
      }

      const result = await callGeminiAPI(prompt);
      currentQuizQuestions = result;
      currentQuizIndex = 0;
      userScore = 0;

      if (currentQuizMode === "matching") {
        // Shuffle definitions pool for matching dropdowns
        shuffledDefinitionsPool = result.map(item => item.answer).sort(() => Math.random() - 0.5);
      }

      renderQuizQuestion();
      recordActivity('quizzes', 1);
    } catch (error) {
      displayArea.innerHTML = `<p style='color: #ef4444;'>Error generating activity: ${error.message}</p>`;
    }
  });
}

function renderQuizQuestion() {
  const displayArea = document.getElementById('content-display-area');
  if (!displayArea) return;
  const isDark = currentTheme === 'dark';

  if (currentQuizMode === "matching") {
    let html = `
      <div style="background: ${isDark ? '#0f172a' : '#f8fafc'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 8px; padding: 20px;">
        <h3 style="margin-top: 0; color: #3b82f6;">Matching Pairs Worksheet</h3>
        <p style="font-size: 0.9rem; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-bottom: 20px;">Select the correct definition from the dropdown for each term below:</p>
        <div style="display: flex; flex-direction: column; gap: 15px;">
    `;

    currentQuizQuestions.forEach((q, index) => {
      html += `
        <div style="display: flex; flex-direction: column; gap: 6px; padding: 12px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px;">
          <div style="font-weight: bold; color: inherit; font-size: 1rem;">${index + 1}. ${q.term}</div>
          <select id="match-select-${index}" style="padding: 8px 12px; background: ${isDark ? '#0f172a' : '#f8fafc'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 4px; color: inherit; font-size: 0.9rem; width: 100%;">
            <option value="">-- Select definition --</option>
      `;
      shuffledDefinitionsPool.forEach(def => {
        html += `<option value="${encodeURIComponent(def)}">${def}</option>`;
      });
      html += `</select><div id="match-feedback-${index}" style="font-size: 0.85rem; font-weight: bold;"></div></div>`;
    });

    html += `
        </div>
        <div style="margin-top: 20px; text-align: right;">
          <button onclick="checkMatchingAnswers()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Check Answers</button>
        </div>
        <div id="matching-score-summary" style="margin-top: 15px; font-weight: bold; font-size: 1rem; text-align: center;"></div>
      </div>
    `;
    displayArea.innerHTML = html;
    return;
  }

  if (currentQuizIndex >= currentQuizQuestions.length) {
    displayArea.innerHTML = `
      <div style="background: ${isDark ? '#0f172a' : '#f8fafc'}; padding: 25px; border-radius: 8px; text-align: center; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'};">
        <h3 style="color: #2563eb; margin-top: 0;">Activity Completed! 🎉 Final Score: ${userScore}/${currentQuizQuestions.length}</h3>
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
  `;

  if (currentQuizMode === "blank") {
    html += `
      <div style="font-size: 1.1rem; color: inherit; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <input type="text" id="blank-user-answer" placeholder="Type your answer here..." style="padding: 10px 14px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; font-size: 1rem; color: inherit; width: 100%; box-sizing: border-box;">
        <button onclick="submitBlankAnswer()" style="background: #2563eb; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; width: fit-content;">Submit Answer</button>
      </div>
    `;
  } else if (currentQuizMode === "worksheet") {
    html += `
      <div style="font-size: 1.1rem; color: inherit; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <textarea id="worksheet-user-answer" rows="3" placeholder="Write your notes or explanation here..." style="padding: 10px 14px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; font-size: 1rem; color: inherit; width: 100%; box-sizing: border-box;"></textarea>
        <button onclick="revealWorksheetAnswer()" id="reveal-btn" style="background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; width: fit-content;">Show Model Answer</button>
        <div id="model-answer-box" style="display: none; margin-top: 10px; padding: 12px; background: ${isDark ? '#334155' : '#f1f5f9'}; border-radius: 6px; font-size: 0.95rem; color: inherit;">
          <strong>Model Answer:</strong> ${q.answer}
        </div>
      </div>
    `;
  } else {
    // MCQ
    html += `
      <div style="font-size: 1.1rem; color: inherit; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;" id="options-container">
    `;
    let shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
    shuffledOptions.forEach((opt) => {
      html += `<button class="quiz-option-btn" onclick="handleOptionClick(this, '${encodeURIComponent(opt)}')" style="text-align: left; padding: 10px 14px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; cursor: pointer; font-size: 0.95rem; color: inherit;">${opt}</button>`;
    });
    html += `</div>`;
  }

  html += `<div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div><div style="text-align: right; margin-top: 15px;"><button id="next-q-btn" onclick="nextQuestion()" style="display: none; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Next →</button></div></div>`;
  displayArea.innerHTML = html;
}

window.handleOptionClick = function(buttonElement, encodedChosen) {
  const chosen = decodeURIComponent(encodedChosen);
  document.querySelectorAll('.quiz-option-btn').forEach(btn => btn.disabled = true);
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');

  if (chosen.trim().toLowerCase() === currentCorrectAnswer.trim().toLowerCase()) {
    buttonElement.style.background = "#065f46"; buttonElement.style.borderColor = "#10b981";
    feedbackEl.style.color = "#34d399"; feedbackEl.innerText = "Correct!";
    userScore++;
  } else {
    buttonElement.style.background = "#991b1b"; buttonElement.style.borderColor = "#ef4444";
    feedbackEl.style.color = "#f87171"; feedbackEl.innerText = `Incorrect. Correct Answer: ${currentCorrectAnswer}`;
  }
  if (nextBtn) nextBtn.style.display = 'inline-block';
};

window.submitBlankAnswer = function() {
  const inputEl = document.getElementById('blank-user-answer');
  if (!inputEl) return;
  const userAns = inputEl.value.trim().toLowerCase();
  const correctAns = currentCorrectAnswer.trim().toLowerCase();
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');

  inputEl.disabled = true;

  if (userAns === correctAns) {
    inputEl.style.background = "#065f46"; inputEl.style.borderColor = "#10b981";
    feedbackEl.style.color = "#34d399"; feedbackEl.innerText = "Correct!";
    userScore++;
  } else {
    inputEl.style.background = "#991b1b"; inputEl.style.borderColor = "#ef4444";
    feedbackEl.style.color = "#f87171"; feedbackEl.innerText = `Incorrect. Correct Answer: ${currentCorrectAnswer}`;
  }
  if (nextBtn) nextBtn.style.display = 'inline-block';
};

window.checkMatchingAnswers = function() {
  let correctCount = 0;
  currentQuizQuestions.forEach((q, index) => {
    const selectEl = document.getElementById(`match-select-${index}`);
    const feedbackEl = document.getElementById(`match-feedback-${index}`);
    if (!selectEl || !feedbackEl) return;

    selectEl.disabled = true;
    const selectedVal = decodeURIComponent(selectEl.value).trim().toLowerCase();
    const correctVal = q.answer.trim().toLowerCase();

    if (selectedVal === correctVal) {
      selectEl.style.background = "#065f46"; selectEl.style.borderColor = "#10b981";
      feedbackEl.style.color = "#34d399"; feedbackEl.innerText = "✓ Correct match!";
      correctCount++;
    } else {
      selectEl.style.background = "#991b1b"; selectEl.style.borderColor = "#ef4444";
      feedbackEl.style.color = "#f87171"; feedbackEl.innerText = `✗ Correct definition: ${q.answer}`;
    }
  });

  const summaryEl = document.getElementById('matching-score-summary');
  if (summaryEl) {
    summaryEl.style.color = "#3b82f6";
    summaryEl.innerText = `Matching Completed! Score: ${correctCount}/${currentQuizQuestions.length}`;
  }
};

window.revealWorksheetAnswer = function() {
  const box = document.getElementById('model-answer-box');
  const revealBtn = document.getElementById('reveal-btn');
  const nextBtn = document.getElementById('next-q-btn');
  if (box) box.style.display = 'block';
  if (revealBtn) revealBtn.style.display = 'none';
  if (nextBtn) nextBtn.style.display = 'inline-block';
  userScore++;
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

    displayArea.innerHTML = "<p style='color: #94a3b8; font-size: 0.9rem;'>🤖 Generating flashcards with Groq...</p>";

    try {
      const prompt = `Based on the following text, generate exactly ${count} flashcards. 
      Return ONLY valid JSON in this exact array format, with no extra text or markdown formatting outside the JSON array:
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