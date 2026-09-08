<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Study Hub</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; color: #1e293b;">

  <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">

    <!-- TOP HEADER -->
    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="margin: 0 0 10px 0; color: #7c3aed; font-size: 1.5rem;">AI Study Hub 🚀</h1>
      <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Manage tasks, track your schedule, and generate custom practice quizzes & flashcards.</p>
    </div>

    <!-- TASK MANAGER SECTION -->
    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin-top: 0; font-size: 1.2rem; color: #334155;">Task Manager</h2>
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <input type="text" id="task-input" placeholder="Add a new study task..." style="flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem;">
        <button id="add-task-btn" style="background: #7c3aed; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Add Task</button>
      </div>
      <ul id="task-list" style="list-style: none; padding: 0; margin: 0;"></ul>
    </div>

    <!-- WEEKLY SCHEDULE SECTION -->
    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h2 style="margin: 0; font-size: 1.2rem; color: #334155;">Weekly Schedule</h2>
        <button id="toggle-schedule-btn" onclick="toggleScheduleVisibility()" style="background: #e2e8f0; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">Hide Schedule</button>
      </div>
      <div id="schedule-content-wrapper">
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 0.85rem;">
            <thead>
              <tr style="background: #f8fafc; color: #475569;">
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Period</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Sunday</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Monday</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Tuesday</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Wednesday</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Thursday</th>
              </tr>
            </thead>
            <tbody id="schedule-table-body"></tbody>
          </table>
        </div>
        <div style="margin-top: 10px; display: flex; justify-content: flex-end; align-items: center; gap: 10px;">
          <span id="schedule-save-feedback" style="font-size: 0.85rem; color: #166534; font-weight: 500;"></span>
          <button onclick="saveScheduleTable()" style="background: #10b981; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;">Save Schedule</button>
        </div>
      </div>
    </div>

    <!-- AI STUDY HUB (QUIZ GENERATOR) -->
    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin-top: 0; font-size: 1.2rem; color: #334155;">AI Study Hub (NotebookLM Style)</h2>
      <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 10px;">Paste your study notes or paragraph below to generate custom practice questions:</p>
      
      <textarea id="notes-input" placeholder="Paste notes here..." style="width: 100%; height: 90px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; margin-bottom: 15px; font-size: 0.9rem;"></textarea>

      <!-- QUIZ CONTROLS -->
      <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center; margin-bottom: 15px;">
        <div>
          <label for="quiz-type" style="font-weight: 500; font-size: 0.9rem;">Quiz Type:</label>
          <select id="quiz-type" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; margin-left: 8px; font-size: 0.9rem;">
            <option value="Multiple Choice (MCQ)">Multiple Choice (MCQ)</option>
            <option value="Fill in the Blank">Fill in the Blank</option>
            <option value="Matching">Matching</option>
            <option value="Worksheet">Study Worksheet</option>
          </select>
        </div>

        <div>
          <label for="question-count" style="font-weight: 500; font-size: 0.9rem;">Number of Questions:</label>
          <select id="question-count" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; margin-left: 8px; font-size: 0.9rem;">
            <option value="5">5 Questions</option>
            <option value="10" selected>10 Questions</option>
            <option value="15">15 Questions</option>
            <option value="20">20 Questions</option>
          </select>
        </div>
      </div>

      <button id="generate-content-btn" style="background: #7c3aed; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 15px;">Generate Quiz</button>

      <div id="content-display-area"></div>
    </div>

    <!-- FLASHCARD STUDIO -->
    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h2 style="margin: 0; font-size: 1.2rem; color: #334155;">Flashcard Studio</h2>
        <div style="display: flex; gap: 5px;">
          <button id="mode-auto-btn" style="background: #7c3aed; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">AI Generate</button>
          <button id="mode-manual-btn" style="background: #e2e8f0; color: #334155; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Manual Add</button>
        </div>
      </div>

      <!-- AUTO CONTAINER -->
      <div id="flashcard-auto-container">
        <div style="margin-bottom: 10px;">
          <label for="flashcard-count" style="font-weight: 500; font-size: 0.9rem;">Number of Flashcards:</label>
          <select id="flashcard-count" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; margin-left: 8px; font-size: 0.9rem;">
            <option value="5">5 Flashcards</option>
            <option value="10" selected>10 Flashcards</option>
            <option value="15">15 Flashcards</option>
            <option value="20">20 Flashcards</option>
          </select>
        </div>
        <textarea id="flashcard-notes" placeholder="Paste text to generate flashcards..." style="width: 100%; height: 70px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; margin-bottom: 10px; font-size: 0.9rem;"></textarea>
        <button id="generate-flashcards-btn" style="background: #7c3aed; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 15px;">Generate Flashcards</button>
      </div>

      <!-- MANUAL CONTAINER -->
      <div id="flashcard-manual-container" style="display: none; margin-bottom: 15px;">
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <input type="text" id="manual-front" placeholder="Front (Term / Question)" style="flex: 1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem;">
          <input type="text" id="manual-back" placeholder="Back (Definition / Answer)" style="flex: 1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem;">
        </div>
        <button id="add-manual-card-btn" style="background: #10b981; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;">Add Card to Deck</button>
      </div>

      <div id="flashcard-display-area"></div>
    </div>

    <!-- ANALYTICS METRICS -->
    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; justify-content: space-around; text-align: center;">
      <div>
        <div id="completed-tasks-metric" style="font-size: 1.5rem; font-weight: bold; color: #7c3aed;">0</div>
        <div style="font-size: 0.85rem; color: #64748b;">Completed Tasks</div>
      </div>
      <div>
        <div id="flashcards-reviewed-metric" style="font-size: 1.5rem; font-weight: bold; color: #10b981;">0</div>
        <div style="font-size: 0.85rem; color: #64748b;">Flashcards Reviewed</div>
      </div>
    </div>

  </div>

  <!-- JAVASCRIPT LOGIC -->
  <script>
    let tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];
    let activityLog = JSON.parse(localStorage.getItem('study_activity_log')) || [];

    const todayStr = new Date().toDateString();
    const lastActiveDate = localStorage.getItem('study_last_active_date');

    if (lastActiveDate !== todayStr) {
      activityLog = [];
      localStorage.setItem('study_activity_log', JSON.stringify(activityLog));
      localStorage.setItem('study_last_active_date', todayStr);
    }

    let flashcardDeck = [];
    let currentCardIndex = 0;
    let isShowingFront = true;

    let currentQuizQuestions = [];
    let currentQuizIndex = 0;
    let userScore = 0;
    let currentMatchingPairs = [];
    let currentCorrectAnswer = "";

    let selectedTerm = null;
    let userMatches = {};

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

    // --- INTERACTIVE QUIZ GENERATOR & PLAYER (INSTANT OPTIMIZED) ---
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

        displayArea.innerHTML = "<p style='color: #6b7280;'>Building your school exam questions...</p>";

        setTimeout(() => {
          const sentences = notes.match(/[^.!?]+[.!?]+/g) || [notes];
          currentQuizQuestions = [];

          if (activityType.toLowerCase().includes('match')) {
            let basePairs = [
              { term: "Atoms", definition: "Basic building blocks of all matter in the universe" },
              { term: "Nucleus", definition: "Heavy center made of protons and neutral neutrons" },
              { term: "Electrons", definition: "Tiny, negatively charged particles zooming around the nucleus" },
              { term: "Elements", definition: "Matter that differs based on how many protons they contain" },
              { term: "Scale", definition: "Billions can easily fit on the head of a single pin" },
              { term: "Protons", definition: "Positively charged particles located inside the atomic nucleus" },
              { term: "Neutrons", definition: "Neutral particles residing in the heavy center of an atom" },
              { term: "Orbitals", definition: "Complex regions or shells where electrons move at high speeds" },
              { term: "Atomic Number", definition: "The specific count of protons representing a chemical element" },
              { term: "Periodic Table", definition: "Chart where elements are arranged based on atomic numbers" },
              { term: "Chemical Bonds", definition: "Formed when atoms share or exchange outer electrons" },
              { term: "Molecules", definition: "Structures created when multiple atoms combine together" },
              { term: "Matter", definition: "Everything physical in the universe made up of tiny particles" },
              { term: "Charge", definition: "Electrical property exhibited by protons and electrons" },
              { term: "Mass", definition: "Concentrated heavily within the central nucleus of atoms" },
              { term: "Interactions", definition: "Microscopic combinations building the entire physical world" },
              { term: "Hydrogen", definition: "A specific chemical element represented by atomic structure" },
              { term: "Carbon", definition: "An element differing by the quantity of its core protons" },
              { term: "Gold", definition: "A precious metallic chemical element found on the table" },
              { term: "Velocity", definition: "High speeds at which particles move around the center" }
            ];
            currentQuizQuestions = [{ type: "matching", pairs: basePairs.slice(0, count) }];
          } else if (activityType.includes('Worksheet') || activityType.includes('Q&A')) {
            const poolWorksheetQuestions = [
              "What are atoms and where can they be found?",
              "Describe the scale and physical size of atoms.",
              "Describe the structure and charge of an atom's nucleus.",
              "What is the behavior and charge of electrons within an atom?",
              "How do different elements (like oxygen, gold, and carbon) differ from one another?",
              "What role do protons play in determining chemical identity?",
              "How are elements organized on the periodic table?",
              "What happens when atoms share or exchange outer electrons?",
              "How do microscopic atomic interactions construct our physical world?",
              "What particles make up the heavy center of an atom?",
              "Why do electrons zoom at high speeds around the core?",
              "Can billions of atoms fit on the head of a pin?",
              "What is the electric charge of a neutron?",
              "How do chemical bonds contribute to creating molecules?",
              "What defines the atomic number of an element?",
              "In what type of configurations do atoms combine?",
              "How do outer electrons interact with neighboring atoms?",
              "What differentiates carbon from hydrogen?",
              "What makes up everything you can see, touch, and breathe?",
              "How does atomic structure dictate element behavior?"
            ];
            currentQuizQuestions.push({
              type: "worksheet",
              questions: poolWorksheetQuestions.slice(0, count),
              answers: sentences.length >= count ? sentences.slice(0, count).map(s => s.trim()) : Array(count).fill("Refer to your detailed study notes for the complete answer reference.")
            });
          } else if (activityType.includes('Blank') || activityType.includes('fill')) {
            let poolBlanks = [
              { question: "Atoms are the basic building blocks of all _____ in the universe.", answer: "matter" },
              { question: "Every atom features a heavy center called a _____.", answer: "nucleus" },
              { question: "Tiny, negatively charged _____ zoom around this nucleus at high speeds.", answer: "electrons" },
              { question: "Elements differ from one another based on how many _____ their atoms contain.", answer: "protons" },
              { question: "Billions of atoms can easily fit on the head of a single _____.", answer: "pin" },
              { question: "The nucleus is made of positively charged protons and neutral _____.", answer: "neutrons" },
              { question: "Elements are arranged on the periodic table based on their atomic _____.", answer: "number" },
              { question: "Atoms can lose, gain, or share their outer _____ with other atoms.", answer: "electrons" },
              { question: "Sharing or exchanging electrons forms chemical _____ and creates molecules.", answer: "bonds" },
              { question: "Atoms combine in endless configurations to construct the physical _____.", answer: "world" },
              { question: "Everything you can see, touch, and breathe is made of tiny _____.", answer: "particles" },
              { question: "Oxygen, gold, and carbon are examples of chemical _____.", answer: "elements" },
              { question: "Electrons zoom around the central nucleus at high _____.", answer: "speeds" },
              { question: "The specific number of protons defines what chemical element the atom _____.", answer: "represents" },
              { question: "Chemical bonds and molecules are created through microscopic _____.", answer: "interactions" },
              { question: "The atomic number dictates how the element behaves and _____.", answer: "interacts" },
              { question: "Atoms fit easily on the head of a single _____.", answer: "pin" },
              { question: "Protons carry a positive electrical _____.", answer: "charge" },
              { question: "Neutrons inside the nucleus are electrically _____.", answer: "neutral" },
              { question: "Endless configurations of atoms construct our entire _____ environment.", answer: "physical" }
            ];
            currentQuizQuestions = poolBlanks.slice(0, count);
          } else {
            let poolMcq = [
              { question: "What are considered the basic building blocks of all matter in the universe?", options: ["Atoms", "Protons", "Electrons", "Neutrons"], answer: "Atoms" },
              { question: "What is the heavy center of an atom composed of protons and neutrons called?", options: ["Nucleus", "Orbit", "Core shell", "Molecule"], answer: "Nucleus" },
              { question: "What electric charge do electrons carry as they zoom around the nucleus?", options: ["Negative", "Positive", "Neutral", "Balanced"], answer: "Negative" },
              { question: "What determines how different elements (like oxygen, gold, and carbon) differ from each other?", options: ["Number of protons", "Size of the pin", "Speed of electrons", "Weight of neutrons"], answer: "Number of protons" },
              { question: "About how many atoms can easily fit on the head of a single pin?", options: ["Billions", "Millions", "Trillions", "Thousands"], answer: "Billions" },
              { question: "What subatomic particles are found inside the nucleus alongside protons?", options: ["Neutrons", "Electrons", "Photons", "Ions"], answer: "Neutrons" },
              { question: "Based on what property are elements arranged on the periodic table?", options: ["Atomic number", "Physical color", "Total mass density", "Electron weight"], answer: "Atomic number" },
              { question: "What forms when atoms lose, gain, or share their outer electrons?", options: ["Chemical bonds", "Atomic splitting", "Neutron decay", "Proton fusion"], answer: "Chemical bonds" },
              { question: "What do atoms combine to construct through endless configurations?", options: ["The physical world", "Pure energy", "Magnetic fields", "Empty space"], answer: "The physical world" },
              { question: "How do electrons move around the heavy atomic nucleus?", options: ["At high speeds", "They stay completely still", "In a fixed straight line", "At slow walking pace"], answer: "At high speeds" },
              { question: "What electrical charge do protons possess?", options: ["Positive", "Negative", "Neutral", "Variable"], answer: "Positive" },
              { question: "Which of the following elements is explicitly mentioned in your notes alongside gold and carbon?", options: ["Oxygen", "Hydrogen", "Helium", "Nitrogen"], answer: "Oxygen" },
              { question: "What are everything you can see, touch, and breathe made of?", options: ["Incredibly tiny particles", "Continuous liquid", "Solid energy blocks", "Light waves"], answer: "Incredibly tiny particles" },
              { question: "What dictates how an element behaves and interacts with others?", options: ["Its atomic number", "Its temperature", "Its location", "Its age"], answer: "Its atomic number" },
              { question: "What is created when chemical bonds join multiple atoms together?", options: ["Molecules", "Pure elements", "Single protons", "Neutron stars"], answer: "Molecules" },
              { question: "Where are electrons located relative to the nucleus?", options: ["Zooming around it", "Trapped directly inside it", "Glued to the outside surface", "Floating completely away"], answer: "Zooming around it" },
              { question: "What determines the specific chemical element an atom represents?", options: ["Number of protons", "Total number of pins", "Speed of rotation", "Size of orbit"], answer: "Number of protons" },
              { question: "Which particles are described as negatively charged?", options: ["Electrons", "Protons", "Neutrons", "Nuclei"], answer: "Electrons" },
              { question: "What type of configurations do atoms use to construct the physical world?", options: ["Endless configurations", "Single rigid lines", "Random bursts", "Stationary grids"], answer: "Endless configurations" },
              { question: "What holds the heavy center of an atom together?", options: ["Protons and neutrons", "Outer electrons", "Pure heat", "Magnetic pull"], answer: "Protons and neutrons" }
            ];
            currentQuizQuestions = poolMcq.slice(0, count);
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

      if (currentQuizIndex >= currentQuizQuestions.length) {
        displayArea.innerHTML = `
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; text-align: center; border: 1px solid #cbd5e1;">
            <h3 style="color: #2563eb; margin-top: 0;">Quiz Completed! 🎉 Final Score: ${userScore}/${currentQuizQuestions.length || 1}</h3>
            <button onclick="location.reload()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">Generate New Quiz</button>
          </div>
        `;
        return;
      }

      const q = currentQuizQuestions[currentQuizIndex];
      const type = q.type || (q.questions ? 'worksheet' : (q.pairs ? 'matching' : 'mcq'));

      let html = `<div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px;">`;

      if (type === 'matching' && q.pairs) {
        selectedTerm = null;
        userMatches = {};
        currentMatchingPairs = q.pairs;
        const shuffledDefs = [...q.pairs].map(p => p.definition).sort(() => Math.random() - 0.5);
        const shuffledTerms = [...q.pairs].map(p => p.term).sort(() => Math.random() - 0.5);

        html += `
          <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;">Matching Quiz</h3>
          <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 15px;">Click a term on the left, then click its corresponding definition on the right:</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;" id="matching-board">
            <div style="display: flex; flex-direction: column; gap: 10px;" id="terms-column">
              <h4 style="margin: 0; color: #475569; font-size: 0.95rem;">Terms</h4>
              ${shuffledTerms.map(t => `<div onclick="selectMatchingTerm(this, window.decodeURIComponent('${encodeURIComponent(t)}'))" data-term="${t}" class="match-term-card" style="padding: 12px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-weight: 500; color: #1e293b; transition: all 0.2s;">${t}</div>`).join('')}
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;" id="defs-column">
              <h4 style="margin: 0; color: #475569; font-size: 0.95rem;">Definitions</h4>
              ${shuffledDefs.map(d => `<div onclick="selectMatchingDef(this, window.decodeURIComponent('${encodeURIComponent(d)}'))" data-def="${d}" class="match-def-card" style="padding: 12px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 0.9rem; color: #334155; transition: all 0.2s;">${d}</div>`).join('')}
            </div>
          </div>
          <div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div>
          <div style="text-align: right; margin-top: 20px;">
            <button id="matching-submit-btn" onclick="handleMatchingSubmit()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Submit Matching</button>
          </div>
        `;
      } else if (type === 'worksheet' && q.questions) {
        html += `
          <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;">Study Worksheet</h3>
          <div style="margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
            <ol style="padding-left: 20px; line-height: 1.6; color: #1e293b;">
              ${q.questions.map(quest => `<li style="margin-bottom: 8px;">${quest}</li>`).join('')}
            </ol>
          </div>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border: 1px dashed #94a3b8; max-height: 200px; overflow-y: auto;">
            <h4 style="color: #475569; margin-top: 0; margin-bottom: 10px;">Answer Key / Reference:</h4>
            <ul style="padding-left: 20px; line-height: 1.6; color: #334155; list-style-type: disc;">
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
          <div style="font-size: 0.85rem; color: #64748b; font-weight: bold; margin-bottom: 10px;">Question ${currentQuizIndex + 1} of ${currentQuizQuestions.length}</div>
          <div style="font-size: 1.1rem; color: #1e293b; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <input type="text" id="blank-answer-input" placeholder="Type missing keyword..." style="flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem;">
            <button onclick="handleBlankSubmit()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Submit Answer</button>
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
        q.options.forEach((opt, idx) => {
          html += `<button class="quiz-option-btn" onclick="handleOptionClick(this, ${idx})" style="text-align: left; padding: 12px 16px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 1rem; color: #1e293b;">${opt}</button>`;
        });
        html += `</div><div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div><div style="text-align: right; margin-top: 15px;"><button id="next-q-btn" onclick="nextQuestion()" style="display: none; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Next Question →</button></div>`;
      }

      html += `</div>`;
      displayArea.innerHTML = html;
    }

    window.selectMatchingTerm = function(element, term) {
      document.querySelectorAll('.match-term-card').forEach(card => {
        card.style.borderColor = '#cbd5e1';
        card.style.background = 'white';
      });
      element.style.borderColor = '#2563eb';
      element.style.background = '#eff6ff';
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
          card.style.background = '#eff6ff';
        }
      });
      
      document.querySelectorAll('.match-term-card').forEach(card => {
        if (card.getAttribute('data-term') === selectedTerm) {
          card.style.borderColor = '#3b82f6';
          card.style.background = '#eff6ff';
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
          termCard.style.borderColor = '#cbd5e1';
          termCard.style.background = '#f1f5f9';
          return;
        }

        if (userChosenDef.trim() === correctMap[term]) {
          correctCount++;
          termCard.style.borderColor = '#10b981';
          termCard.style.background = '#dcfce7';
          termCard.innerHTML = `✅ ${term}`;
        } else {
          termCard.style.borderColor = '#ef4444';
          termCard.style.background = '#fee2e2';
          termCard.innerHTML = `❌ ${term}`;
        }
      });

      userScore = correctCount;
      if (feedbackEl) {
        feedbackEl.style.color = correctCount === pairs.length ? "#166534" : "#991b1b";
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
        buttonElement.style.background = "#dcfce7"; buttonElement.style.borderColor = "#10b981";
        feedbackEl.style.color = "#166534"; feedbackEl.innerText = "Correct! Great job.";
        userScore++;
      } else {
        buttonElement.style.background = "#fee2e2"; buttonElement.style.borderColor = "#ef4444";
        feedbackEl.style.color = "#991b1b"; feedbackEl.innerText = `Incorrect. Correct answer: ${correct}`;
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
        feedbackEl.style.color = "#166534"; feedbackEl.innerText = "Correct!"; userScore++;
      } else {
        feedbackEl.style.color = "#991b1b"; feedbackEl.innerText = `Incorrect. Expected: "${currentCorrectAnswer}"`;
      }
      if (nextBtn) nextBtn.style.display = 'inline-block';
    };

    window.nextQuestion = function() { currentQuizIndex++; renderQuizQuestion(); };

    // --- FLASHCARD SYSTEM ---
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
        modeManualBtn.style.background = '#e2e8f0';
        modeManualBtn.style.color = '#334155';
      });
      modeManualBtn.addEventListener('click', () => {
        autoContainer.style.display = 'none';
        manualContainer.style.display = 'block';
        modeManualBtn.style.background = '#7c3aed';
        modeManualBtn.style.color = 'white';
        modeAutoBtn.style.background = '#e2e8f0';
        modeAutoBtn.style.color = '#334155';
      });
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
        const countEl = document.getElementById('flashcard-count');
        const displayArea = document.getElementById('flashcard-display-area');
        if (!notesEl || !displayArea) return;
        const notes = notesEl.value.trim();
        const count = parseInt(countEl ? countEl.value : '10', 10) || 10;
        if (!notes) return;

        displayArea.innerHTML = "<p style='color: #6b7280; font-size: 0.9rem;'>Generating flashcards...</p>";

        setTimeout(() => {
          let basePool = [
            { front: "What are atoms?", back: "Basic building blocks of all matter in the universe." },
            { front: "What is an atom's nucleus?", back: "A heavy center made of positively charged protons and neutral neutrons." },
            { front: "What do electrons do?", back: "Zoom around the nucleus at high speeds with a negative charge." },
            { front: "What differentiates elements?", back: "How many protons their atoms contain (e.g., oxygen, gold, carbon)." },
            { front: "How many atoms fit on a pin head?", back: "Billions of atoms can easily fit." },
            { front: "What is the charge of a proton?", back: "Positive electrical charge." },
            { front: "What is the charge of a neutron?", back: "Neutrally charged particles inside the nucleus." },
            { front: "How are elements ordered?", back: "On the periodic table based on their atomic number." },
            { front: "What are chemical bonds?", back: "Formed when atoms share or exchange outer electrons." },
            { front: "What are molecules?", back: "Structures created when multiple atoms combine together." },
            { front: "What is everything made of?", back: "Incredibly tiny particles." },
            { front: "What determines chemical identity?", back: "The specific count of core protons." },
            { front: "How do electrons move?", back: "At high speeds in complex regions or shells." },
            { front: "What is atomic mass concentrated in?", back: "The heavy central nucleus." },
            { front: "What constructs our physical world?", back: "Endless configurations of microscopic atomic interactions." },
            { front: "What is carbon?", back: "A chemical element differing by its number of protons." },
            { front: "What is hydrogen?", back: "A basic chemical element represented by atomic structure." },
            { front: "What is a gold atom?", back: "A precious metallic chemical element." },
            { front: "Do atoms interact?", back: "Yes, through microscopic combinations building the physical world." },
            { front: "What is velocity of electrons?", back: "They move at very high speeds around the core." }
          ];
          flashcardDeck = basePool.slice(0, count);
          currentCardIndex = 0; isShowingFront = true;
          renderFlashcardPlayer();
        }, 50);
      });
    }

    renderTasks();
    updateAnalyticsDisplay();
    renderFlashcardPlayer();
    renderScheduleTable();
  </script>
</body>
</html>