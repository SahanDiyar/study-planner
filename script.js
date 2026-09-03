// --- INITIAL LOAD & GLOBAL VARIABLES ---
let tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
let activityLog = JSON.parse(localStorage.getItem('study_activity_log')) || [];
let flashcardDeck = [];
let currentCardIndex = 0;
let isShowingFront = true;

const GROQ_API_KEY = "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"; // Replace with your actual key if needed, or keep your existing variable

// --- TASK MANAGER ---
const addTaskBtn = document.getElementById('add-task-btn');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

function renderTasks() {
  if (!taskList) return;
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #e5e7eb;";
    li.innerHTML = `
      <span style="${task.completed ? 'text-decoration: line-through; color: #9ca3af;' : ''}">${task.text}</span>
      <div>
        <button onclick="toggleTask(${index})" style="margin-right: 5px; background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">${task.completed ? 'Undo' : 'Done'}</button>
        <button onclick="deleteTask(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
      </div>
    `;
    taskList.appendChild(li);
  });
  updateAnalyticsDisplay();
}

window.toggleTask = function(index) {
  tasks[index].completed = !tasks[index].completed;
  if (tasks[index].completed) {
    recordActivity('tasks', 1);
  }
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

// --- QUIZ & CONTENT GENERATOR ---
const generateContentBtn = document.getElementById('generate-content-btn');
if (generateContentBtn) {
  generateContentBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('notes-input');
    const activityTypeEl = document.getElementById('activity-type');
    const countEl = document.getElementById('question-count');
    const displayArea = document.getElementById('content-display-area');

    if (!notesEl || !displayArea) return;
    const notes = notesEl.value.trim();
    const activityType = activityTypeEl ? activityTypeEl.value : 'Normal Q&A / Worksheet';
    const count = countEl ? countEl.value : '3';

    if (!notes) {
      displayArea.innerHTML = "<p style='color: #ef4444;'>Please enter some notes first.</p>";
      return;
    }

    displayArea.innerHTML = "<p style='color: #6b7280;'>Generating content with AI...</p>";

    const prompt = `Based on the following notes, generate ${count} items of type "${activityType}".
Text:
${notes}`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        displayArea.innerHTML = `<div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; white-space: pre-wrap;">${data.choices[0].message.content}</div>`;
        recordActivity('quizzes', 1);
      } else {
        displayArea.innerHTML = "AI Error: " + (data.error?.message || "Failed to generate.");
      }
    } catch (err) {
      displayArea.innerHTML = "Error connecting to AI API.";
    }
  });
}

// --- FLASHCARD SYSTEM LOGIC ---
const modeAutoBtn = document.getElementById('mode-auto-btn');
const modeManualBtn = document.getElementById('mode-manual-btn');
const autoContainer = document.getElementById('flashcard-auto-container');
const manualContainer = document.getElementById('flashcard-manual-container');

if (modeAutoBtn && modeManualBtn) {
  modeAutoBtn.addEventListener('click', () => {
    autoContainer.style.display = 'block';
    manualContainer.style.display = 'none';
  });

  modeManualBtn.addEventListener('click', () => {
    autoContainer.style.display = 'none';
    manualContainer.style.display = 'block';
  });
}

function renderFlashcardPlayer() {
  const displayArea = document.getElementById('flashcard-display-area');
  if (!displayArea) return;

  if (flashcardDeck.length === 0) {
    displayArea.innerHTML = "<p style='color: #6b7280; font-size: 0.9rem;'>No flashcards in the deck yet. Generate or create some above!</p>";
    return;
  }

  const currentCard = flashcardDeck[currentCardIndex];
  displayArea.innerHTML = `
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; min-height: 120px; cursor: pointer;">
      <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Card ${currentCardIndex + 1} of ${flashcardDeck.length}</div>
      <div style="font-size: 1.1rem; color: #1e293b; margin: 15px 0; font-weight: 500;">
        ${isShowingFront ? currentCard.front : currentCard.back}
      </div>
      <div style="font-size: 0.75rem; color: #94a3b8;">(Click card to flip)</div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
      <button id="prev-card-btn" style="background: #e2e8f0; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Previous</button>
      <button id="flip-card-btn" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Flip</button>
      <button id="next-card-btn" style="background: #e2e8f0; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Next</button>
    </div>
  `;

  displayArea.querySelector('div').addEventListener('click', () => {
    isShowingFront = !isShowingFront;
    renderFlashcardPlayer();
  });

  document.getElementById('flip-card-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    isShowingFront = !isShowingFront;
    renderFlashcardPlayer();
  });

  document.getElementById('prev-card-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentCardIndex > 0) {
      currentCardIndex--;
      isShowingFront = true;
      renderFlashcardPlayer();
    }
  });

  document.getElementById('next-card-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentCardIndex < flashcardDeck.length - 1) {
      currentCardIndex++;
      isShowingFront = true;
      renderFlashcardPlayer();
      recordActivity('flashcards', 1);
    }
  });
}

// Manual Add Flashcard Button
const addManualCardBtn = document.getElementById('add-manual-card-btn');
if (addManualCardBtn) {
  addManualCardBtn.addEventListener('click', () => {
    const frontInput = document.getElementById('manual-front');
    const backInput = document.getElementById('manual-back');
    if (!frontInput || !backInput) return;

    const frontText = frontInput.value.trim();
    const backText = backInput.value.trim();

    if (!frontText || !backText) {
      alert("Please fill in both the front and back of the flashcard!");
      return;
    }

    flashcardDeck.push({ front: frontText, back: backText });
    frontInput.value = '';
    backInput.value = '';

    currentCardIndex = flashcardDeck.length - 1;
    isShowingFront = true;
    renderFlashcardPlayer();
  });
}

// AI Generate Flashcards Button
const generateFlashcardsBtn = document.getElementById('generate-flashcards-btn');
if (generateFlashcardsBtn) {
  generateFlashcardsBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('flashcard-notes');
    const displayArea = document.getElementById('flashcard-display-area');

    if (!notesEl || !displayArea) return;
    const notes = notesEl.value.trim();

    if (!notes) {
      displayArea.innerHTML = "<p style='color: #ef4444; font-size: 0.9rem;'>Please enter some notes to generate flashcards.</p>";
      return;
    }

    displayArea.innerHTML = "<p style='color: #6b7280; font-size: 0.9rem;'>Generating flashcards quickly...</p>";

    const prompt = `Based on the following text, generate 5 flashcards. 
You MUST return ONLY a valid JSON array with no extra text or markdown blocks outside of it.
Format:
[
  { "front": "Term or Question", "definition": "Definition or Answer" }
]

Text:
${notes}`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        let rawContent = data.choices[0].message.content.trim();
        
        if (rawContent.startsWith("```json")) {
          rawContent = rawContent.substring(7);
        } else if (rawContent.startsWith("```")) {
          rawContent = rawContent.substring(3);
        }
        if (rawContent.endsWith("```")) {
          rawContent = rawContent.substring(0, rawContent.length - 3);
        }
        rawContent = rawContent.trim();

        const generatedCards = JSON.parse(rawContent);
        flashcardDeck = generatedCards.map(c => ({ front: c.front, back: c.definition || c.back }));
        currentCardIndex = 0;
        isShowingFront = true;
        renderFlashcardPlayer();
      } else {
        displayArea.innerHTML = "AI Error: " + (data.error?.message || "Error generating flashcards.");
      }
    } catch (err) {
      displayArea.innerHTML = "Error parsing flashcards. Please try clicking generate again.";
    }
  });
}

// Initial render calls
renderTasks();
updateAnalyticsDisplay();
renderFlashcardPlayer();