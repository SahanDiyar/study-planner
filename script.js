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

// --- SCHEDULE VIEW TOGGLE ---
document.getElementById('schedule-btn').addEventListener('click', () => {
  let scheduleBox = document.getElementById('schedule-view');
  
  if (!scheduleBox) {
    scheduleBox = document.createElement('div');
    scheduleBox.id = 'schedule-view';
    scheduleBox.style.background = '#f9fafb';
    scheduleBox.style.border = '1px solid #e5e7eb';
    scheduleBox.style.padding = '20px';
    scheduleBox.style.borderRadius = '8px';
    scheduleBox.style.marginTop = '20px';
    
    scheduleBox.innerHTML = `
      <h3 style="margin-bottom: 10px; font-size: 1.2rem; color: #1f2937;">Weekly Timetable</h3>
      <table style="width: 100%; border-collapse: collapse; background: #fff;">
        <thead>
          <tr style="background: #3b82f6; color: white;">
            <th style="padding: 8px; border: 1px solid #d1d5db;">Day</th>
            <th style="padding: 8px; border: 1px solid #d1d5db;">Subject / Plan</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 8px; border: 1px solid #d1d5db; font-weight: bold;">Monday</td><td style="padding: 8px; border: 1px solid #d1d5db;">Biology & Code Review</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d1d5db; font-weight: bold;">Tuesday</td><td style="padding: 8px; border: 1px solid #d1d5db;">Chemistry Practice</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d1d5db; font-weight: bold;">Wednesday</td><td style="padding: 8px; border: 1px solid #d1d5db;">Physics & Quiz Prep</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d1d5db; font-weight: bold;">Thursday</td><td style="padding: 8px; border: 1px solid #d1d5db;">English & Literature</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d1d5db; font-weight: bold;">Weekend</td><td style="padding: 8px; border: 1px solid #d1d5db;">Project Building & Rest</td></tr>
        </tbody>
      </table>
    `;
    document.querySelector('.container').appendChild(scheduleBox);
  } else {
    // Toggle visibility if already open
    scheduleBox.style.display = scheduleBox.style.display === 'none' ? 'block' : 'none';
  }
});

// --- AI QUIZ GENERATOR LOGIC ---
document.getElementById('generate-btn').addEventListener('click', async () => {
  const notes = document.getElementById('study-notes').value;
  const numQuestions = document.getElementById('num-questions').value;
  const quizType = document.getElementById('question-type').value;
  const outputDiv = document.getElementById('quiz-output');

  if (!notes.trim()) {
    outputDiv.innerHTML = "Please paste some study notes first!";
    return;
  }

  outputDiv.innerHTML = "Generating your quiz with AI...";

  let typeInstruction = "";
  if (quizType === 'mcq') {
    typeInstruction = "Format them as Multiple Choice Questions with 4 options (A, B, C, D) and clearly indicate the correct answer at the end of each question.";
  } else {
    typeInstruction = "Format them as normal questions with a clear answer key provided at the end.";
  }

  const prompt = `Based on the following text, generate exactly ${numQuestions} quiz questions. ${typeInstruction}\n\nText:\n${notes}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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", // Replace this with your fresh Groq key!
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const aiReply = data.choices[0].message.content;
      outputDiv.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${aiReply}</pre>`;
    } else {
      outputDiv.innerHTML = "AI Error: " + (data.error?.message || "Invalid API key or quota exceeded.");
    }
  } catch (error) {
    outputDiv.innerHTML = "Network error generating quiz. Please check your connection.";
  }
});