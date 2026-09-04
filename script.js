// --- INITIAL LOAD & GLOBAL VARIABLES ---
let tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
let activityLog = JSON.parse(localStorage.getItem('study_activity_log')) || [];
let flashcardDeck = [];
let currentCardIndex = 0;
let isShowingFront = true;

// Interactive Quiz State
let currentQuizQuestions = [];
let currentQuizIndex = 0;
let userScore = 0;

// Matching State variables
let selectedLeftItem = null;
let matchedPairsCount = 0;

const GROQ_API_KEY = "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";

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
      <div style="display: flex; align-items: center; gap: 10px;">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})" style="width: 18px; height: 18px; cursor: pointer;">
        <span style="${task.completed ? 'text-decoration: line-through; color: #9ca3af;' : 'color: #1f2937;'}">${task.text}</span>
      </div>
      <button onclick="deleteTask(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
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

// --- INTERACTIVE QUIZ GENERATOR & PLAYER ---
const generateContentBtn = document.getElementById('generate-content-btn');
if (generateContentBtn) {
  generateContentBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('notes-input');
    const activityTypeEl = document.getElementById('activity-type');
    const countEl = document.getElementById('question-count');
    const displayArea = document.getElementById('content-display-area');

    if (!notesEl || !displayArea) return;
    const notes = notesEl.value.trim();
    const activityType = activityTypeEl ? activityTypeEl.value : 'Multiple Choice (MCQ)';
    const count = countEl ? countEl.value : '3';

    if (!notes) {
      displayArea.innerHTML = "<p style='color: #ef4444;'>Please enter some notes first.</p>";
      return;
    }

    displayArea.innerHTML = "<p style='color: #6b7280;'>Building your activity...</p>";

    let prompt = "";
    if (activityType === 'Normal Q&A / Worksheet') {
      prompt = `Based on the following notes, generate ${count} Q&A worksheet items.
You MUST return ONLY a valid JSON array and nothing else.
Format:
[
  {
    "type": "worksheet",
    "questions": [
      "1. First question text?",
      "2. Second question text?",
      "3. Third question text?"
    ],
    "answers": [
      "1. Answer to first question",
      "2. Answer to second question",
      "3. Answer to third question"
    ]
  }
]

Notes:
${notes}`;
    } else {
      prompt = `Based on the following notes, generate interactive items of type "${activityType}" (count: ${count}).
You MUST return ONLY a valid JSON array and nothing else.

- If Multiple Choice (MCQ), use this format:
[
  {
    "type": "mcq",
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Exact text of the correct option"
  }
]

- If Fill in the Blanks, use this format:
[
  {
    "type": "blank",
    "question": "Sentence with a _____ blank.",
    "answer": "correctword"
  }
]

- If Matching, use this format:
[
  {
    "type": "matching",
    "pairs": [
      { "left": "Term 1", "right": "Definition 1" },
      { "left": "Term 2", "right": "Definition 2" }
    ]
  }
]

Notes:
${notes}`;
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        let rawContent = data.choices[0].message.content.trim();
        if (rawContent.startsWith("```json")) rawContent = rawContent.substring(7);
        if (rawContent.startsWith("```")) rawContent = rawContent.substring(3);
        if (rawContent.endsWith("```")) rawContent = rawContent.substring(0, rawContent.length - 3);
        rawContent = rawContent.trim();

        currentQuizQuestions = JSON.parse(rawContent);
        currentQuizIndex = 0;
        userScore = 0;
        renderQuizQuestion();
        recordActivity('quizzes', 1);
      } else {
        displayArea.innerHTML = "AI Error: " + (data.error?.message || "Failed to generate.");
      }
    } catch (err) {
      displayArea.innerHTML = "Error parsing activity. Please try clicking generate again.";
    }
  });
}

function renderQuizQuestion() {
  const displayArea = document.getElementById('content-display-area');
  if (!displayArea) return;

  if (currentQuizIndex >= currentQuizQuestions.length) {
    displayArea.innerHTML = `
      <div style="background: #f8fafc; padding: 25px; border-radius: 8px; text-align: center; border: 1px solid #cbd5e1;">
        <h3 style="color: #2563eb; margin-top: 0;">Activity Completed! 🎉</h3>
        <button onclick="location.reload()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">Start New Activity</button>
      </div>
    `;
    return;
  }

  const q = currentQuizQuestions[currentQuizIndex];
  const type = q.type || (q.pairs ? 'matching' : (q.options ? 'mcq' : (q.questions ? 'worksheet' : 'blank')));

  let html = `<div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px;">`;

  if (type === 'worksheet' && q.questions) {
    html += `
      <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;">Normal Q&A Worksheet</h3>
      <div style="margin-bottom: 20px;">
        <h4 style="color: #475569; margin-bottom: 10px;">Questions:</h4>
        <ol style="padding-left: 20px; line-height: 1.6; color: #1e293b;">
          ${q.questions.map(quest => `<li style="margin-bottom: 8px;">${quest.replace(/^\d+[\.\)]\s*/, '')}</li>`).join('')}
        </ol>
      </div>
      <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border: 1px dashed #94a3b8;">
        <h4 style="color: #475569; margin-top: 0; margin-bottom: 10px;">Answer Key (Bottom):</h4>
        <ul style="padding-left: 20px; line-height: 1.6; color: #334155; list-style-type: disc;">
          ${q.answers.map(ans => `<li style="margin-bottom: 6px;">${ans}</li>`).join('')}
        </ul>
      </div>
      <div style="text-align: right; margin-top: 20px;">
        <button onclick="nextQuestion()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Done / Next →</button>
      </div>
    `;
  } else if (type === 'matching' && q.pairs) {
    html += `
      <div style="font-size: 0.85rem; color: #64748b; font-weight: bold; margin-bottom: 10px;">Item ${currentQuizIndex + 1} of ${currentQuizQuestions.length}</div>
      <div style="font-size: 1.1rem; color: #1e293b; font-weight: 500; margin-bottom: 15px;">Match the items on the left with their correct pairs on the right:</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="display: flex; flex-direction: column; gap: 10px;" id="matching-left-col">
          <div style="font-weight: bold; font-size: 0.9rem; color: #475569;">Terms</div>
          ${shuffleArray([...q.pairs]).map(pair => `
            <button class="match-left-btn" onclick="selectLeftMatch(this, '${escapeQuotes(pair.left)}')" 
              style="padding: 10px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; text-align: left; font-weight: 500;">
              ${pair.left}
            </button>
          `).join('')}
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;" id="matching-right-col">
          <div style="font-weight: bold; font-size: 0.9rem; color: #475569;">Definitions</div>
          ${shuffleArray([...q.pairs]).map(pair => `
            <button class="match-right-btn" onclick="selectRightMatch(this, '${escapeQuotes(pair.right)}')" 
              style="padding: 10px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; text-align: left; font-weight: 500;">
              ${pair.right}
            </button>
          `).join('')}
        </div>
      </div>
      <div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div>
      <div style="text-align: right; margin-top: 15px;">
        <button id="next-q-btn" onclick="nextQuestion()" style="display: none; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Next →</button>
      </div>
    `;
    selectedLeftItem = null;
    matchedPairsCount = 0;
  } else if (type === 'blank') {
    html += `
      <div style="font-size: 0.85rem; color: #64748b; font-weight: bold; margin-bottom: 10px;">Item ${currentQuizIndex + 1} of ${currentQuizQuestions.length}</div>
      <div style="font-size: 1.1rem; color: #1e293b; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <input type="text" id="blank-answer-input" placeholder="Type your answer..." style="flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem;">
        <button onclick="handleBlankSubmit('${escapeQuotes(q.answer)}')" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Submit</button>
      </div>
      <div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div>
      <div style="text-align: right; margin-top: 15px;">
        <button id="next-q-btn" onclick="nextQuestion()" style="display: none; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Next Question →</button>
      </div>
    `;
  } else {
    html += `
      <div style="font-size: 0.85rem; color: #64748b; font-weight: bold; margin-bottom: 10px;">Question ${currentQuizIndex + 1} of ${currentQuizQuestions.length}</div>
      <div style="font-size: 1.1rem; color: #1e293b; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;" id="options-container">
    `;
    q.options.forEach(opt => {
      html += `
        <button class="quiz-option-btn" onclick="handleOptionClick(this, '${escapeQuotes(opt)}', '${escapeQuotes(q.answer)}') " 
          style="text-align: left; padding: 12px 16px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 1rem; color: #1e293b; transition: all 0.2s;">
          ${opt}
        </button>
      `;
    });
    html += `
      </div>
      <div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div>
      <div style="text-align: right; margin-top: 15px;">
        <button id="next-q-btn" onclick="nextQuestion()" style="display: none; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Next Question →</button>
      </div>
    `;
  }

  html += `</div>`;
  displayArea.innerHTML = html;
}

window.handleOptionClick = function(buttonElement, chosen, correct) {
  const allBtns = document.querySelectorAll('.quiz-option-btn');
  allBtns.forEach(btn => btn.disabled = true);

  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');

  if (chosen.trim().toLowerCase() === correct.trim().toLowerCase()) {
    buttonElement.style.background = "#dcfce7";
    buttonElement.style.borderColor = "#10b981";
    buttonElement.style.color = "#166534";
    feedbackEl.style.color = "#166534";
    feedbackEl.innerText = "Correct! Great job.";
    userScore++;
  } else {
    buttonElement.style.background = "#fee2e2";
    buttonElement.style.borderColor = "#ef4444";
    buttonElement.style.color = "#991b1b";
    feedbackEl.style.color = "#991b1b";
    feedbackEl.innerText = `Incorrect. The correct answer was: ${correct}`;
    
    allBtns.forEach(btn => {
      if (btn.innerText.trim().toLowerCase() === correct.trim().toLowerCase()) {
        btn.style.background = "#dcfce7";
        btn.style.borderColor = "#10b981";
      }
    });
  }

  if (nextBtn) nextBtn.style.display = 'inline-block';
};

window.handleBlankSubmit = function(correct) {
  const inputEl = document.getElementById('blank-answer-input');
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');
  if (!inputEl) return;

  const val = inputEl.value.trim();
  if (!val) return;

  inputEl.disabled = true;

  if (val.toLowerCase() === correct.toLowerCase()) {
    feedbackEl.style.color = "#166534";
    feedbackEl.innerText = "Correct!";
    userScore++;
  } else {
    feedbackEl.style.color = "#991b1b";
    feedbackEl.innerText = `Incorrect. Expected: "${correct}"`;
  }

  if (nextBtn) nextBtn.style.display = 'inline-block';
};

window.selectLeftMatch = function(btn, leftText) {
  document.querySelectorAll('.match-left-btn').forEach(b => {
    if (!b.disabled) b.style.background = "white";
  });
  btn.style.background = "#bfdbfe";
  selectedLeftItem = { btn, text: leftText };
};

window.selectRightMatch = function(rightBtn, rightText) {
  if (!selectedLeftItem) {
    alert("Please select a term on the left first!");
    return;
  }

  const q = currentQuizQuestions[currentQuizIndex];
  const pairFound = q.pairs.find(p => p.left === selectedLeftItem.text && p.right === rightText);

  if (pairFound) {
    selectedLeftItem.btn.style.background = "#dcfce7";
    selectedLeftItem.btn.style.borderColor = "#10b981";
    selectedLeftItem.btn.disabled = true;

    rightBtn.style.background = "#dcfce7";
    rightBtn.style.borderColor = "#10b981";
    rightBtn.disabled = true;

    matchedPairsCount++;
    userScore++;
    selectedLeftItem = null;

    if (matchedPairsCount === q.pairs.length) {
      document.getElementById('quiz-feedback').style.color = "#166534";
      document.getElementById('quiz-feedback').innerText = "All pairs matched correctly! Excellent work.";
      document.getElementById('next-q-btn').style.display = 'inline-block';
    }
  } else {
    selectedLeftItem.btn.style.background = "#fee2e2";
    rightBtn.style.background = "#fee2e2";
    setTimeout(() => {
      if (!selectedLeftItem.btn.disabled) selectedLeftItem.btn.style.background = "white";
      rightBtn.style.background = "white";
    }, 600);
    document.getElementById('quiz-feedback').style.color = "#991b1b";
    document.getElementById('quiz-feedback').innerText = "Incorrect match. Try again!";
  }
};

window.nextQuestion = function() {
  currentQuizIndex++;
  renderQuizQuestion();
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
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

  const flipBtn = document.getElementById('flip-card-btn');
  if (flipBtn) {
    flipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isShowingFront = !isShowingFront;
      renderFlashcardPlayer();
    });
  }

  const prevBtn = document.getElementById('prev-card-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentCardIndex > 0) {
        currentCardIndex--;
        isShowingFront = true;
        renderFlashcardPlayer();
      }
    });
  }

  const nextCardBtn = document.getElementById('next-card-btn');
  if (nextCardBtn) {
    nextCardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentCardIndex < flashcardDeck.length - 1) {
        currentCardIndex++;
        isShowingFront = true;
        renderFlashcardPlayer();
        recordActivity('flashcards', 1);
      }
    });
  }
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

// AI Generate Flashcards Button (Safely wrapped)
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
You MUST return ONLY a valid JSON array and nothing else.
Format:
[
  { "front": "Term or Question", "back": "Definition or Answer" }
]

Text:
${notes}`;

    try {
      const response = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
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

        let generatedCards;
        try {
          generatedCards = JSON.parse(rawContent);
        } catch (parseErr) {
          const firstBracket = rawContent.indexOf('[');
          const lastBracket = rawContent.lastIndexOf(']');
          if (firstBracket !== -1 && lastBracket !== -1) {
            const extractedJson = rawContent.substring(firstBracket, lastBracket + 1);
            generatedCards = JSON.parse(extractedJson);
          } else {
            throw parseErr;
          }
        }

        flashcardDeck = generatedCards.map(c => ({ front: c.front, back: c.back || c.definition }));
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