// --- STATE & GLOBAL VARIABLES ---
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentQuizMode = 'mcq';
let currentQuizQuestions = [];
let currentQuizIndex = 0;
let userScore = 0;
let currentCorrectAnswer = "";
let shuffledDefinitionsPool = [];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  loadTasks();
  initAnalytics();
});

// --- THEME MANAGEMENT ---
function initTheme() {
  document.body.className = currentTheme === 'dark' ? 'dark-theme' : 'light-theme';
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.textContent = currentTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
  initTheme();
  if (currentQuizQuestions.length > 0) {
    renderQuizQuestion();
  }
}

// --- NAVIGATION TABS ---
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      
      document.querySelectorAll('.tab-content').forEach(section => {
        section.style.display = section.id === targetId ? 'block' : 'none';
      });

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

// --- GEMINI API INTEGRATION ---
async function callGeminiAPI(promptText) {
  const apiKey = ""; // Add your key or leave it for environment handling
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!rawText) {
    throw new Error("No response received from Gemini API.");
  }

  let cleanedJSON = rawText.trim();
  if (cleanedJSON.startsWith("```json")) {
    cleanedJSON = cleanedJSON.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleanedJSON.startsWith("```")) {
    cleanedJSON = cleanedJSON.replace(/^```/, "").replace(/```$/, "").trim();
  }

  return JSON.parse(cleanedJSON);
}

// --- AI QUIZ & ACTIVITY GENERATOR ---
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

    displayArea.innerHTML = "<p style='color: #94a3b8;'>🤖 Analyzing your text and generating your activity...</p>";

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
        <h3 style="margin-top: 0; color: #3b82f6;">Matching Pairs (Side-by-Side View)</h3>
        <p style="font-size: 0.9rem; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-bottom: 20px;">Review the terms on the left and their corresponding definitions directly on the right:</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <!-- Left Column: Terms -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <h4 style="margin: 0 0 5px 0; color: #3b82f6; font-size: 0.95rem;">Terms</h4>
    `;

    currentQuizQuestions.forEach((q, index) => {
      html += `
        <div style="padding: 12px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; font-weight: bold; color: inherit; font-size: 0.9rem; min-height: 44px; display: flex; align-items: center;">
          ${index + 1}. ${q.term}
        </div>
      `;
    });

    html += `
          </div>
          <!-- Right Column: Definitions (Shuffled) -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <h4 style="margin: 0 0 5px 0; color: #10b981; font-size: 0.95rem;">Definitions</h4>
    `;

    shuffledDefinitionsPool.forEach((def, index) => {
      let letterLabel = String.fromCharCode(65 + index);
      html += `
        <div style="padding: 12px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; color: inherit; font-size: 0.9rem; min-height: 44px; display: flex; align-items: center;">
          <span style="font-weight: bold; color: #10b981; margin-right: 8px;">${letterLabel}.</span> ${def}
        </div>
      `;
    });

    html += `
          </div>
        </div>
        <div style="text-align: center; margin-top: 15px;">
          <button onclick="location.reload()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Generate New Activity</button>
        </div>
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

function handleOptionClick(btnElement, encodedChoice) {
  const chosen = decodeURIComponent(encodedChoice);
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');
  const allBtns = document.querySelectorAll('.quiz-option-btn');

  allBtns.forEach(b => b.disabled = true);

  if (chosen === currentCorrectAnswer) {
    btnElement.style.background = '#10b981';
    btnElement.style.color = 'white';
    feedbackEl.textContent = 'Correct! 🎉';
    feedbackEl.style.color = '#10b981';
    userScore++;
  } else {
    btnElement.style.background = '#ef4444';
    btnElement.style.color = 'white';
    feedbackEl.textContent = `Incorrect. Correct answer was: ${currentCorrectAnswer}`;
    feedbackEl.style.color = '#ef4444';
    
    allBtns.forEach(b => {
      if (b.textContent === currentCorrectAnswer) {
        b.style.background = '#10b981';
        b.style.color = 'white';
      }
    });
  }

  if (nextBtn) nextBtn.style.display = 'inline-block';
}

function submitBlankAnswer() {
  const inputEl = document.getElementById('blank-user-answer');
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');
  if (!inputEl) return;

  const userVal = inputEl.value.trim().toLowerCase();
  const correctVal = currentCorrectAnswer.trim().toLowerCase();
  inputEl.disabled = true;

  if (userVal === correctVal) {
    feedbackEl.textContent = 'Correct! 🎉';
    feedbackEl.style.color = '#10b981';
    userScore++;
  } else {
    feedbackEl.textContent = `Incorrect. The correct answer is: ${currentCorrectAnswer}`;
    feedbackEl.style.color = '#ef4444';
  }

  if (nextBtn) nextBtn.style.display = 'inline-block';
}

function revealWorksheetAnswer() {
  const box = document.getElementById('model-answer-box');
  const revealBtn = document.getElementById('reveal-btn');
  const nextBtn = document.getElementById('next-q-btn');
  if (box) box.style.display = 'block';
  if (revealBtn) revealBtn.style.display = 'none';
  
  userScore++;
  if (nextBtn) nextBtn.style.display = 'inline-block';
}

function nextQuestion() {
  currentQuizIndex++;
  renderQuizQuestion();
}

// --- TASK MANAGER LOGIC ---
function loadTasks() {
  const tasksList = document.getElementById('tasks-list');
  if (!tasksList) return;
  
  const savedTasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
  tasksList.innerHTML = '';

  savedTasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 8px; background: rgba(255,255,255,0.05); border-radius: 6px;";
    li.innerHTML = `
      <span style="text-decoration: ${task.completed ? 'line-through' : 'none'};">${task.text}</span>
      <div>
        <button onclick="toggleTask(${index})" style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 5px;">${task.completed ? 'Undo' : 'Done'}</button>
        <button onclick="deleteTask(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
      </div>
    `;
    tasksList.appendChild(li);
  });
}

function addTask() {
  const input = document.getElementById('new-task-input');
  if (!input || !input.value.trim()) return;

  const tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
  tasks.push({ text: input.value.trim(), completed: false });
  localStorage.setItem('study_tasks', JSON.stringify(tasks));
  input.value = '';
  loadTasks();
}

function toggleTask(index) {
  const tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
  tasks[index].completed = !tasks[index].completed;
  localStorage.setItem('study_tasks', JSON.stringify(tasks));
  loadTasks();
}

function deleteTask(index) {
  const tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
  tasks.splice(index, 1);
  localStorage.setItem('study_tasks', JSON.stringify(tasks));
  loadTasks();
}

// --- ANALYTICS / ACTIVITY LOGGING ---
function recordActivity(type, amount) {
  let stats = JSON.parse(localStorage.getItem('study_stats')) || { quizzes: 0, flashcards: 0 };
  stats[type] = (stats[type] || 0) + amount;
  localStorage.setItem('study_stats', JSON.stringify(stats));
}