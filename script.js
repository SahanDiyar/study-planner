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
  const quizType = document.getElementById('quiz-type').value; 
  const outputDiv = document.getElementById('quiz-output');

  if (!notes.trim()) {
    outputDiv.innerHTML = "Please paste some study notes first!";
    return;
  }

  outputDiv.innerHTML = "Generating quickly...";

  let prompt = "";

  if (quizType.includes("Multiple Choice")) {
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
  } else {
    prompt = `Based on the following text, create a comprehensive study worksheet containing a mix of question types: Fill-in-the-blanks, True/False, Matching, and Short Answers. 
Format the response clearly using clean HTML headings or bullet points. 
At the very bottom, include an "Answer Key" section with all the correct answers so the student can check their work afterwards.

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
        model: "llama-3.1-8b-instant", // Blazing fast active model
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      let rawContent = data.choices[0].message.content.trim();
      
      if (quizType.includes("Multiple Choice")) {
        if (rawContent.startsWith("```json")) {
          rawContent = rawContent.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (rawContent.startsWith("```")) {
          rawContent = rawContent.replace(/^```/, "").replace(/```$/, "").trim();
        }
        const quizQuestions = JSON.parse(rawContent);
        startInteractiveMCQ(quizQuestions, outputDiv);
      } else {
        // Normal Q&A Worksheet layout with answers at the bottom
        outputDiv.innerHTML = `
          <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; line-height: 1.6; color: #1f2937;">
            <h3 style="color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">📝 Study Worksheet (Blanks, True/False, Matching, Q&A)</h3>
            <div style="font-size: 0.95rem; white-space: pre-wrap;">${rawContent}</div>
          </div>
        `;
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
          <h3 style="color: #1f2937; margin-bottom: 10px;">Quiz Completed! 🎉</h3>
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
      nextBtn.innerText = currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question ➔';
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