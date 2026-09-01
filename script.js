// --- TASK MANAGER LOGIC ---
document.getElementById('add-task-btn').addEventListener('click', () => {
  const taskInput = document.getElementById('task-input');
  const taskText = taskInput.value.trim();

  if (!taskText) {
    alert("Please enter a task first!");
    return;
  }

  let taskList = document.getElementById('task-list');
  if (!taskList) {
    taskList = document.createElement('ul');
    taskList.id = 'task-list';
    taskList.style.listStyle = 'none';
    taskList.style.marginTop = '15px';
    document.querySelector('.task-input-section').after(taskList);
  }

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
    <span style="font-size: 0.95rem; color: #1f2937;">${taskText}</span>
    <div style="display: flex; align-items: center; gap: 10px;">
      <input type="checkbox" style="width: 18px; height: 18px; cursor: pointer;" title="Mark as complete">
      <button style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Delete</button>
    </div>
  `;

  const checkbox = li.querySelector('input[type="checkbox"]');
  const span = li.querySelector('span');
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      span.style.textDecoration = 'line-through';
      span.style.color = '#9ca3af';
    } else {
      span.style.textDecoration = 'none';
      span.style.color = '#1f2937';
    }
  });

  li.querySelector('button').addEventListener('click', () => {
    li.remove();
  });

  taskList.appendChild(li);
  taskInput.value = "";
});

// --- SUNDAY - THURSDAY SCHEDULE WITH LOCALSTORAGE SAVING ---
document.getElementById('schedule-btn').addEventListener('click', () => {
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
    document.querySelector('.container').appendChild(scheduleBox);

    scheduleBox.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', (e) => {
        localStorage.setItem(e.target.dataset.key, e.target.value);
      });
    });

  } else {
    scheduleBox.style.display = scheduleBox.style.display === 'none' ? 'block' : 'none';
  }
});

// --- GENERATOR LOGIC ---
document.getElementById('generate-btn').addEventListener('click', async () => {
  const notes = document.getElementById('study-notes').value;
  const numQuestions = document.getElementById('num-questions').value;
  
  // Robustly find the quiz type dropdown by scanning all select elements on the page
  const selects = document.querySelectorAll('select');
  let quizType = "";
  selects.forEach(sel => {
    const val = sel.value.toLowerCase();
    if (val.includes("normal") || val.includes("q&a") || val.includes("multiple") || val.includes("mcq")) {
      quizType = val;
    }
  });
  if (!quizType && selects.length > 0) {
    quizType = selects[0].value.toLowerCase();
  }

  const outputDiv = document.getElementById('quiz-output');

  if (!notes.trim()) {
    outputDiv.innerHTML = "Please paste some study notes first!";
    return;
  }

  outputDiv.innerHTML = "Generating quickly...";

  const isNormalQA = quizType.includes("normal") || quizType.includes("q&a");

  let prompt = "";

  if (isNormalQA) {
    prompt = `Based on the following text, create exactly ${numQuestions} standard study questions without any multiple-choice options. 
List all the questions first numbered sequentially. 
Then, provide a separate Answer Key section containing the answers at the very bottom, after all the questions have been listed. Do not place answers directly under each individual question.

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
        "Authorization": "Bearer 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",
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
      
      if (isNormalQA) {
        // Normal Q&A Worksheet layout (Plain text view with separated Answer Key at the bottom)
        outputDiv.innerHTML = `
          <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; line-height: 1.6; color: #1f2937;">
            <h3 style="color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Study Questions & Worksheet</h3>
            <div style="font-size: 0.95rem; white-space: pre-wrap;">${rawContent}</div>
          </div>
        `;
      } else {
        if (rawContent.startsWith("```json")) {
          rawContent = rawContent.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (rawContent.startsWith("```")) {
          rawContent = rawContent.replace(/^```/, "").replace(/```$/, "").trim();
        }
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

// --- MCQ INTERACTIVE FLOW ---
function startInteractiveMCQ(questions, container) {
  let currentIndex = 0;
  let score = 0;

  function renderQuestion() {
    if (currentIndex >= questions.length) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h3 style="color: #1f2937; margin-bottom: 10px;">Quiz Completed!</h3>
          <p style="font-size: 1.1rem; color: #4b5563;">Your Score: <strong>${score} / ${questions.length}</strong></p>
          <button id="restart-quiz" style="margin-top: 15px; background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Retake Quiz</button>
        </div>
      `;
      document.getElementById('restart-quiz').addEventListener('click', () => {
        currentIndex = 0;
        score = 0;
        renderQuestion();
      });
      return;
    }

    const q = questions[currentIndex];
    
    container.innerHTML = `
      <div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 8px; font-weight: 600;">Question ${currentIndex + 1} of ${questions.length}</div>
      <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 1rem; color: #1f2937; font-weight: 500;">${q.question}</div>
      <div id="options-container" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;"></div>
      <button id="submit-ans" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;" disabled>Submit Answer</button>
      <div id="feedback" style="margin-top: 10px; font-weight: bold; font-size: 0.9rem;"></div>
    `;

    const optionsContainer = document.getElementById('options-container');
    let selectedOptionIndex = null;

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.innerText = opt;
      btn.style.cssText = `
        text-align: left; padding: 10px 14px; background: white; border: 1.5px solid #d1d5db; 
        border-radius: 6px; cursor: pointer; font-size: 0.9rem; color: #374151; transition: all 0.2s;
      `;
      
      btn.addEventListener('click', () => {
        Array.from(optionsContainer.children).forEach(b => {
          b.style.background = 'white';
          b.style.borderColor = '#d1d5db';
        });
        btn.style.background = '#eff6ff';
        btn.style.borderColor = '#3b82f6';
        selectedOptionIndex = idx;
        document.getElementById('submit-ans').disabled = false;
      });

      optionsContainer.appendChild(btn);
    });

    document.getElementById('submit-ans').addEventListener('click', () => {
      if (selectedOptionIndex === null) return;

      const submitBtn = document.getElementById('submit-ans');
      const feedback = document.getElementById('feedback');
      submitBtn.disabled = true;

      const optionButtons = Array.from(optionsContainer.children);
      optionButtons.forEach(b => b.style.pointerEvents = 'none');

      if (selectedOptionIndex === q.correct) {
        optionButtons[selectedOptionIndex].style.background = '#d1fae5';
        optionButtons[selectedOptionIndex].style.borderColor = '#10b981';
        feedback.style.color = '#059669';
        feedback.innerText = "Correct! Great job!";
        score++;
      } else {
        optionButtons[selectedOptionIndex].style.background = '#fee2e2';
        optionButtons[selectedOptionIndex].style.borderColor = '#ef4444';
        optionButtons[q.correct].style.background = '#d1fae5';
        optionButtons[q.correct].style.borderColor = '#10b981';
        feedback.style.color = '#dc2626';
        feedback.innerText = "Incorrect.";
      }

      submitBtn.style.display = 'none';

      const nextBtn = document.createElement('button');
      nextBtn.innerText = currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question ->';
      nextBtn.style.cssText = `
        margin-top: 12px; background: #3b82f6; color: white; border: none; 
        padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;
      `;
      nextBtn.addEventListener('click', () => {
        currentIndex++;
        renderQuestion();
      });
      container.appendChild(nextBtn);
    });
  }

  renderQuestion();
}
// --- FLASHCARD SYSTEM LOGIC ---
let flashcardDeck = [];
let currentCardIndex = 0;
let isShowingFront = true;

const modeAutoBtn = document.getElementById('mode-auto-btn');
const modeManualBtn = document.getElementById('mode-manual-btn');
const autoContainer = document.getElementById('flashcard-auto-container');
const manualContainer = document.getElementById('flashcard-manual-container');

// Switch between Auto and Manual UI tabs
if (modeAutoBtn && modeManualBtn) {
  modeAutoBtn.addEventListener('click', () => {
    autoContainer.style.display = 'block';
    manualContainer.style.display = 'none';
    modeAutoBtn.style.background = '#3b82f6';
    modeAutoBtn.style.color = 'white';
    modeManualBtn.style.background = '#e5e7eb';
    modeManualBtn.style.color = '#374151';
  });

  modeManualBtn.addEventListener('click', () => {
    autoContainer.style.display = 'none';
    manualContainer.style.display = 'block';
    modeManualBtn.style.background = '#3b82f6';
    modeManualBtn.style.color = 'white';
    modeAutoBtn.style.background = '#e5e7eb';
    modeAutoBtn.style.color = '#374151';
  });
}

// Manual Flashcard Adder
const addManualCardBtn = document.getElementById('add-manual-card-btn');
if (addManualCardBtn) {
  addManualCardBtn.addEventListener('click', () => {
    const frontText = document.getElementById('manual-front').value.trim();
    const backText = document.getElementById('manual-back').value.trim();

    if (!frontText || !backText) {
      alert("Please fill in both the front and back of the flashcard!");
      return;
    }

    flashcardDeck.push({ front: frontText, back: backText });
    document.getElementById('manual-front').value = '';
    document.getElementById('manual-back').value = '';
    
    currentCardIndex = flashcardDeck.length - 1;
    renderFlashcardPlayer();
  });
}

// Auto-Generate Flashcards via Groq API
const generateFlashcardsBtn = document.getElementById('generate-flashcards-btn');
if (generateFlashcardsBtn) {
  generateFlashcardsBtn.addEventListener('click', async () => {
    const notes = document.getElementById('flashcard-notes').value.trim();
    const displayArea = document.getElementById('flashcard-display-area');

    if (!notes) {
      displayArea.innerHTML = "<p style='color: #ef4444; font-size: 0.9rem;'>Please enter some notes to generate flashcards.</p>";
      return;
    }

    displayArea.innerHTML = "<p style='color: #6b7280; font-size: 0.9rem;'>Generating flashcards with AI...</p>";

    const prompt = `Based on the following text, generate 5 flashcards. 
You MUST return ONLY a valid JSON array with no extra text or markdown blocks outside of it.
Format:
[
  { "front": "Question or term", "back": "Answer or definition" }
]

Text:
${notes}`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
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
          rawContent = rawContent.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (rawContent.startsWith("```")) {
          rawContent = rawContent.replace(/^```/, "").replace(/```$/, "").trim();
        }
        
        flashcardDeck = JSON.parse(rawContent);
        currentCardIndex = 0;
        isShowingFront = true;
        renderFlashcardPlayer();
      } else {
        displayArea.innerHTML = "<p style='color: #ef4444;'>Failed to generate flashcards. Try again.</p>";
      }
    } catch (err) {
      displayArea.innerHTML = "<p style='color: #ef4444;'>An error occurred during generation.</p>";
    }
  });
}

// Interactive Flashcard Player Renderer
function renderFlashcardPlayer() {
  const displayArea = document.getElementById('flashcard-display-area');
  
  if (flashcardDeck.length === 0) {
    displayArea.innerHTML = "<p style='color: #6b7280; font-size: 0.9rem; text-align: center;'>No flashcards in the deck yet. Create some above!</p>";
    return;
  }

  const card = flashcardDeck[currentCardIndex];
  const cardText = isShowingFront ? card.front : card.back;
  const cardLabel = isShowingFront ? "Front (Click card to flip)" : "Back (Click card to flip)";
  const cardBg = isShowingFront ? "#f8fafc" : "#eff6ff";
  const cardBorder = isShowingFront ? "#3b82f6" : "#10b981";

  displayArea.innerHTML = `
    <div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 6px; text-align: center; font-weight: 600;">
      Card ${currentCardIndex + 1} of ${flashcardDeck.length}
    </div>
    
    <!-- Flashcard Box -->
    <div id="card-box" style="background: ${cardBg}; border: 2px solid ${cardBorder}; padding: 30px; border-radius: 8px; text-align: center; min-height: 120px; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <span style="font-size: 0.75rem; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; font-weight: bold;">${cardLabel}</span>
      <p style="font-size: 1.1rem; color: #1f2937; font-weight: 500; margin: 0;">${cardText}</p>
    </div>

    <!-- Navigation Controls -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
      <button id="prev-card" style="background: #6b7280; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">&larr; Previous</button>
      <button id="flip-card-btn" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">Flip Card</button>
      <button id="next-card" style="background: #3b82f6; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">Next &rarr;</button>
    </div>
  `;

  // Flip functionality via card click or flip button
  const flipAction = () => {
    isShowingFront = !isShowingFront;
    renderFlashcardPlayer();
  };

  document.getElementById('card-box').addEventListener('click', flipAction);
  document.getElementById('flip-card-btn').addEventListener('click', flipAction);

  // Previous Button
  document.getElementById('prev-card').addEventListener('click', () => {
    if (currentCardIndex > 0) {
      currentCardIndex--;
      isShowingFront = true;
      renderFlashcardPlayer();
    }
  });

  // Next Button
  document.getElementById('next-card').addEventListener('click', () => {
    if (currentCardIndex < flashcardDeck.length - 1) {
      currentCardIndex++;
      isShowingFront = true;
      renderFlashcardPlayer();
    }
  });
}