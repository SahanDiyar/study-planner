// --- TASK MANAGER LOGIC (With Checkboxes) ---
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
    <div style="display: flex; align-items: center; gap: 10px;">
      <input type="checkbox" style="width: 18px; height: 18px; cursor: pointer;">
      <span style="font-size: 0.95rem; color: #1f2937;">${taskText}</span>
    </div>
    <button style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Delete</button>
  `;

  // Toggle line-through when checkbox is ticked
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

  // Delete button action
  li.querySelector('button').addEventListener('click', () => {
    li.remove();
  });

  taskList.appendChild(li);
  taskInput.value = "";
});


// --- AI QUIZ GENERATOR LOGIC (With your API Key built-in) ---
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
        "Authorization": "Bearer gsk_UqoiKJ9ria3Ez7Bk4W4WGdyb3FYi1fNkTcBu60vTpmmZM5UDgIs",
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
      outputDiv.innerHTML = "Error: No response received from AI. Check your API key.";
    }
  } catch (error) {
    outputDiv.innerHTML = "Error generating quiz. Please check your network connection.";
  }
});