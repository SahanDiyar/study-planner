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
      <span style="${task.completed ? 'text-decoration: line-through; color: #9ca3af;' : 'color: #1f2937;'}">${task.text}</span>
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
  let html = '';
  for (let i = 0; i < 7; i++) {
    html += `<tr><td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold; color: #475569;">Period ${i + 1}</td>`;
    days.forEach(day => {
      const val = weeklyScheduleData[day]?.[i] || '';
      html += `<td style="padding: 6px; border: 1px solid #cbd5e1;"><input type="text" data-day="${day}" data-period="${i}" value="${val}" placeholder="Subject ${i + 1}" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; text-align: center;"></td>`;
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

// --- INTERACTIVE QUIZ GENERATOR & PLAYER ---
const generateContentBtn = document.getElementById('generate-content-btn');
if (generateContentBtn) {
  generateContentBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('notes-input');
    const activityTypeEl = document.getElementById('quiz-type') || document.getElementById('activity-type');
    const countEl = document.getElementById('question-count');
    const displayArea = document.getElementById('content-display-area');

    if (!notesEl || !displayArea) return;
    const notes = notesEl.value.trim();
    const activityType = activityTypeEl ? activityTypeEl.value : 'Multiple Choice (MCQ)';
    const count = parseInt(countEl ? countEl.value : '3', 10);

    if (!notes) {
      displayArea.innerHTML = "<p style='color: #ef4444;'>Please enter some notes first.</p>";
      return;
    }

    displayArea.innerHTML = "<p style='color: #6b7280;'>Building your activity...</p>";

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: `Based on these notes, generate ${count} items of type "${activityType}" in strict JSON format. If matching, return [{"type": "matching", "pairs": [{"term": "...", "definition": "..."}, ...]}]. Notes: ${notes}` }]
        })
      });
      const data = await response.json();
      if (data.choices) {
        let rawContent = data.choices[0].message.content.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(rawContent);
        currentQuizQuestions = Array.isArray(parsed) ? parsed : [parsed];
      } else { throw new Error(); }
    } catch (err) {
      const sentences = notes.match(/[^.!?]+[.!?]+/g) || [notes];
      currentQuizQuestions = [];

      if (activityType.toLowerCase().includes('match')) {
        const pairs = sentences.slice(0, count).map(s => {
          const words = s.trim().split(' ');
          const term = words.slice(0, Math.min(3, words.length)).join(' ');
          return { term: term, definition: s.trim() };
        });
        currentQuizQuestions = [{ type: "matching", pairs: pairs }];
      } else if (activityType.includes('Worksheet') || activityType.includes('Q&A')) {
        currentQuizQuestions.push({
          type: "worksheet",
          questions: sentences.slice(0, count).map(s => `Explain: "${s.trim().substring(0, 45)}..."`),
          answers: sentences.slice(0, count).map(s => s.trim())
        });
      } else if (activityType.includes('Blank') || activityType.includes('fill')) {
        for (let i = 0; i < Math.min(count, sentences.length); i++) {
          const words = sentences[i].trim().split(' ');
          const targetWord = words[Math.floor(words.length / 2)] || "word";
          currentQuizQuestions.push({
            type: "blank",
            question: sentences[i].trim().replace(targetWord, '_____'),
            answer: targetWord
          });
        }
      } else {
        // Smart MCQ Fallback using other real sentences as distractors
        for (let i = 0; i < Math.min(count, sentences.length); i++) {
          const correctText = sentences[i].trim();
          const otherSentences = sentences.filter((_, idx) => idx !== i).map(s => s.trim());
          const distractors = otherSentences.slice(0, 3);
          while (distractors.length < 3) {
            distractors.push("None of the above");
          }
          currentQuizQuestions.push({
            type: "mcq",
            question: `According to your notes, which statement is accurate?`,
            options: [correctText, ...distractors].sort(() => Math.random() - 0.5),
            answer: correctText
          });
        }
      }
    }

    currentQuizIndex = 0;
    userScore = 0;
    renderQuizQuestion();
    recordActivity('quizzes', 1);
  });
}

function renderQuizQuestion() {
  const displayArea = document.getElementById('content-display-area');
  if (!displayArea) return;

  if (currentQuizIndex >= currentQuizQuestions.length) {
    displayArea.innerHTML = `
      <div style="background: #f8fafc; padding: 25px; border-radius: 8px; text-align: center; border: 1px solid #cbd5e1;">
        <h3 style="color: #2563eb; margin-top: 0;">Activity Completed! 🎉 Score: ${userScore}/${currentQuizQuestions.length || 1}</h3>
        <button onclick="location.reload()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">Start New Activity</button>
      </div>
    `;
    return;
  }

  const q = currentQuizQuestions[currentQuizIndex];
  const type = q.type || (q.questions ? 'worksheet' : (q.pairs ? 'matching' : 'mcq'));

  let html = `<div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px;">`;

  if (type === 'matching' && q.pairs) {
    const shuffledTerms = [...q.pairs].map(p => p.term).sort(() => Math.random() - 0.5);
    html += `
      <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;">Matching Activity</h3>
      <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 15px;">Pair each definition with its correct term:</p>
      <div style="display: flex; flex-direction: column; gap: 12px;" id="matching-container">
    `;
    q.pairs.forEach((pair, idx) => {
      html += `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: center; background: white; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px;">
          <div style="color: #334155; font-size: 0.9rem;"><strong>Definition ${idx + 1}:</strong> ${pair.definition}</div>
          <select data-correct="${escapeQuotes(pair.term)}" class="match-select" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; color: #1e293b;">
            <option value="">-- Choose Term --</option>
            ${shuffledTerms.map(t => `<option value="${escapeQuotes(t)}">${t}</option>`).join('')}
          </select>
        </div>
      `;
    });
    html += `
      </div>
      <div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div>
      <div style="text-align: right; margin-top: 20px;">
        <button onclick="handleMatchingSubmit()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Submit Matching</button>
      </div>
    `;
  } else if (type === 'worksheet' && q.questions) {
    html += `
      <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;">Normal Q&A Worksheet</h3>
      <div style="margin-bottom: 20px;">
        <ol style="padding-left: 20px; line-height: 1.6; color: #1e293b;">
          ${q.questions.map(quest => `<li style="margin-bottom: 8px;">${quest}</li>`).join('')}
        </ol>
      </div>
      <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border: 1px dashed #94a3b8;">
        <h4 style="color: #475569; margin-top: 0; margin-bottom: 10px;">Answer Key:</h4>
        <ul style="padding-left: 20px; line-height: 1.6; color: #334155; list-style-type: disc;">
          ${q.answers.map(ans => `<li style="margin-bottom: 6px;">${ans}</li>`).join('')}
        </ul>
      </div>
      <div style="text-align: right; margin-top: 20px;">
        <button onclick="nextQuestion()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Done / Finish →</button>
      </div>
    `;
  } else if (type === 'blank') {
    html += `
      <div style="font-size: 0.85rem; color: #64748b; font-weight: bold; margin-bottom: 10px;">Item ${currentQuizIndex + 1} of ${currentQuizQuestions.length}</div>
      <div style="font-size: 1.1rem; color: #1e293b; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <input type="text" id="blank-answer-input" placeholder="Type missing word..." style="flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem;">
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
      html += `<button class="quiz-option-btn" onclick="handleOptionClick(this, '${escapeQuotes(opt)}', '${escapeQuotes(q.answer)}') " style="text-align: left; padding: 12px 16px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 1rem; color: #1e293b;">${opt}</button>`;
    });
    html += `</div><div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div><div style="text-align: right; margin-top: 15px;"><button id="next-q-btn" onclick="nextQuestion()" style="display: none; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Next Question →</button></div>`;
  }

  html += `</div>`;
  displayArea.innerHTML = html;
}

window.handleOptionClick = function(buttonElement, chosen, correct) {
  document.querySelectorAll('.quiz-option-btn').forEach(btn => btn.disabled = true);
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');

  if (chosen.trim() === correct.trim()) {
    buttonElement.style.background = "#dcfce7"; buttonElement.style.borderColor = "#10b981";
    feedbackEl.style.color = "#166534"; feedbackEl.innerText = "Correct! Great job.";
    userScore++;
  } else {
    buttonElement.style.background = "#fee2e2"; buttonElement.style.borderColor = "#ef4444";
    feedbackEl.style.color = "#991b1b"; feedbackEl.innerText = `Incorrect. Correct answer: ${correct}`;
  }
  if (nextBtn) nextBtn.style.display = 'inline-block';
};

window.handleBlankSubmit = function(correct) {
  const inputEl = document.getElementById('blank-answer-input');
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-q-btn');
  if (!inputEl) return;

  const val = inputEl.value.trim();
  inputEl.disabled = true;
  if (val.toLowerCase() === correct.toLowerCase()) {
    feedbackEl.style.color = "#166534"; feedbackEl.innerText = "Correct!"; userScore++;
  } else {
    feedbackEl.style.color = "#991b1b"; feedbackEl.innerText = `Incorrect. Expected: "${correct}"`;
  }
  if (nextBtn) nextBtn.style.display = 'inline-block';
};

window.handleMatchingSubmit = function() {
  const selects = document.querySelectorAll('.match-select');
  const feedbackEl = document.getElementById('quiz-feedback');
  let correctCount = 0;

  selects.forEach(sel => {
    const chosen = sel.value;
    const correct = sel.getAttribute('data-correct');
    if (chosen.trim() === correct.trim()) {
      correctCount++;
      sel.style.borderColor = "#10b981";
      sel.style.background = "#dcfce7";
    } else {
      sel.style.borderColor = "#ef4444";
      sel.style.background = "#fee2e2";
    }
    sel.disabled = true;
  });

  userScore = correctCount;
  if (feedbackEl) {
    feedbackEl.style.color = correctCount === selects.length ? "#166534" : "#991b1b";
    feedbackEl.innerText = `You matched ${correctCount} out of ${selects.length} correctly!`;
  }
  
  const submitBtn = document.querySelector('#content-display-area button');
  if (submitBtn) {
    submitBtn.innerText = "Finish Activity →";
    submitBtn.onclick = () => { currentQuizIndex++; renderQuizQuestion(); };
  }
};

window.nextQuestion = function() { currentQuizIndex++; renderQuizQuestion(); };
function escapeQuotes(str) { return str.replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

// --- FLASHCARD SYSTEM ---
const modeAutoBtn = document.getElementById('mode-auto-btn');
const modeManualBtn = document.getElementById('mode-manual-btn');
const autoContainer = document.getElementById('flashcard-auto-container');
const manualContainer = document.getElementById('flashcard-manual-container');

if (modeAutoBtn && modeManualBtn) {
  modeAutoBtn.addEventListener('click', () => { autoContainer.style.display = 'block'; manualContainer.style.display = 'none'; });
  modeManualBtn.addEventListener('click', () => { autoContainer.style.display = 'none'; manualContainer.style.display = 'block'; });
}

function renderFlashcardPlayer() {
  const displayArea = document.getElementById('flashcard-display-area');
  if (!displayArea) return;
  if (flashcardDeck.length === 0) { displayArea.innerHTML = "<p style='color: #6b7280; font-size: 0.9rem;'>No flashcards in deck yet.</p>"; return; }

  const currentCard = flashcardDeck[currentCardIndex];
  displayArea.innerHTML = `
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; min-height: 120px; cursor: pointer;" onclick="flipCardContent()">
      <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Card ${currentCardIndex + 1} of ${flashcardDeck.length}</div>
      <div style="font-size: 1.1rem; color: #1e293b; margin: 15px 0; font-weight: 500;">${isShowingFront ? currentCard.front : currentCard.back}</div>
      <div style="font-size: 0.75rem; color: #94a3b8;">(Click card to flip)</div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
      <button onclick="prevCard()" style="background: #e2e8f0; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Previous</button>
      <button onclick="flipCardContent()" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Flip</button>
      <button onclick="nextCard()" style="background: #e2e8f0; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Next</button>
    </div>
  `;
}

window.flipCardContent = function() { isShowingFront = !isShowingFront; renderFlashcardPlayer(); };
window.prevCard = function() { if (currentCardIndex > 0) { currentCardIndex--; isShowingFront = true; renderFlashcardPlayer(); } };
window.nextCard = function() { if (currentCardIndex < flashcardDeck.length - 1) { currentCardIndex++; isShowingFront = true; renderFlashcardPlayer(); recordActivity('flashcards', 1); } };

const addManualCardBtn = document.getElementById('add-manual-card-btn');
if (addManualCardBtn) {
  addManualCardBtn.addEventListener('click', () => {
    const frontInput = document.getElementById('manual-front');
    const backInput = document.getElementById('manual-back');
    if (!frontInput || !backInput || !frontInput.value.trim() || !backInput.value.trim()) return;
    flashcardDeck.push({ front: frontInput.value.trim(), back: backInput.value.trim() });
    frontInput.value = ''; backInput.value = '';
    currentCardIndex = flashcardDeck.length - 1; isShowingFront = true;
    renderFlashcardPlayer();
  });
}

const generateFlashcardsBtn = document.getElementById('generate-flashcards-btn');
if (generateFlashcardsBtn) {
  generateFlashcardsBtn.addEventListener('click', async () => {
    const notesEl = document.getElementById('flashcard-notes');
    const displayArea = document.getElementById('flashcard-display-area');
    if (!notesEl || !displayArea) return;
    const notes = notesEl.value.trim();
    if (!notes) return;

    displayArea.innerHTML = "<p style='color: #6b7280; font-size: 0.9rem;'>Generating flashcards...</p>";

    try {
      const response = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: `Create 5 flashcards in JSON array format: [{"front": "...", "back": "..."}]. Notes: ${notes}` }]
        })
      });
      const data = await response.json();
      if (data.choices) {
        flashcardDeck = JSON.parse(data.choices[0].message.content.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim());
      } else { throw new Error(); }
    } catch (err) {
      const sentences = notes.match(/[^.!?]+[.!?]+/g) || [notes];
      flashcardDeck = sentences.slice(0, 5).map((s, i) => {
        const words = s.trim().split(' ');
        const frontText = words.slice(0, Math.min(4, words.length)).join(' ') + '...';
        return { front: frontText, back: s.trim() };
      });
    }

    currentCardIndex = 0; isShowingFront = true;
    renderFlashcardPlayer();
  });
}

renderTasks(); updateAnalyticsDisplay(); renderFlashcardPlayer(); renderScheduleTable();