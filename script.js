let tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
let activityLog = JSON.parse(localStorage.getItem('study_activity_log')) || [];

const todayStr = new Date().toDateString();
const lastActiveDate = localStorage.getItem('study_last_active_date');

if (lastActiveDate !== todayStr) {
  activityLog = [];
  localStorage.setItem('study_activity_log', JSON.stringify(activityLog));
  localStorage.setItem('study_last_active_date', todayStr);
}

// --- FLASHCARD STATE & SUBJECT TAGGING ---
let flashcardDeck = JSON.parse(localStorage.getItem('study_flashcard_deck')) || [];
let currentCardIndex = 0;
let isShowingFront = true;
let currentSubjectFilter = 'All';

let currentQuizQuestions = [];
let currentQuizIndex = 0;
let userScore = 0;
let currentMatchingPairs = [];
let currentCorrectAnswer = "";

let selectedTerm = null;
let userMatches = {};

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

// --- WEEKLY TABLE SCHEDULE LOGIC ---
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
  if (wrapper.style.display === 'none') { wrapper.style.display = 'block'; btn.innerText = 'Hide Schedule'; }
  else { wrapper.style.display = 'none'; btn.innerText = 'View Schedule'; }
};

// --- SMART CURRICULUM QUIZ GENERATOR ---
const generateContentBtn = document.getElementById('generate-content-btn');
if (generateContentBtn) {
  generateContentBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('notes-input');
    const activityTypeEl = document.getElementById('quiz-type');
    const countEl = document.getElementById('question-count');
    const displayArea = document.getElementById('content-display-area');

    if (!notesEl || !displayArea) return;
    const notes = notesEl.value.trim();
    const activityType = activityTypeEl ? activityTypeEl.value : 'Multiple Choice (MCQ)';
    const count = parseInt(countEl ? countEl.value : '10', 10) || 10;

    if (!notes) {
      displayArea.innerHTML = "<p style='color: #ef4444;'>Please enter some notes first.</p>";
      return;
    }

    displayArea.innerHTML = "<p style='color: #94a3b8;'>Formulating school-style test questions...</p>";

    setTimeout(() => {
      let sentences = notes.match(/[^.!?]+[.!?]+/g) || [notes];
      sentences = sentences.map(s => s.trim()).filter(s => s.length > 5);
      
      if (sentences.length === 0) sentences = [notes];
      currentQuizQuestions = [];

      if (activityType.toLowerCase().includes('match')) {
        let pairs = [];
        sentences.forEach((sent, idx) => {
          let words = sent.split(' ');
          let keyTerm = words.slice(0, 3).join(' ') + (words.length > 3 ? '...' : '');
          pairs.push({ term: keyTerm, definition: sent });
        });
        while(pairs.length < count) {
          pairs.push({ term: `Concept ${pairs.length + 1}`, definition: sentences[pairs.length % sentences.length] });
        }
        currentQuizQuestions = [{ type: "matching", pairs: pairs.slice(0, count) }];

      } else if (activityType.includes('Worksheet') || activityType.includes('Q&A')) {
        let questions = sentences.map(s => `Explain the core concept and importance of: "${s.slice(0, 50)}..."`);
        while(questions.length < count) {
          questions.push(`Define and explain the principles behind: "${sentences[questions.length % sentences.length].slice(0, 40)}..."`);
        }
        currentQuizQuestions.push({
          type: "worksheet",
          questions: questions.slice(0, count),
          answers: sentences.slice(0, count)
        });

      } else if (activityType.includes('Blank') || activityType.includes('fill')) {
        currentQuizQuestions = sentences.slice(0, count).map((sent, idx) => {
          let words = sent.split(' ');
          let targetWordIdx = Math.min(2, words.length - 1);
          let targetWord = words[targetWordIdx].replace(/[^a-zA-Z]/g, '');
          if (!targetWord) targetWord = "process";
          
          words[targetWordIdx] = "_____";
          return {
            type: "blank",
            question: `Fill in the missing term: "${words.join(' ')}"`,
            answer: targetWord
          };
        });
        while(currentQuizQuestions.length < count) {
          currentQuizQuestions.push({
            type: "blank",
            question: `Complete the rule or definition: A key component involves _____ and structural functions.`,
            answer: "systems"
          });
        }

      } else {
        // Curriculum Multiple Choice Style
        currentQuizQuestions = sentences.slice(0, count).map((sent, idx) => {
          let words = sent.split(' ');
          let concept = words.slice(0, 3).join(' ');
          
          let wrongOptions = sentences.filter((_, i) => i !== idx).map(s => s.slice(0, 40) + "...");
          if (wrongOptions.length < 3) {
            wrongOptions = [
              "Alternative structural regulation mechanism", 
              "Secondary metabolic pathway process", 
              "None of the above principles apply"
            ];
          }
          
          let options = [
            sent, 
            wrongOptions[0] || "Standard secondary process", 
            wrongOptions[1] || "Alternative regulatory function", 
            wrongOptions[2] || "Inapplicable property"
          ].sort(() => Math.random() - 0.5);
          
          return {
            question: `Which of the following statements is accurate regarding "${concept}..."?`,
            options: options,
            answer: sent
          };
        });
      }

      currentQuizIndex = 0;
      userScore = 0;
      renderQuizQuestion();
      recordActivity('quizzes', 1);
    }, 50);
  });
}

function renderQuizQuestion() {
  const displayArea = document.getElementById('content-display-area');
  if (!displayArea) return;

  const isDark = currentTheme === 'dark';

  if (currentQuizIndex >= currentQuizQuestions.length) {
    displayArea.innerHTML = `
      <div style="background: ${isDark ? '#0f172a' : '#f8fafc'}; padding: 25px; border-radius: 8px; text-align: center; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'};">
        <h3 style="color: #2563eb; margin-top: 0;">Quiz Completed! 🎉 Final Score: ${userScore}/${currentQuizQuestions.length || 1}</h3>
        <button onclick="location.reload()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">Generate New Quiz</button>
      </div>
    `;
    return;
  }

  const q = currentQuizQuestions[currentQuizIndex];
  const type = q.type || (q.questions ? 'worksheet' : (q.pairs ? 'matching' : 'mcq'));

  let html = `<div style="background: ${isDark ? '#0f172a' : '#f8fafc'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 8px; padding: 20px;">`;

  if (type === 'matching' && q.pairs) {
    selectedTerm = null;
    userMatches = {};
    currentMatchingPairs = q.pairs;
    const shuffledDefs = [...q.pairs].map(p => p.definition).sort(() => Math.random() - 0.5);
    const shuffledTerms = [...q.pairs].map(p => p.term).sort(() => Math.random() - 0.5);

    html += `
      <h3 style="color: inherit; margin-top: 0; border-bottom: 2px solid ${isDark ? '#334155' : '#cbd5e1'}; padding-bottom: 8px;">Matching Quiz</h3>
      <p style="color: ${isDark ? '#94a3b8' : '#64748b'}; font-size: 0.9rem; margin-bottom: 15px;">Click a term on the left, then click its corresponding definition on the right:</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;" id="matching-board">
        <div style="display: flex; flex-direction: column; gap: 10px;" id="terms-column">
          <h4 style="margin: 0; color: ${isDark ? '#cbd5e1' : '#475569'}; font-size: 0.95rem;">Terms</h4>
          ${shuffledTerms.map(t => `<div onclick="selectMatchingTerm(this, window.decodeURIComponent('${encodeURIComponent(t)}'))" data-term="${t}" class="match-term-card" style="padding: 12px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; cursor: pointer; font-weight: 500; color: inherit; transition: all 0.2s;">${t}</div>`).join('')}
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;" id="defs-column">
          <h4 style="margin: 0; color: ${isDark ? '#cbd5e1' : '#475569'}; font-size: 0.95rem;">Definitions</h4>
          ${shuffledDefs.map(d => `<div onclick="selectMatchingDef(this, window.decodeURIComponent('${encodeURIComponent(d)}'))" data-def="${d}" class="match-def-card" style="padding: 12px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; cursor: pointer; font-size: 0.9rem; color: inherit; transition: all 0.2s;">${d}</div>`).join('')}
        </div>
      </div>
      <div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div>
      <div style="text-align: right; margin-top: 20px;">
        <button id="matching-submit-btn" onclick="handleMatchingSubmit()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Submit Matching</button>
      </div>
    `;
  } else if (type === 'worksheet' && q.questions) {
    html += `
      <h3 style="color: inherit; margin-top: 0; border-bottom: 2px solid ${isDark ? '#334155' : '#cbd5e1'}; padding-bottom: 8px;">Study Worksheet</h3>
      <div style="margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
        <ol style="padding-left: 20px; line-height: 1.6; color: inherit;">
          ${q.questions.map(quest => `<li style="margin-bottom: 8px;">${quest}</li>`).join('')}
        </ol>
      </div>
      <div style="background: ${isDark ? '#1e293b' : '#f1f5f9'}; padding: 15px; border-radius: 6px; border: 1px dashed ${isDark ? '#475569' : '#94a3b8'}; max-height: 200px; overflow-y: auto;">
        <h4 style="color: ${isDark ? '#cbd5e1' : '#475569'}; margin-top: 0; margin-bottom: 10px;">Answer Key / Reference:</h4>
        <ul style="padding-left: 20px; line-height: 1.6; color: inherit; list-style-type: disc;">
          ${q.answers.map(ans => `<li style="margin-bottom: 6px;">${ans}</li>`).join('')}
        </ul>
      </div>
      <div style="text-align: right; margin-top: 20px;">
        <button onclick="nextQuestion()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Finish Quiz →</button>
      </div>
    `;
  } else if (type === 'blank') {
    currentCorrectAnswer = q.answer;
    html += `
      <div style="font-size: 0.85rem; color: ${isDark ? '#94a3b8' : '#64748b'}; font-weight: bold; margin-bottom: 10px;">Question ${currentQuizIndex + 1} of ${currentQuizQuestions.length}</div>
      <div style="font-size: 1.1rem; color: inherit; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <input type="text" id="blank-answer-input" placeholder="Type missing keyword..." style="flex: 1; padding: 10px; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; font-size: 1rem; background: ${isDark ? '#1e293b' : 'transparent'}; color: inherit;">
        <button onclick="handleBlankSubmit()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Submit Answer</button>
      </div>
      <div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div>
      <div style="text-align: right; margin-top: 15px;">
        <button id="next-q-btn" onclick="nextQuestion()" style="display: none; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Next Question →</button>
      </div>
    `;
  } else {
    html += `
      <div style="font-size: 0.85rem; color: ${isDark ? '#94a3b8' : '#64748b'}; font-weight: bold; margin-bottom: 10px;">Question ${currentQuizIndex + 1} of ${currentQuizQuestions.length}</div>
      <div style="font-size: 1.1rem; color: inherit; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;" id="options-container">
    `;
    q.options.forEach((opt, idx) => {
      html += `<button class="quiz-option-btn" onclick="handleOptionClick(this, ${idx})" style="text-align: left; padding: 12px 16px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; cursor: pointer; font-size: 1rem; color: inherit;">${opt}</button>`;
    });
    html += `</div><div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div><div style="text-align: right; margin-top: 15px;"><button id="next-q-btn" onclick="nextQuestion()" style="display: none; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Next Question →</button></div>`;
  }

  html += `</div>`;
  displayArea.innerHTML = html;
}

window.selectMatchingTerm = function(element, term) {
  document.querySelectorAll('.match-term-card').forEach(card => {
    card.style.borderColor = currentTheme === 'dark' ? '#475569' : '#cbd5e1';
    card.style.background = currentTheme === 'dark' ? '#1e293b' : 'white';
  });
  element.style.borderColor = '#2563eb';
  element.style.background = currentTheme === 'dark' ? '#1e3a8a' : '#eff6ff';
  selectedTerm = term;
};

window.selectMatchingDef = function(element, definition) {
  if (!selectedTerm) {
    alert("Please select a Term on the left first!");
    return;
  }
  userMatches[selectedTerm] = definition;
  
  document.querySelectorAll('.match-def-card').forEach(card => {
    if (card.getAttribute('data-def') === definition) {
      card.style.borderColor = '#3b82f6';
      card.style.background = currentTheme === 'dark' ? '#1e3a8a' : '#eff6ff';
    }
  });
  
  document.querySelectorAll('.match-term-card').forEach(card => {
    if (card.getAttribute('data-term') === selectedTerm) {
      card.style.borderColor = '#3b82f6';
      card.style.background = currentTheme === 'dark' ? '#1e3a8a' : '#eff6ff';
    }
  });
  selectedTerm = null;
};

window.handleMatchingSubmit = function() {
  const feedbackEl = document.getElementById('quiz-feedback');
  let correctCount = 0;
  const pairs = currentMatchingPairs;

  const correctMap = {};
  pairs.forEach(p => { correctMap[p.term] = p.definition.trim(); });

  document.querySelectorAll('.match-term-card').forEach(termCard => {
    const term = termCard.getAttribute('data-term');
    const userChosenDef = userMatches[term];

    if (!userChosenDef) {
      termCard.style.borderColor = currentTheme === 'dark' ? '#475569' : '#cbd5e1';
      termCard.style.background = currentTheme === 'dark' ? '#1e293b' : '#f1f5f9';
      return;
    }

    if (userChosenDef.trim() === correctMap[term]) {
      correctCount++;
      termCard.style.borderColor = '#10b981';
      termCard.style.background = '#065f46';
      termCard.innerHTML = `✅ ${term}`;
    } else {
      termCard.style.borderColor = '#ef4444';
      termCard.style.background = '#991b1b';
      termCard.innerHTML = `❌ ${term}`;
    }
  });

  userScore = correctCount;
  if (feedbackEl) {
    feedbackEl.style.color = correctCount === pairs.length ? "#34d399" : "#f87171";
    feedbackEl.innerText = `You correctly matched ${correctCount} out of ${pairs.length} pairs!`;
  }

  const submitBtn = document.getElementById('matching-submit-btn');
  if (submitBtn) {
    submitBtn.innerText = "Next Activity →";
    submitBtn.onclick = () => { currentQuizIndex++; renderQuizQuestion(); };
  }
};

window.handleOptionClick = function(buttonElement, optionIndex) {
  const q = currentQuizQuestions[currentQuizIndex];
  const chosen = q.options[optionIndex];
  const correct = q.answer;

  document.querySelectorAll('.quiz-option-btn').forEach(btn => btn.disabled = true);
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');

  if (chosen.trim() === correct.trim()) {
    buttonElement.style.background = "#065f46"; buttonElement.style.borderColor = "#10b981";
    feedbackEl.style.color = "#34d399"; feedbackEl.innerText = "Correct! Great job.";
    userScore++;
  } else {
    buttonElement.style.background = "#991b1b"; buttonElement.style.borderColor = "#ef4444";
    feedbackEl.style.color = "#f87171"; feedbackEl.innerText = `Incorrect. Correct answer: ${correct}`;
  }
  if (nextBtn) nextBtn.style.display = 'inline-block';
};

window.handleBlankSubmit = function() {
  const inputEl = document.getElementById('blank-answer-input');
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');
  if (!inputEl) return;

  const val = inputEl.value.trim();
  inputEl.disabled = true;
  if (val.toLowerCase() === currentCorrectAnswer.toLowerCase()) {
    feedbackEl.style.color = "#34d399"; feedbackEl.innerText = "Correct!"; userScore++;
  } else {
    feedbackEl.style.color = "#f87171"; feedbackEl.innerText = `Incorrect. Expected: "${currentCorrectAnswer}"`;
  }
  if (nextBtn) nextBtn.style.display = 'inline-block';
};

window.nextQuestion = function() { currentQuizIndex++; renderQuizQuestion(); };

// --- FLASHCARD SYSTEM WITH SUBJECT TAGS ---
const modeAutoBtn = document.getElementById('mode-auto-btn');
const modeManualBtn = document.getElementById('mode-manual-btn');
const autoContainer = document.getElementById('flashcard-auto-container');
const manualContainer = document.getElementById('flashcard-manual-container');

if (modeAutoBtn && modeManualBtn) {
  modeAutoBtn.addEventListener('click', () => {
    autoContainer.style.display = 'block';
    manualContainer.style.display = 'none';
    modeAutoBtn.style.background = '#7c3aed';
    modeAutoBtn.style.color = 'white';
    modeManualBtn.style.background = currentTheme === 'dark' ? '#334155' : '#e2e8f0';
    modeManualBtn.style.color = currentTheme === 'dark' ? '#f8fafc' : '#334155';
  });
  modeManualBtn.addEventListener('click', () => {
    autoContainer.style.display = 'none';
    manualContainer.style.display = 'block';
    modeManualBtn.style.background = '#7c3aed';
    modeManualBtn.style.color = 'white';
    modeAutoBtn.style.background = currentTheme === 'dark' ? '#334155' : '#e2e8f0';
    modeAutoBtn.style.color = currentTheme === 'dark' ? '#f8fafc' : '#334155';
  });
}

window.handleSubjectDropdownChange = function() {
  const select = document.getElementById('flashcard-subject-select');
  const customInput = document.getElementById('custom-subject-input');
  if (!select || !customInput) return;

  if (select.value === 'Custom') {
    customInput.style.display = 'block';
    customInput.focus();
  } else {
    customInput.style.display = 'none';
    customInput.value = '';
  }
};

function getSelectedSubject() {
  const select = document.getElementById('flashcard-subject-select');
  const customInput = document.getElementById('custom-subject-input');
  if (!select) return 'General';

  if (select.value === 'Custom' && customInput && customInput.value.trim()) {
    return customInput.value.trim();
  }
  return select.value || 'General';
}

function updateSubjectFilterDropdown() {
  const filterSelect = document.getElementById('filter-subject-select');
  if (!filterSelect) return;

  const subjects = [...new Set(flashcardDeck.map(card => card.subject || 'General'))];
  
  let optionsHtml = `<option value="All" style="background: inherit; color: inherit;">All Subjects (${flashcardDeck.length})</option>`;
  subjects.forEach(subj => {
    const count = flashcardDeck.filter(c => (c.subject || 'General') === subj).length;
    const selected = currentSubjectFilter === subj ? 'selected' : '';
    optionsHtml += `<option value="${subj}" ${selected} style="background: inherit; color: inherit;">${subj} (${count})</option>`;
  });
  
  filterSelect.innerHTML = optionsHtml;
}

window.handleFilterChange = function() {
  const filterSelect = document.getElementById('filter-subject-select');
  if (!filterSelect) return;
  currentSubjectFilter = filterSelect.value;
  currentCardIndex = 0;
  isShowingFront = true;
  renderFlashcardPlayer();
};

function getFilteredDeck() {
  if (currentSubjectFilter === 'All') return flashcardDeck;
  return flashcardDeck.filter(card => (card.subject || 'General') === currentSubjectFilter);
}

function renderFlashcardPlayer() {
  const displayArea = document.getElementById('flashcard-display-area');
  if (!displayArea) return;
  const isDark = currentTheme === 'dark';

  updateSubjectFilterDropdown();
  const activeDeck = getFilteredDeck();

  if (activeDeck.length === 0) {
    displayArea.innerHTML = `<p style='color: #94a3b8; font-size: 0.9rem; text-align: center; padding: 15px;'>No flashcards found for "${currentSubjectFilter}".</p>`;
    return;
  }

  if (currentCardIndex >= activeDeck.length) {
    currentCardIndex = 0;
  }

  const currentCard = activeDeck[currentCardIndex];
  const cardSubject = currentCard.subject || 'General';

  displayArea.innerHTML = `
    <div style="background: ${isDark ? '#0f172a' : '#f8fafc'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 8px; padding: 20px; text-align: center; min-height: 120px; cursor: pointer; position: relative;" onclick="flipCardContent()">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.75rem; background: #7c3aed; color: white; padding: 2px 8px; border-radius: 12px; font-weight: 500;">${cardSubject}</span>
        <div style="font-size: 0.8rem; color: ${isDark ? '#94a3b8' : '#64748b'}; font-weight: 600;">Card ${currentCardIndex + 1} of ${activeDeck.length}</div>
        <button onclick="event.stopPropagation(); deleteCurrentCard(${flashcardDeck.indexOf(currentCard)})" title="Delete Card" style="background: transparent; color: #ef4444; border: none; cursor: pointer; font-size: 0.85rem;">🗑️</button>
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
  const activeDeck = getFilteredDeck();
  if (currentCardIndex < activeDeck.length - 1) { 
    currentCardIndex++; 
    isShowingFront = true; 
    renderFlashcardPlayer(); 
    recordActivity('flashcards', 1); 
  } 
};

window.deleteCurrentCard = function(absoluteIndex) {
  if (absoluteIndex > -1) {
    flashcardDeck.splice(absoluteIndex, 1);
    localStorage.setItem('study_flashcard_deck', JSON.stringify(flashcardDeck));
    currentCardIndex = 0;
    renderFlashcardPlayer();
  }
};

const addManualCardBtn = document.getElementById('add-manual-card-btn');
if (addManualCardBtn) {
  addManualCardBtn.addEventListener('click', () => {
    const frontInput = document.getElementById('manual-front');
    const backInput = document.getElementById('manual-back');
    if (!frontInput || !backInput || !frontInput.value.trim() || !backInput.value.trim()) return;
    
    const subject = getSelectedSubject();
    flashcardDeck.push({ front: frontInput.value.trim(), back: backInput.value.trim(), subject });
    localStorage.setItem('study_flashcard_deck', JSON.stringify(flashcardDeck));
    
    frontInput.value = ''; backInput.value = '';
    currentSubjectFilter = subject;
    currentCardIndex = getFilteredDeck().length - 1; 
    isShowingFront = true;
    renderFlashcardPlayer();
  });
}

// --- SMART DYNAMIC FLASHCARD GENERATOR ---
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

    displayArea.innerHTML = "<p style='color: #94a3b8; font-size: 0.9rem;'>Generating flashcards from your text...</p>";

    setTimeout(() => {
      const subject = getSelectedSubject();
      let sentences = notes.match(/[^.!?]+[.!?]+/g) || [notes];
      sentences = sentences.map(s => s.trim()).filter(s => s.length > 3);

      let newCards = [];
      for (let i = 0; i < Math.min(count, sentences.length); i++) {
        let sent = sentences[i];
        let words = sent.split(' ');
        let frontTerm = words.slice(0, 4).join(' ') + (words.length > 4 ? '?' : '');
        newCards.push({
          front: `Define or explain: "${frontTerm}"`,
          back: sent,
          subject: subject
        });
      }

      while(newCards.length < count) {
        let idx = newCards.length;
        newCards.push({
          front: `Review core principle #${idx + 1} from study text.`,
          back: notes.slice(0, 100) + "...",
          subject: subject
        });
      }

      flashcardDeck = flashcardDeck.concat(newCards);
      localStorage.setItem('study_flashcard_deck', JSON.stringify(flashcardDeck));
      
      currentSubjectFilter = subject;
      currentCardIndex = getFilteredDeck().length - newCards.length; 
      isShowingFront = true;
      notesEl.value = '';
      renderFlashcardPlayer();
    }, 50);
  });
}

// Initialize on page load
applyTheme(currentTheme);
renderTasks();
updateAnalyticsDisplay();
renderFlashcardPlayer();
renderScheduleTable();