const loginContainer = document.getElementById('loginContainer');
const plannerContainer = document.getElementById('plannerContainer');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

// Check persistent login state on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('studentUser');
    if (savedUser) {
        showPlanner();
    }
    buildTimetableGrid();
});

// Log In Action
function handleLogin() {
    const username = usernameInput.value.trim();
    if (username === '') return;

    localStorage.setItem('studentUser', username);
    showPlanner();
}

// Log Out Action
function handleLogout() {
    localStorage.removeItem('studentUser');
    usernameInput.value = '';
    showLogin();
}

function showPlanner() {
    loginContainer.style.display = 'none';
    plannerContainer.style.display = 'block';
}

function showLogin() {
    plannerContainer.style.display = 'none';
    loginContainer.style.display = 'flex';
}

// Function to add a task
function addTask() {
    const taskTextValue = taskInput.value.trim();
    if (taskTextValue === '') return;

    const li = document.createElement('li');

    // Task text span
    const span = document.createElement('span');
    span.textContent = taskTextValue;
    span.className = 'task-text';
    
    // Create the checkbox element
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.addEventListener('change', () => {
        li.classList.toggle('completed', checkbox.checked);
    });

    span.addEventListener('click', () => {
        checkbox.checked = !checkbox.checked;
        li.classList.toggle('completed', checkbox.checked);
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', () => {
        taskList.removeChild(li);
    });

    li.appendChild(span);
    li.appendChild(checkbox);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);

    taskInput.value = '';
}

// Event Listeners
loginBtn.addEventListener('click', handleLogin);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});

logoutBtn.addEventListener('click', handleLogout);

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// --- Timetable Feature Logic ---
const toggleTimetableBtn = document.getElementById('toggleTimetableBtn');
const timetableSection = document.getElementById('timetableSection');
const timetableGridBody = document.querySelector('#timetableGrid tbody');

toggleTimetableBtn.addEventListener('click', () => {
    if (timetableSection.style.display === 'none') {
        timetableSection.style.display = 'block';
        toggleTimetableBtn.textContent = 'Hide Schedule';
    } else {
        timetableSection.style.display = 'none';
        toggleTimetableBtn.textContent = '📅 My Schedule';
    }
});

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
let timetableData = JSON.parse(localStorage.getItem('userTimetable')) || {};

function buildTimetableGrid() {
    timetableGridBody.innerHTML = '';

    // 7 Periods
    for (let p = 1; p <= 7; p++) {
        const tr = document.createElement('tr');

        // Period Label
        const tdPeriod = document.createElement('td');
        tdPeriod.textContent = `Period ${p}`;
        tdPeriod.style.fontWeight = 'bold';
        tr.appendChild(tdPeriod);

        // Days (Sunday to Thursday)
        days.forEach(day => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'timetable-input';
            input.placeholder = 'Subject...';

            const key = `p${p}-${day}`;
            input.value = timetableData[key] || '';

            // Save on input change
            input.addEventListener('input', () => {
                timetableData[key] = input.value;
                localStorage.setItem('userTimetable', JSON.stringify(timetableData));
            });

            td.appendChild(input);
            tr.appendChild(td);
        });

        timetableGridBody.appendChild(tr);
    }
}

// AI Quiz Generator Logic
const generateQuizBtn = document.getElementById('generateQuizBtn');
const studyText = document.getElementById('studyText');
const questionCount = document.getElementById('questionCount');
const quizResult = document.getElementById('quizResult');

async function generateQuiz() {
    const text = studyText.value.trim();
    const count = questionCount.value;

    if (text === '') {
        alert('Please paste some study text first!');
        return;
    }

    quizResult.textContent = 'Generating your custom quiz with AI... Please wait 🧠';

    const apiKey = 'YOUR_API_KEY_HERE';
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const prompt = `Based on the following text, generate exactly ${count} review questions with answer keys to help a student study. Format them clearly:\n\n${text}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
    
        if (response.ok && data.choices && data.choices.length > 0) {
            quizResult.textContent = data.choices[0].message.content;
        } else {
            console.error("API Error Response:", data);
            quizResult.textContent = `Error: ${data.error ? data.error.message : 'Unknown API error'}`;
        }
    } catch (error) {
        console.error(error);
        quizResult.textContent = 'Network error occurred while connecting to Groq API.';
    }
}

if (generateQuizBtn) {
    generateQuizBtn.addEventListener('click', generateQuiz);
}