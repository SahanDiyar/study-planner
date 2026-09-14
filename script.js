// --- AI Study Hub Core Script (Groq API Integrated) ---

let currentTheme = localStorage.getItem('theme') || 'light';
let currentQuizMode = 'matching';
let currentQuizQuestions = [];
let currentQuizIndex = 0;
let userScore = 0;
let currentCorrectAnswer = "";
let shuffledDefinitionsPool = [];

// Your exact Groq API Configuration from yesterday
const GROQ_API_KEY = "gsk_uTd0JVVKzLALxGouSwaSWGdyb3F6ydzXeYT0mpDFAhRufiQ5QIn"; 
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b"; 

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadTasks();
  initSchedule();
  updateStatsDisplay();
});

// --- THEME MANAGEMENT ---
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

// --- TASK MANAGER SYSTEM ---
function loadTasks() {
  const list = document.getElementById('tasks-list');
  if (!list) return;
  const tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
  list.innerHTML = '';
  
  tasks.forEach((t, i) => {
    const li = document.createElement('li');
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.padding = "8px 12px";
    li.style.background = "rgba(139, 92, 246, 0.05)";
    li.style.borderRadius = "6px";
    li.style.marginBottom = "8px";

    li.innerHTML = `
      <span style="text-decoration: ${t.completed ? 'line-through' : 'none'}; color: inherit;">${t.text}</span>
      <div>
        <button onclick="toggleTask(${i})" style="padding: 4px 8px; font-size: 0.8rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 4px;">${t.completed ? 'Undo' : 'Done'}</button>
        <button onclick="deleteTask(${i})" style="padding: 4px 8px; font-size: 0.8rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
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

// --- WEEKLY SCHEDULE MANAGER ---
function initSchedule() {
  const container = document.getElementById('schedule-container');
  if (!container) return;
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const periods = 7;
  let savedSchedule = JSON.parse(localStorage.getItem('study_schedule')) || {};

  let html = `<table class="schedule-table" style="width:100%; border-collapse:collapse; margin-top:15px; font-size:0.85rem;"><tr><th style="border:1px solid var(--border-color); padding:8px; background:rgba(139,92,246,0.1);">Period</th>`;
  days.forEach(d => html += `<th style="border:1px solid var(--border-color); padding:8px; background:rgba(139,92,246,0.1);">${d}</th>`);
  html += `</tr>`;

  for (let p = 1; p <= periods; p++) {
    html += `<tr><td style="border:1px solid var(--border-color); padding:8px; text-align:center; font-weight:bold;">P${p}</td>`;
    days.forEach(d => {
      let key = `${d}_P${p}`;
      let val = savedSchedule[key] || '';
      html += `<td style="border:1px solid var(--border-color); padding:4px;"><input type="text" value="${val}" onchange="saveScheduleCell('${key}', this.value)" style="width:100%; border:none; background:transparent; text-align:center; font-size:0.8rem; color:inherit; outline:none;"></td>`;
    });
    html += `</tr>`;
  }
  html += `</table>`;
  container.innerHTML = html;
}

function toggleScheduleView() {
  const container = document.getElementById('schedule-container');
  const btn = document.getElementById('schedule-toggle-btn');
  if (!container) return;
  if (container.style.display === 'none' || !container.style.display) {
    container.style.display = 'block';
    if (btn) btn.textContent = 'Hide Schedule';
  } else {
    container.style.display = 'none';
    if (btn) btn.textContent = 'View Schedule';
  }
}

function saveScheduleCell(key, val) {
  let savedSchedule = JSON.parse(localStorage.getItem('study_schedule')) || {};
  savedSchedule[key] = val;
  localStorage.setItem('study_schedule', JSON.stringify(savedSchedule));
}

// --- STATS & FLASHCARD TRACKING ---
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
  let notesInput = document.getElementById('flashcard-notes-input');
  let countInput = document.getElementById('flashcard-count');
  
  let stats = JSON.parse(localStorage.getItem('study_stats')) || { flashcards: 0 };
  let addCount = countInput ? parseInt(countInput.value, 10) || 10 : 10;
  
  stats.flashcards = (stats.flashcards || 0) + addCount;
  localStorage.setItem('study_stats', JSON.stringify(stats));
  updateStatsDisplay();
  
  alert(`Successfully generated ${addCount} flashcards for review session!`);
  if (notesInput) notesInput.value = '';
}

// --- GROQ API INTEGRATION ---
async function callGroqAPI(promptText) {
  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "You are an expert AI study assistant. You always output strictly valid JSON when requested, with no markdown wrappers or extra commentary." },
        { role: "user", content: promptText }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errBody || response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content;
  if (!rawText) throw new Error("No response content received from Groq API.");

  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
  }

  return JSON.parse(cleaned);
}

// --- QUIZ & ACTIVITY GENERATOR EVENT LISTENER ---
const generateBtn = document.getElementById('generate-content-btn');
if (generateBtn) {
  generateBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('notes-input');
    const typeEl = document.getElementById('quiz-type');
    const countEl = document.getElementById('question-count');
    const displayArea = document.getElementById('content-display-area');

    if (!notesEl || !notesEl.value.trim()) {
      alert('Please enter or paste your study notes first.');
      return;
    }

    displayArea.innerHTML = "<p style='opacity: 0.7; text-align: center; padding: 20px;'>🤖 Generating custom practice materials via Groq API...</p>";
    
    const notes = notesEl.value.trim();
    const count = parseInt(countEl ? countEl.value : '10', 10);
    const typeVal = typeEl ? typeEl.value : 'Matching Pairs';

    try {
      let prompt = "";
      if (typeVal.toLowerCase().includes("matching")) {
        currentQuizMode = "matching";
        prompt = `Based on the following text, generate exactly ${count} matching pairs pairing a key term with its correct definition.
        Return ONLY a valid JSON array in this exact format, with no markdown code blocks or extra text:
        [
          { "term": "Key term", "answer": "Correct definition" }
        ]
        Text: ${notes}`;
      } else if (typeVal.toLowerCase().includes("fill")) {
        currentQuizMode = "blank";
        prompt = `Based on the following text, generate exactly ${count} fill-in-the-blank questions using underscores "_____".
        Return ONLY a valid JSON array in this exact format, with no markdown code blocks or extra text:
        [
          { "question": "Sentence with _____ blank.", "answer": "word" }
        ]
        Text: ${notes}`;
      } else {
        currentQuizMode = "mcq";
        prompt = `Based on the following text, generate exactly ${count} multiple-choice questions.
        Return ONLY a valid JSON array in this exact format, with no markdown code blocks or extra text:
        [
          { "question": "Question text?", "options": ["Correct Answer", "Wrong Option 1", "Wrong Option 2", "Wrong Option 3"], "answer": "Correct Answer" }
        ]
        Text: ${notes}`;
      }

      const result = await callGroqAPI(prompt);
      currentQuizQuestions = result;
      currentQuizIndex = 0;
      userScore = 0;

      if (currentQuizMode === "matching") {
        shuffledDefinitionsPool = result.map(item => item.answer).sort(() => Math.random() - 0.5);
      }

      renderQuizQuestion();
    } catch (err) {
      displayArea.innerHTML = `<div style="padding: 15px; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; color: #ef4444;"><strong>Error generating activity:</strong> ${err.message}</div>`;
    }
  });
}

// --- RENDER QUIZ / MATCHING (SIDE-BY-SIDE MATCHING VIEW) ---
function renderQuizQuestion() {
  const displayArea = document.getElementById('content-display-area');
  if (!displayArea) return;

  if (currentQuizMode === "matching") {
    let html = `
      <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
        <h4 style="margin-top: 0; color: var(--primary); font-size: 1.1rem;">Matching Pairs (Side-by-Side View)</h4>
        <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 20px;">Review the key terms on the left and match them with their corresponding definitions on the right:</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <!-- Terms Column -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="font-weight: bold; font-size: 0.9rem; color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">Terms</div>
    `;

    currentQuizQuestions.forEach((q, index) => {
      html += `
        <div style="padding: 12px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; min-height: 40px; display: flex; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <strong>${index + 1}.</strong>&nbsp;${q.term}
        </div>
      `;
    });

    html += `
          </div>
          <!-- Definitions Column (Shuffled) -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="font-weight: bold; font-size: 0.9rem; color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 4px;">Definitions</div>
    `;

    shuffledDefinitionsPool.forEach((def, index) => {
      let letter = String.fromCharCode(65 + index);
      html += `
        <div style="padding: 12px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; min-height: 40px; display: flex; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <span style="font-weight: bold; color: #10b981; margin-right: 8px;">${letter}.</span> ${def}
        </div>
      `;
    });

    html += `
          </div>
        </div>
        <div style="text-align: center; margin-top: 15px;">
          <button onclick="location.reload()" style="font-size: 0.85rem; padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">Generate New Activity</button>
        </div>
      </div>
    `;
    displayArea.innerHTML = html;
    return;
  }

  if (currentQuizIndex >= currentQuizQuestions.length) {
    displayArea.innerHTML = `<div style="text-align: center; padding: 20px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px;"><strong>Activity Completed! 🎉 Final Score: ${userScore} / ${currentQuizQuestions.length}</strong><br><br><button onclick="location.reload()" style="padding: 6px 14px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">Start Over</button></div>`;
    return;
  }

  const q = currentQuizQuestions[currentQuizIndex];
  currentCorrectAnswer = q.answer;
  let html = `<div style="padding: 15px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg);">`;
  html += `<div style="font-weight: bold; margin-bottom: 15px; font-size: 0.95rem;">Question ${currentQuizIndex + 1} of ${currentQuizQuestions.length}:<br><span style="font-weight: normal; opacity: 0.9;">${q.question}</span></div>`;
  html += `<div style="display: flex; flex-direction: column; gap: 10px;" id="opt-container">`;
  
  if (currentQuizMode === "blank") {
    html += `<input type="text" id="blank-input" placeholder="Type your answer here..." style="margin-bottom: 10px; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color);">`;
    html += `<button onclick="submitBlank()" style="background: var(--primary); color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Submit Answer</button>`;
  } else {
    let shuffledOpts = [...q.options].sort(() => Math.random() - 0.5);
    shuffledOpts.forEach(opt => {
      html += `<button class="opt-btn" onclick="handleOptClick(this, '${encodeURIComponent(opt)}')" style="text-align: left; background: var(--card-bg); color: var(--text-color); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: 6px; cursor: pointer; transition: background 0.2s;">${opt}</button>`;
    });
  }

  html += `</div><div id="q-feedback" style="margin-top: 12px; font-weight: bold; font-size: 0.9rem;"></div>`;
  html += `<button id="next-btn" onclick="nextQ()" style="display:none; margin-top: 15px; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Next Question →</button></div>`;
  displayArea.innerHTML = html;
}

function handleOptClick(btn, encodedChoice) {
  const chosen = decodeURIComponent(encodedChoice);
  const feedback = document.getElementById('q-feedback');
  const nextBtn = document.getElementById('next-btn');
  document.querySelectorAll('.opt-btn').forEach(b => {
    b.disabled = true;
    b.style.cursor = 'default';
  });

  if (chosen === currentCorrectAnswer) {
    btn.style.background = '#10b981';
    btn.style.color = 'white';
    feedback.textContent = 'Correct! 🎉';
    feedback.style.color = '#10b981';
    userScore++;
  } else {
    btn.style.background = '#ef4444';
    btn.style.color = 'white';
    feedback.textContent = `Incorrect. The correct answer was: ${currentCorrectAnswer}`;
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