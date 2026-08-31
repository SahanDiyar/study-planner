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

// --- SUNDAY - THURSDAY, 7 LESSONS SCHEDULE BUILDER ---
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
      <p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 10px;">Type your 7 subjects for each day below:</p>
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
        tableHTML += `<td style="padding: 6px; border: 1px solid #cbd5e1;"><input type="text" placeholder="Subject ${i}" style="width: 90%; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.8rem; text-align: center;"></td>`;
      });
      tableHTML += `</tr>`;
    }

    tableHTML += `</tbody></table>`;
    scheduleBox.innerHTML = tableHTML;
    document.querySelector('.container').appendChild(scheduleBox);
  } else {
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
        "Authorization": "Bearer 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",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Updated to current active Groq model
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const aiReply = data.choices[0].message.content;
      outputDiv.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${aiReply}</pre>`;
    } else {
      outputDiv.innerHTML = "AI Error: " + (data.error?.message || "Invalid response from AI.");
    }
  } catch (error) {
    outputDiv.innerHTML = "Network error generating quiz. Please check your connection.";
  }
});