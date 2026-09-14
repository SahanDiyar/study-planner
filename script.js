let currentTheme = localStorage.getItem('theme') || 'light';
let currentQuizMode = 'matching';
let currentQuizQuestions = [];
let currentQuizIndex = 0;
let userScore = 0;
let currentCorrectAnswer = "";
let shuffledDefinitionsPool = [];

// REPLACE WITH YOUR ACTUAL GEMINI API KEY IF NOT USING ENVIRONMENT INJECTION
const GEMINI_API_KEY = ""; 

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadTasks();
  updateStatsDisplay();
});

// --- THEME ---
function initTheme() {
  document.body.className = currentTheme;
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = currentTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
  initTheme();
}

// --- TASKS ---
function loadTasks() {
  const list = document.getElementById('tasks-list');
  if (!list) return;
  const tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
  list.innerHTML = '';
  
  tasks.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span style="text-decoration: ${t.completed ? 'line-through' : 'none'};">${t.text}</span>
      <div>
        <button onclick="toggleTask(${i})" style="padding: 4px 8px; font-size: 0.8rem; background: #10b981; margin-right: 4px;">${t.completed ? 'Undo' : 'Done'}</button>
        <button onclick="deleteTask(${i})" style="padding: 4px 8px; font-size: 0.8rem; background: #ef4444;">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });
  updateStatsDisplay();
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

function toggleTask(i) {
  const tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
  tasks[i].completed = !tasks[i].completed;
  localStorage.setItem('study_tasks', JSON.stringify(tasks));
  loadTasks();
}

function deleteTask(i) {
  const tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
  tasks.splice(i, 1);
  localStorage.setItem('study_tasks', JSON.stringify(tasks));
  loadTasks();
}

function updateStatsDisplay() {
  const tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
  const completedCount = tasks.filter(t => t.completed).length;
  const compEl = document.getElementById('completed-tasks-count');
  if (compEl) compEl.textContent = completedCount;

  const stats = JSON.parse(localStorage.getItem('study_stats')) || { flashcards: 0 };
  const flashEl = document.getElementById('flashcards-reviewed-count');
  if (flashEl) flashEl.textContent = stats.flashcards || 0;
}

function generateFlashcards() {
  let stats = JSON.parse(localStorage.getItem('study_stats')) || { flashcards: 0 };
  stats.flashcards = (stats.flashcards || 0) + 1;
  localStorage.setItem('study_stats', JSON.stringify(stats));
  updateStatsDisplay();
  alert('Flashcards successfully generated!');
}

// --- GEMINI API & QUIZ GENERATOR ---
async function callGeminiAPI(promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
  });

  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("No response received from Gemini API.");

  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
  else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();

  return JSON.parse(cleaned);
}

const generateBtn = document.getElementById('generate-content-btn');
if (generateBtn) {
  generateBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('notes-input');
    const typeEl = document.getElementById('quiz-type');
    const countEl = document.getElementById('question-count');
    const displayArea = document.getElementById('content-display-area');

    if (!notesEl || !notesEl.value.trim()) {
      alert('Please enter some study notes first.');
      return;
    }

    displayArea.innerHTML = "<p style='opacity: 0.7;'>🤖 Generating activity via Gemini API...</p>";
    const notes = notesEl.value.trim();
    const count = parseInt(countEl ? countEl.value : '10', 10);
    const typeVal = typeEl ? typeEl.value : 'Matching';

    try {
      let prompt = "";
      if (typeVal.toLowerCase().includes("matching")) {
        currentQuizMode = "matching";
        prompt = `Based on the following text, generate exactly ${count} matching pairs pairing a key term with its correct definition.
        Return ONLY valid JSON in this exact array format, with no extra text:
        [
          { "term": "Key term", "answer": "Correct definition" }
        ]
        Text: ${notes}`;
      } else if (typeVal.toLowerCase().includes("fill")) {
        currentQuizMode = "blank";
        prompt = `Based on the following text, generate exactly ${count} fill-in-the-blank questions using "_____".
        Return ONLY valid JSON in this exact array format:
        [
          { "question": "Sentence with _____ blank.", "answer": "word" }
        ]
        Text: ${notes}`;
      } else {
        currentQuizMode = "mcq";
        prompt = `Based on the following text, generate exactly ${count} multiple-choice questions.
        Return ONLY valid JSON in this exact array format:
        [
          { "question": "Question?", "options": ["Correct", "Wrong 1", "Wrong 2", "Wrong 3"], "answer": "Correct" }
        ]
        Text: ${notes}`;
      }

      const result = await callGeminiAPI(prompt);
      currentQuizQuestions = result;
      currentQuizIndex = 0;
      userScore = 0;

      if (currentQuizMode === "matching") {
        shuffledDefinitionsPool = result.map(item => item.answer).sort(() => Math.random() - 0.5);
      }

      renderQuizQuestion();
    } catch (err) {
      displayArea.innerHTML = `<p style="color: #ef4444;">Error generating activity: ${err.message}</p>`;
    }
  });
}

// --- RENDER QUIZ / MATCHING (SIDE-BY-SIDE MATCHING VIEW) ---
function renderQuizQuestion() {
  const displayArea = document.getElementById('content-display-area');
  if (!displayArea) return;
  const isDark = currentTheme === 'dark';

  if (currentQuizMode === "matching") {
    let html = `
      <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
        <h4 style="margin-top: 0; color: var(--primary);">Matching Pairs (Side-by-Side View)</h4>
        <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 15px;">Review terms on the left and their corresponding definitions on the right:</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <!-- Terms Column -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="font-weight: bold; font-size: 0.9rem; color: #3b82f6;">Terms</div>
    `;

    currentQuizQuestions.forEach((q, index) => {
      html += `
        <div style="padding: 10px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; min-height: 38px; display: flex; align-items: center;">
          ${index + 1}. ${q.term}
        </div>
      `;
    });

    html += `
          </div>
          <!-- Definitions Column (Shuffled) -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="font-weight: bold; font-size: 0.9rem; color: #10b981;">Definitions</div>
    `;

    shuffledDefinitionsPool.forEach((def, index) => {
      let letter = String.fromCharCode(65 + index);
      html += `
        <div style="padding: 10px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; min-height: 38px; display: flex; align-items: center;">
          <span style="font-weight: bold; color: #10b981; margin-right: 6px;">${letter}.</span> ${def}
        </div>
      `;
    });

    html += `
          </div>
        </div>
        <button onclick="location.reload()" style="font-size: 0.85rem; padding: 6px 12px;">Start Over / New Quiz</button>
      </div>
    `;
    displayArea.innerHTML = html;
    return;
  }

  // Standard MCQ / Blank Renderer fallback
  if (currentQuizIndex >= currentQuizQuestions.length) {
    displayArea.innerHTML = `<div style="text-align: center; padding: 15px;"><strong>Activity Completed! Score: ${userScore}/${currentQuizQuestions.length}</strong></div>`;
    return;
  }

  const q = currentQuizQuestions[currentQuizIndex];
  currentCorrectAnswer = q.answer;
  let html = `<div style="padding: 10px; border: 1px solid var(--border-color); border-radius: 8px;">`;
  html += `<div style="font-weight: bold; margin-bottom: 10px;">Question ${currentQuizIndex + 1}: ${q.question}</div>`;
  html += `<div style="display: flex; flex-direction: column; gap: 8px;" id="opt-container">`;
  
  if (currentQuizMode === "blank") {
    html += `<input type="text" id="blank-input" placeholder="Your answer..." style="margin-bottom: 8px;">`;
    html += `<button onclick="submitBlank()" style="background: var(--primary);">Submit</button>`;
  } else {
    let shuffledOpts = [...q.options].sort(() => Math.random() - 0.5);
    shuffledOpts.forEach(opt => {
      html += `<button class="opt-btn" onclick="handleOptClick(this, '${encodeURIComponent(opt)}')" style="text-align: left; background: var(--card-bg); color: var(--text-color); border: 1px solid var(--border-color);">${opt}</button>`;
    });
  }

  html += `</div><div id="q-feedback" style="margin-top: 10px; font-weight: bold;"></div>`;
  html += `<button id="next-btn" onclick="nextQ()" style="display:none; margin-top: 10px; background: #10b981;">Next →</button></div>`;
  displayArea.innerHTML = html;
}

function handleOptClick(btn, encodedChoice) {
  const chosen = decodeURIComponent(encodedChoice);
  const feedback = document.getElementById('q-feedback');
  const nextBtn = document.getElementById('next-btn');
  document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);

  if (chosen === currentCorrectAnswer) {
    btn.style.background = '#10b981';
    btn.style.color = 'white';
    feedback.textContent = 'Correct! 🎉';
    feedback.style.color = '#10b981';
    userScore++;
  } else {
    btn.style.background = '#ef4444';
    btn.style.color = 'white';
    feedback.textContent = `Incorrect. Correct was: ${currentCorrectAnswer}`;
    feedback.style.color = '#ef4444';
  }
  if (nextBtn) nextBtn.style.display = 'inline-block';
}

function submitBlank() {
  const input = document.getElementById('blank-input');
  const feedback = document.getElementById('q-feedback');
  const nextBtn = document.getElementById('next-btn');
  if (!input) return;

  if (input.value.trim().toLowerCase() === currentCorrectAnswer.trim().toLowerCase()) {
    feedback.textContent = 'Correct! 🎉';
    feedback.style.color = '#10b981';
    userScore++;
  } else {
    feedback.textContent = `Incorrect. Correct answer: ${currentCorrectAnswer}`;
    feedback.style.color = '#ef4444';
  }
  input.disabled = true;
  if (nextBtn) nextBtn.style.display = 'inline-block';
}

function nextQ() {
  currentQuizIndex++;
  renderQuizQuestion();
}