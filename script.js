document.addEventListener('DOMContentLoaded', () => {
  // --- PERSISTENT ANALYTICS & REPORTING STATE ---
  let userStats = JSON.parse(localStorage.getItem('studyPlannerStats')) || {
    completedTasks: 0,
    flashcardsReviewed: 0,
    quizScores: [],
    history: {}
  };

  const GROQ_API_KEY = "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";

  function getTodayKey() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  function recordActivity(type, amount = 1) {
    const todayKey = getTodayKey();
    if (!userStats.history[todayKey]) {
      userStats.history[todayKey] = { tasks: 0, flashcards: 0, quizzes: 0 };
    }
    userStats.history[todayKey][type] += amount;
    localStorage.setItem('studyPlannerStats', JSON.stringify(userStats));
  }

  // --- UPDATE ANALYTICS DASHBOARD DISPLAY ---
  function updateAnalyticsDisplay() {
    let totalFlashcardsFromHistory = 0;
    Object.values(userStats.history).forEach(dayData => {
      totalFlashcardsFromHistory += dayData.flashcards || 0;
    });

    const statFlashcards = document.getElementById('stat-flashcards-reviewed');
    if (statFlashcards) statFlashcards.innerText = totalFlashcardsFromHistory;

    const tasks = JSON.parse(localStorage.getItem('studyPlannerTasks')) || [];
    const completedCount = tasks.filter(t => t.completed).length;
    
    const statCompletedTasks = document.getElementById('stat-completed-tasks');
    if (statCompletedTasks) statCompletedTasks.innerText = completedCount;

    const statAvgQuiz = document.getElementById('stat-avg-quiz');
    if (statAvgQuiz) {
      if (userStats.quizScores.length > 0) {
        const sum = userStats.quizScores.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / userStats.quizScores.length);
        statAvgQuiz.innerText = avg + '%';
      } else {
        statAvgQuiz.innerText = '0%';
      }
    }

    let weeklyTasks = 0, weeklyFlashcards = 0, weeklyQuizzes = 0;
    let monthlyTasks = 0, monthlyFlashcards = 0, monthlyQuizzes = 0;

    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayData = userStats.history[dateKey];

      if (dayData) {
        if (i < 7) {
          weeklyTasks += dayData.tasks || 0;
          weeklyFlashcards += dayData.flashcards || 0;
          weeklyQuizzes += dayData.quizzes || 0;
        }
        monthlyTasks += dayData.tasks || 0;
        monthlyFlashcards += dayData.flashcards || 0;
        monthlyQuizzes += dayData.quizzes || 0;
      }
    }

    if (document.getElementById('stat-weekly-tasks')) document.getElementById('stat-weekly-tasks').innerText = weeklyTasks;
    if (document.getElementById('stat-weekly-flashcards')) document.getElementById('stat-weekly-flashcards').innerText = weeklyFlashcards;
    if (document.getElementById('stat-weekly-quizzes')) document.getElementById('stat-weekly-quizzes').innerText = weeklyQuizzes;

    if (document.getElementById('stat-monthly-tasks')) document.getElementById('stat-monthly-tasks').innerText = monthlyTasks;
    if (document.getElementById('stat-monthly-flashcards')) document.getElementById('stat-monthly-flashcards').innerText = monthlyFlashcards;
    if (document.getElementById('stat-monthly-quizzes')) document.getElementById('stat-monthly-quizzes').innerText = monthlyQuizzes;
  }

  // --- TASK MANAGER LOGIC WITH LOCALSTORAGE ---
  let savedTasks = JSON.parse(localStorage.getItem('studyPlannerTasks')) || [];

  function saveTasksToStorage() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;
    
    const tasks = [];
    taskList.querySelectorAll('li').forEach(li => {
      const text = li.querySelector('span').innerText;
      const completed = li.querySelector('input[type="checkbox"]').checked;
      tasks.push({ text, completed });
    });
    localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
  }

  function renderSavedTasks() {
    let taskList = document.getElementById('task-list');
    if (!taskList) {
      taskList = document.createElement('ul');
      taskList.id = 'task-list';
      taskList.style.listStyle = 'none';
      taskList.style.marginTop = '15px';
      taskList.style.paddingLeft = '0';
      const taskInputSection = document.querySelector('.task-input-section');
      if (taskInputSection) {
        taskInputSection.after(taskList);
      } else {
        const taskManagerBox = document.querySelector('div:has(#add-task-btn)') || document.querySelector('.container');
        if (taskManagerBox) taskManagerBox.appendChild(taskList);
        else return;
      }
    }
    
    taskList.innerHTML = '';

    savedTasks.forEach(taskObj => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.padding = '8px 12px';
      li.style.background = '#f9fafb';
      li.style.border = '1px solid #e5e7eb';
      li.style.borderRadius = '6px';
      li.style.marginBottom = '8px';

      li.innerHTML = `
        <span style="font-size: 0.95rem; color: ${taskObj.completed ? '#9ca3af' : '#1f2937'}; text-decoration: ${taskObj.completed ? 'line-through' : 'none'};">${taskObj.text}</span>
        <div style="display: flex; align-items: center; gap: 10px;">
          <input type="checkbox" ${taskObj.completed ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" title="Mark as complete">
          <button style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Delete</button>
        </div>
      `;

      const checkbox = li.querySelector('input[type="checkbox"]');
      const span = li.querySelector('span');
      
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          span.style.textDecoration = 'line-through';
          span.style.color = '#9ca3af';
          recordActivity('tasks', 1);
        } else {
          span.style.textDecoration = 'none';
          span.style.color = '#1f2937';
        }
        saveTasksToStorage();
        updateAnalyticsDisplay();
      });

      li.querySelector('button').addEventListener('click', () => {
        li.remove();
        saveTasksToStorage();
        updateAnalyticsDisplay();
      });

      taskList.appendChild(li);
    });
  }

  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      const taskInput = document.getElementById('task-input');
      if (!taskInput) return;
      const taskText = taskInput.value.trim();

      if (!taskText) {
        alert("Please enter a task first!");
        return;
      }

      savedTasks.push({ text: taskText, completed: false });
      saveTasksToStorage();
      renderSavedTasks();
      taskInput.value = "";
      updateAnalyticsDisplay();
    });
  }

  // --- SUNDAY - THURSDAY SCHEDULE WITH LOCALSTORAGE SAVING ---
  const scheduleBtn = document.getElementById('schedule-btn');
  if (scheduleBtn) {
    scheduleBtn.addEventListener('click', () => {
      let scheduleBox = document.getElementById('schedule-view');
      
      if (!scheduleBox) {
        scheduleBox = document.createElement('div');
        scheduleBox.id = 'schedule-view';
        scheduleBox.style.background = '#ffffff';
        scheduleBox.style.border = '1px solid #cbd5e1';
        scheduleBox.style.padding = '20px';
        scheduleBox.style.borderRadius = '8px';
        scheduleBox.style.marginTop = '20px';
        scheduleBox.style.overflowX = 'auto';

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        
        let tableHTML = `
          <h3 style="margin-bottom: 12px; font-size: 1.2rem; color: #1f2937;">Weekly School Schedule (Sunday - Thursday)</h3>
          <p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 10px;">Your entries are automatically saved as you type!</p>
          <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 0.85rem;">
            <thead>
              <tr style="background: #3b82f6; color: white;">
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Period</th>
        `;
        
        days.forEach(day => {
          tableHTML += `<th style="padding: 8px; border: 1px solid #cbd5e1;">${day}</th>`;
        });
        tableHTML += `</tr></thead><tbody>`;

        for (let i = 1; i <= 7; i++) {
          tableHTML += `<tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; background: #f8fafc;">Period ${i}</td>`;
          days.forEach(day => {
            const storageKey = `schedule_${day}_period_${i}`;
            const savedValue = localStorage.getItem(storageKey) || '';
            tableHTML += `
              <td style="padding: 6px; border: 1px solid #cbd5e1;">
                <input type="text" data-key="${storageKey}" value="${savedValue}" placeholder="Subject ${i}" style="width: 90%; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.8rem; text-align: center;">
              </td>`;
          });
          tableHTML += `</tr>`;
        }

        tableHTML += `</tbody></table>`;
        scheduleBox.innerHTML = tableHTML;
        const containerEl = document.querySelector('.container') || document.body;
        containerEl.appendChild(scheduleBox);

        scheduleBox.querySelectorAll('input').forEach(input => {
          input.addEventListener('input', (e) => {
            localStorage.setItem(e.target.dataset.key, e.target.value);
          });
        });

      } else {
        scheduleBox.style.display = scheduleBox.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  // --- UPDATED GENERATOR LOGIC (FAST MODEL) ---
  const generateBtn = document.getElementById('generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      const notesEl = document.getElementById('study-notes');
      const numQuestionsEl = document.getElementById('num-questions');
      const outputDiv = document.getElementById('quiz-output');

      if (!notesEl || !outputDiv) return;

      const notes = notesEl.value;
      const numQuestions = numQuestionsEl ? numQuestionsEl.value : "3";
      
      const quizTypeSelect = document.getElementById('quiz-type');
      const quizType = quizTypeSelect ? quizTypeSelect.value.toLowerCase() : "mcq";

      if (!notes.trim()) {
        outputDiv.innerHTML = "Please paste some study notes first!";
        return;
      }

      outputDiv.innerHTML = "Generating content quickly...";

      const isNormalQA = quizType.includes("normal") || quizType.includes("q&a");
      const isBlank = quizType.includes("blank");
      const isMatching = quizType.includes("matching");
      let prompt = "";

      if (isNormalQA) {
        prompt = `Based on the following text, create exactly ${numQuestions} standard study questions without any multiple-choice options. 
List all the questions first numbered sequentially. 
Then, provide a separate Answer Key section containing the answers at the very bottom.

Text:
${notes}`;
      } else if (isBlank) {
        prompt = `Based on the following text, generate exactly ${numQuestions} fill-in-the-blank questions. 
Replace the key missing word in the sentence with underscores "____".
You MUST return ONLY a valid JSON array with no extra text or markdown blocks outside of it.
Format:
[
  {
    "sentence": "The powerhouse of the cell is the ____.",
    "answer": "mitochondria"
  }
]

Text:
${notes}`;
      } else if (isMatching) {
        prompt = `Based on the following text, generate ${numQuestions} pairs of matching terms and definitions.
You MUST return ONLY a valid JSON array with no extra text or markdown blocks outside of it.
Format:
[
  { "term": "Photosynthesis", "definition": "Process used by plants to convert light into energy" }
]

Text:
${notes}`;
      } else {
        prompt = `Based on the following text, generate exactly ${numQuestions} multiple-choice questions. 
You MUST return ONLY a valid JSON array with no extra text or markdown blocks outside of it.
Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }
]
where "correct" is the index (0 to 3) of the correct option in the options array.

Text:
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

          if (isNormalQA) {
            outputDiv.innerHTML = `
              <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; line-height: 1.6; color: #1f2937;">
                <h3 style="color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Study Questions & Worksheet</h3>
                <div style="font-size: 0.95rem; white-space: pre-wrap;">${rawContent}</div>
              </div>
            `;
            userStats.quizScores.push(100);
            recordActivity('quizzes', 1);
            updateAnalyticsDisplay();
          } else if (isBlank) {
            const blankQuestions = JSON.parse(rawContent);
            startInteractiveBlank(blankQuestions, outputDiv);
          } else if (isMatching) {
            const matchingPairs = JSON.parse(rawContent);
            startInteractiveMatching(matchingPairs, outputDiv);
          } else {
            const quizQuestions = JSON.parse(rawContent);
            startInteractiveMCQ(quizQuestions, outputDiv);
          }

        } else {
          outputDiv.innerHTML = "AI Error: " + (data.error?.message || "Invalid response from AI.");
        }
      } catch (error) {
        outputDiv.innerHTML = "Error generating content. Please try again.";
      }
    });
  }

  // --- FILL-IN-THE-BLANK INTERACTIVE FLOW ---
  function startInteractiveBlank(questions, container) {
    let currentIndex = 0;
    let score = 0;

    function renderBlankQuestion() {
      if (currentIndex >= questions.length) {
        const percentage = Math.round((score / questions.length) * 100);
        userStats.quizScores.push(percentage);
        recordActivity('quizzes', 1);
        updateAnalyticsDisplay();

        container.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <h3 style="color: #1f2937; margin-bottom: 10px;">Fill-in-the-Blank Completed!</h3>
            <p style="font-size: 1.1rem; color: #4b5563;">Your Score: <strong>${score} / ${questions.length} (${percentage}%)</strong></p>
            <button id="restart-blank" style="margin-top: 15px; background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Retake Activity</button>
          </div>
        `;
        document.getElementById('restart-blank').addEventListener('click', () => {
          currentIndex = 0;
          score = 0;
          renderBlankQuestion();
        });
        return;
      }

      const q = questions[currentIndex];
      
      container.innerHTML = `
        <div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 8px; font-weight: 600;">Question ${currentIndex + 1} of ${questions.length}</div>
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 1rem; color: #1f2937; font-weight: 500;">${q.sentence}</div>
        <input type="text" id="blank-input" placeholder="Type missing word here..." style="width: 100%; padding: 10px; border: 1.5px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; margin-bottom: 15px; box-sizing: border-box;">
        <button id="submit-blank" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">Check Answer</button>
        <div id="blank-feedback" style="margin-top: 10px; font-weight: bold; font-size: 0.9rem;"></div>
      `;

      const inputField = document.getElementById('blank-input');
      inputField.focus();

      document.getElementById('submit-blank').addEventListener('click', () => {
        const userAns = inputField.value.trim().toLowerCase();
        const correctAns = q.answer.trim().toLowerCase();
        const feedback = document.getElementById('blank-feedback');
        
        inputField.disabled = true;
        document.getElementById('submit-blank').style.display = 'none';

        if (userAns === correctAns) {
          feedback.style.color = '#059669';
          feedback.innerText = "Correct!";
          score++;
        } else {
          feedback.style.color = '#dc2626';
          feedback.innerText = `Incorrect. The correct answer was: "${q.answer}"`;
        }

        const nextBtn = document.createElement('button');
        nextBtn.innerText = currentIndex === questions.length - 1 ? 'Finish Activity' : 'Next Question ->';
        nextBtn.style.cssText = `
          margin-top: 12px; background: #3b82f6; color: white; border: none; 
          padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;
        `;
        nextBtn.addEventListener('click', () => {
          currentIndex++;
          renderBlankQuestion();
        });
        container.appendChild(nextBtn);
      });
    }

    renderBlankQuestion();
  }

  // --- MATCHING INTERACTIVE FLOW ---
  function startInteractiveMatching(pairs, container) {
    let matchedCount = 0;
    const shuffledDefinitions = [...pairs].sort(() => Math.random() - 0.5);

    container.innerHTML = `
      <div style="font-size: 0.9rem; color: #4b5563; margin-bottom: 12px; font-weight: 600;">Match each term on the left with its definition on the right:</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;" id="matching-grid">
        <div id="terms-column" style="display: flex; flex-direction: column; gap: 10px;"></div>
        <div id="defs-column" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>
      <div id="matching-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.9rem; text-align: center;"></div>
    `;

    const termsCol = document.getElementById('terms-column');
    const defsCol = document.getElementById('defs-column');
    let selectedTermEl = null;
    let selectedTermPair = null;

    pairs.forEach(pair => {
      const btn = document.createElement('div');
      btn.innerText = pair.term;
      btn.style.cssText = `
        padding: 10px; background: white; border: 1.5px solid #d1d5db; border-radius: 6px; 
        cursor: pointer; font-size: 0.9rem; color: #1f2937; font-weight: 500; text-align: center;
      `;
      btn.addEventListener('click', () => {
        if (btn.style.background.includes('rgb(209')) return;
        termsCol.querySelectorAll('div').forEach(b => {
          if (!b.style.background.includes('rgb(209')) b.style.borderColor = '#d1d5db';
        });
        btn.style.borderColor = '#3b82f6';
        selectedTermEl = btn;
        selectedTermPair = pair;
      });
      termsCol.appendChild(btn);
    });

    shuffledDefinitions.forEach(defObj => {
      const btn = document.createElement('div');
      btn.innerText = defObj.definition;
      btn.style.cssText = `
        padding: 10px; background: white; border: 1.5px solid #d1d5db; border-radius: 6px; 
        cursor: pointer; font-size: 0.85rem; color: #374151; text-align: center;
      `;
      btn.addEventListener('click', () => {
        if (!selectedTermEl || !selectedTermPair) {
          alert("Please select a term on the left first!");
          return;
        }
        if (selectedTermPair.definition === defObj.definition) {
          selectedTermEl.style.background = '#d1fae5';
          selectedTermEl.style.borderColor = '#10b981';
          selectedTermEl.style.color = '#065f46';
          
          btn.style.background = '#d1fae5';
          btn.style.borderColor = '#10b981';
          btn.style.color = '#065f46';
          
          matchedCount++;
          selectedTermEl = null;
          selectedTermPair = null;

          if (matchedCount === pairs.length) {
            userStats.quizScores.push(100);
            recordActivity('quizzes', 1);
            updateAnalyticsDisplay();
            document.getElementById('matching-feedback').style.color = '#059669';
            document.getElementById('matching-feedback').innerText = "Awesome! All pairs matched correctly!";
          }