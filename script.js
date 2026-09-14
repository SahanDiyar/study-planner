// --- INITIALIZE DATA & DAILY RESET ---
let tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
let activityLog = JSON.parse(localStorage.getItem('study_activity_log')) || [];

const todayStr = new Date().toDateString();
const lastActiveDate = localStorage.getItem('study_last_active_date');

if (lastActiveDate !== todayStr) {
  activityLog = [];
  localStorage.setItem('study_activity_log', JSON.stringify(activityLog));
  localStorage.setItem('study_last_active_date', todayStr);
}

// --- APP STATES ---
let flashcardDeck = [];
let currentCardIndex = 0;
let isShowingFront = true;

let currentQuizQuestions = [];
let currentQuizIndex = 0;
let userScore = 0;
let currentCorrectAnswer = "";
let currentQuizMode = "mcq";

// --- API CONFIGURATION ---
function getApiKey() {
  return "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";
}

// --- THEME MANAGER ---
let currentTheme = localStorage.getItem('study_hub_theme') || 'light';

function applyTheme(theme) {
  const body = document.getElementById('body-layout');
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (theme === 'dark') {
    if (body) body.classList.add('dark');
    if (toggleBtn) toggleBtn.innerText = '☀️ Light Mode';
  } else {
    if (body) body.classList.remove('dark');
    if (toggleBtn) toggleBtn.innerText = '🌙 Dark Mode';
  }
}

window.toggleDarkMode = function() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('study_hub_theme', currentTheme);
  applyTheme(currentTheme);
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
    li.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);";
    li.innerHTML = `
      <span style="${task.completed ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${task.text}</span>
      <div style="display: flex; gap: 10px; align-items: center;">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})" style="width: 18px; height: 18px; margin: 0; cursor: pointer;">
        <button onclick="deleteTask(${index})" style="background: #ef4444; padding: 4px 8px; font-size: 0.8rem;">Delete</button>
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

// --- ACTIVITY & ANALYTICS ---
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
  let html = '';
  for (let i = 0; i < 7; i++) {
    html += `<tr><td style="font-weight: bold;">Period ${i + 1}</td>`;
    days.forEach(day => {
      const val = weeklyScheduleData[day]?.[i] || '';
      html += `<td><input type="text" data-day="${day}" data-period="${i}" value="${val}" placeholder="Sub ${i+1}" style="margin:0; border:none; text-align:center; background:transparent;"></td>`;
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
  if (feedback) { feedback.innerText = "Saved!"; setTimeout(() => { feedback.innerText = ""; }, 2000); }
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

// --- API CALL HELPER ---
async function callGroqAPI(promptText) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is required.");

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
    const typeEl = document.getElementById('quiz-type');
    const displayArea = document.getElementById('content-display-area');

    if (!notesEl || !displayArea) return;
    const notes = notesEl.value.trim();
    const count = parseInt(countEl ? countEl.value : '5', 10) || 5;
    const quizType = typeEl ? typeEl.value : 'Multiple Choice (MCQ)';

    if (!notes) {
      displayArea.innerHTML = "<p style='color: #ef4444;'>Please enter some study notes first.</p>";
      return;
    }

    displayArea.innerHTML = "<p style='color: var(--text-sub);'>🤖 Groq is generating your activity...</p>";

    try {
      let prompt = "";
      const lowerType = quizType.toLowerCase();

      if (lowerType.includes("blank") || lowerType.includes("fill")) {
        currentQuizMode = "blank";
        prompt = `Based on the text, generate exactly ${count} fill-in-the-blank questions using underscores "_____". Return ONLY a valid JSON array: [{"question": "Sentence with _____ blank.", "answer": "word"}] Text: ${notes}`;
      } else if (lowerType.includes("match")) {
        currentQuizMode = "matching";
        prompt = `Based on the text, generate exactly ${count} matching items. Return ONLY a valid JSON array where each object has a 'term' and an 'answer' field: [{"term": "Key term or concept", "answer": "Corresponding definition"}] Text: ${notes}`;
      } else if (lowerType.includes("worksheet") || lowerType.includes("study")) {
        currentQuizMode = "worksheet";
        prompt = `Based on the text, generate exactly ${count} open-ended questions. Return ONLY a valid JSON array: [{"question": "Question?", "answer": "Model answer"}] Text: ${notes}`;
      } else {
        currentQuizMode = "mcq";
        prompt = `Based on the text, generate exactly ${count} multiple-choice questions. Return ONLY a valid JSON array: [{"question": "Question?", "options": ["Correct", "Wrong1", "Wrong2", "Wrong3"], "answer": "Correct"}] Text: ${notes}`;
      }

      const result = await callGroqAPI(prompt);
      
      // If matching mode, structure it properly with terms and randomized answers
      if (currentQuizMode === "matching") {
        currentQuizQuestions = result.map((item, index, arr) => {
          const shuffledAnswers = [...arr].map(x => x.answer).sort(() => Math.random() - 0.5);
          return {
            term: item.term || item.question,
            answer: item.answer,
            options: shuffledAnswers
          };
        });
      } else {
        currentQuizQuestions = result;
      }

      currentQuizIndex = 0;
      userScore = 0;
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

  if (currentQuizIndex >= currentQuizQuestions.length) {
    displayArea.innerHTML = `
      <div style="background: var(--card-bg); padding: 25px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
        <h3 style="color: var(--primary); margin-top: 0;">Activity Completed! 🎉 Score: ${userScore}/${currentQuizQuestions.length}</h3>
        <button onclick="location.reload()" style="margin-top: 10px;">Start Over</button>
      </div>
    `;
    return;
  }

  const q = currentQuizQuestions[currentQuizIndex];
  
  let html = `
    <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
      <div style="font-size: 0.85rem; color: var(--text-sub); font-weight: bold; margin-bottom: 10px;">Question ${currentQuizIndex + 1} of ${currentQuizQuestions.length}</div>
  `;

  if (currentQuizMode === "matching") {
    currentCorrectAnswer = q.answer;
    html += `
      <div style="font-size: 1rem; font-weight: 500; margin-bottom: 15px;">Match the term on the left with its correct definition on the right:</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: start;">
        <div style="background: rgba(37, 99, 235, 0.05); padding: 15px; border-radius: 6px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.8rem; color: var(--text-sub); font-weight: bold; margin-bottom: 5px;">TERM</div>
          <div style="font-size: 1rem; font-weight: 600;" id="matching-term-text">${q.term}</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;" id="options-container">
          <div style="font-size: 0.8rem; color: var(--text-sub); font-weight: bold;">SELECT MATCHING DEFINITION:</div>
    `;
    q.options.forEach((opt) => {
      html += `<button class="quiz-option-btn" onclick="handleOptionClick(this, '${encodeURIComponent(opt)}')" style="text-align: left; background: var(--card-bg); color: var(--text-color); border: 1px solid var(--border-color); padding: 8px 12px; font-size: 0.9rem;">${opt}</button>`;
    });
    html += `</div></div>`;
  } else if (currentQuizMode === "blank") {
    currentCorrectAnswer = q.answer;
    html += `
      <div style="font-size: 1.1rem; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <input type="text" id="blank-user-answer" placeholder="Type your answer...">
      <button onclick="submitBlankAnswer()">Submit Answer</button>
    `;
  } else if (currentQuizMode === "worksheet") {
    currentCorrectAnswer = q.answer;
    html += `
      <div style="font-size: 1.1rem; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <textarea id="worksheet-user-answer" rows="3" placeholder="Write your thoughts..."></textarea>
      <button id="reveal-btn" onclick="revealWorksheetAnswer()">Show Model Answer</button>
      <div id="model-answer-box" style="display: none; margin-top: 10px; padding: 12px; background: rgba(0,0,0,0.05); border-radius: 6px;">
        <strong>Model Answer:</strong> ${q.answer}
      </div>
    `;
  } else {
    currentCorrectAnswer = q.answer;
    html += `
      <div style="font-size: 1.1rem; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;" id="options-container">
    `;
    let shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
    shuffledOptions.forEach((opt) => {
      html += `<button class="quiz-option-btn" onclick="handleOptionClick(this, '${encodeURIComponent(opt)}')" style="text-align: left; background: var(--card-bg); color: var(--text-color); border: 1px solid var(--border-color);">${opt}</button>`;
    });
    html += `</div>`;
  }

  html += `<div id="quiz-feedback" style="margin-top: 15px; font-weight: bold;"></div><div style="text-align: right; margin-top: 15px;"><button id="next-q-btn" onclick="nextQuestion()" style="display: none; background: #10b981;">Next →</button></div></div>`;
  displayArea.innerHTML = html;
}

window.handleOptionClick = function(buttonElement, encodedChosen) {
  const chosen = decodeURIComponent(encodedChosen);
  document.querySelectorAll('.quiz-option-btn').forEach(btn => btn.disabled = true);
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');

  if (chosen.trim().toLowerCase() === currentCorrectAnswer.trim().toLowerCase()) {
    buttonElement.style.background = "#065f46"; buttonElement.style.color = "white";
    feedbackEl.style.color = "#10b981"; feedbackEl.innerText = "Correct! 🎉";
    userScore++;
  } else {
    buttonElement.style.background = "#991b1b"; buttonElement.style.color = "white";
    feedbackEl.style.color = "#ef4444"; feedbackEl.innerText = `Incorrect. Answer: ${currentCorrectAnswer}`;
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
    inputEl.style.background = "#065f46"; inputEl.style.color = "white";
    feedbackEl.style.color = "#10b981"; feedbackEl.innerText = "Correct! 🎉";
    userScore++;
  } else {
    inputEl.style.background = "#991b1b"; inputEl.style.color = "white";
    feedbackEl.style.color = "#ef4444"; feedbackEl.innerText = `Incorrect. Answer: ${currentCorrectAnswer}`;
  }
  if (nextBtn) nextBtn.style.display = 'inline-block';
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

// --- FLASHCARD STUDIO ---
function renderFlashcardPlayer() {
  const displayArea = document.getElementById('flashcard-display-area');
  if (!displayArea) return;

  if (flashcardDeck.length === 0) {
    displayArea.innerHTML = `<p style='color: var(--text-sub); font-size: 0.9rem; text-align: center;'>No flashcards generated yet.</p>`;
    return;
  }

  if (currentCardIndex >= flashcardDeck.length) currentCardIndex = 0;
  const currentCard = flashcardDeck[currentCardIndex];

  displayArea.innerHTML = `
    <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; text-align: center; min-height: 100px; cursor: pointer;" onclick="flipCardContent()">
      <div style="font-size: 0.8rem; color: var(--text-sub);">Card ${currentCardIndex + 1} of ${flashcardDeck.length}</div>
      <div style="font-size: 1.1rem; margin: 15px 0; font-weight: 500;">${isShowingFront ? currentCard.front : currentCard.back}</div>
      <div style="font-size: 0.75rem; color: var(--text-sub);">(Click to flip)</div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
      <button onclick="prevCard()" style="background: var(--border-color); color: var(--text-color);">Previous</button>
      <button onclick="flipCardContent()">Flip</button>
      <button onclick="nextCard()" style="background: var(--border-color); color: var(--text-color);">Next</button>
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

const generateFlashcardsBtn = document.getElementById('generate-flashcards-btn');
if (generateFlashcardsBtn) {
  generateFlashcardsBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('flashcard-notes');
    const countEl = document.getElementById('flashcard-count');
    const displayArea = document.getElementById('flashcard-display-area');
    if (!notesEl || !displayArea) return;
    
    const notes = notesEl.value.trim();
    const count = parseInt(countEl ? countEl.value : '5', 10) || 5;
    if (!notes) return;

    displayArea.innerHTML = "<p style='color: var(--text-sub);'>🤖 Generating flashcards...</p>";

    try {
      const prompt = `Based on the text, generate exactly ${count} flashcards. Return ONLY a valid JSON array: [{"front": "Term", "back": "Definition"}] Text: ${notes}`;
      const result = await callGroqAPI(prompt);
      flashcardDeck = flashcardDeck.concat(result);
      currentCardIndex = flashcardDeck.length - result.length;
      isShowingFront = true;
      notesEl.value = '';
      renderFlashcardPlayer();
    } catch (error) {
      displayArea.innerHTML = `<p style='color: #ef4444;'>Error: ${error.message}</p>`;
    }
  });
}

// --- INITIALIZE ON LOAD ---
applyTheme(currentTheme);
renderTasks();
updateAnalyticsDisplay();
renderFlashcardPlayer();
renderScheduleTable();