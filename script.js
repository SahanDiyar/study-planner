// --- TASK MANAGER LOGIC ---
document.getElementById('add-task-btn').addEventListener('click', () => {
  const taskInput = document.getElementById('task-input');
  const taskText = taskInput.value.trim();

  if (!taskText) {
    alert("Please enter a task first!");
    return;
  }

  // Create a list container if it doesn't exist yet
  let taskList = document.getElementById('task-list');
  if (!taskList) {
    taskList = document.createElement('ul');
    taskList.id = 'task-list';
    taskList.style.listStyle = 'none';
    taskList.style.marginTop = '15px';
    document.querySelector('.task-input-section').after(taskList);
  }

  // Create task item
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
    <span>${taskText}</span>
    <button style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Delete</button>
  `;

  // Delete button action
  li.querySelector('button').addEventListener('click', () => {
    li.remove();
  });

  taskList.appendChild(li);
  taskInput.value = ""; // Clear input
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
        "Authorization": "Bearer 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", // Make sure to put your real key here!
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