function renderQuizQuestion() {
  const displayArea = document.getElementById('content-display-area');
  if (!displayArea) return;
  const isDark = currentTheme === 'dark';

  if (currentQuizMode === "matching") {
    let html = `
      <div style="background: ${isDark ? '#0f172a' : '#f8fafc'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 8px; padding: 20px;">
        <h3 style="margin-top: 0; color: #3b82f6;">Matching Pairs Worksheet</h3>
        <p style="font-size: 0.9rem; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-bottom: 20px;">Match each term on the left with its corresponding definition on the right:</p>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
    `;

    currentQuizQuestions.forEach((q, index) => {
      html += `
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 15px; align-items: center; padding: 12px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px;">
          <div style="font-weight: bold; color: inherit; font-size: 0.95rem;">${index + 1}. ${q.term}</div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <select id="match-select-${index}" style="padding: 8px 12px; background: ${isDark ? '#0f172a' : '#f8fafc'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 4px; color: inherit; font-size: 0.85rem; width: 100%;">
              <option value="">-- Choose matching definition --</option>
      `;
      shuffledDefinitionsPool.forEach(def => {
        html += `<option value="${encodeURIComponent(def)}">${def}</option>`;
      });
      html += `</select><div id="match-feedback-${index}" style="font-size: 0.8rem; font-weight: bold;"></div></div></div>`;
    });

    html += `
        </div>
        <div style="margin-top: 20px; text-align: right;">
          <button onclick="checkMatchingAnswers()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Check Answers</button>
        </div>
        <div id="matching-score-summary" style="margin-top: 15px; font-weight: bold; font-size: 1rem; text-align: center;"></div>
      </div>
    `;
    displayArea.innerHTML = html;
    return;
  }

  if (currentQuizIndex >= currentQuizQuestions.length) {
    displayArea.innerHTML = `
      <div style="background: ${isDark ? '#0f172a' : '#f8fafc'}; padding: 25px; border-radius: 8px; text-align: center; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'};">
        <h3 style="color: #2563eb; margin-top: 0;">Activity Completed! 🎉 Final Score: ${userScore}/${currentQuizQuestions.length}</h3>
        <button onclick="location.reload()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">Start Over</button>
      </div>
    `;
    return;
  }

  const q = currentQuizQuestions[currentQuizIndex];
  currentCorrectAnswer = q.answer;

  let html = `
    <div style="background: ${isDark ? '#0f172a' : '#f8fafc'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 8px; padding: 20px;">
      <div style="font-size: 0.85rem; color: ${isDark ? '#94a3b8' : '#64748b'}; font-weight: bold; margin-bottom: 10px;">Question ${currentQuizIndex + 1} of ${currentQuizQuestions.length}</div>
  `;

  if (currentQuizMode === "blank") {
    html += `
      <div style="font-size: 1.1rem; color: inherit; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <input type="text" id="blank-user-answer" placeholder="Type your answer here..." style="padding: 10px 14px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; font-size: 1rem; color: inherit; width: 100%; box-sizing: border-box;">
        <button onclick="submitBlankAnswer()" style="background: #2563eb; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; width: fit-content;">Submit Answer</button>
      </div>
    `;
  } else if (currentQuizMode === "worksheet") {
    html += `
      <div style="font-size: 1.1rem; color: inherit; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <textarea id="worksheet-user-answer" rows="3" placeholder="Write your notes or explanation here..." style="padding: 10px 14px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; font-size: 1rem; color: inherit; width: 100%; box-sizing: border-box;"></textarea>
        <button onclick="revealWorksheetAnswer()" id="reveal-btn" style="background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; width: fit-content;">Show Model Answer</button>
        <div id="model-answer-box" style="display: none; margin-top: 10px; padding: 12px; background: ${isDark ? '#334155' : '#f1f5f9'}; border-radius: 6px; font-size: 0.95rem; color: inherit;">
          <strong>Model Answer:</strong> ${q.answer}
        </div>
      </div>
    `;
  } else {
    // MCQ
    html += `
      <div style="font-size: 1.1rem; color: inherit; font-weight: 500; margin-bottom: 20px;">${q.question}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;" id="options-container">
    `;
    let shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
    shuffledOptions.forEach((opt) => {
      html += `<button class="quiz-option-btn" onclick="handleOptionClick(this, '${encodeURIComponent(opt)}')" style="text-align: left; padding: 10px 14px; background: ${isDark ? '#1e293b' : 'white'}; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 6px; cursor: pointer; font-size: 0.95rem; color: inherit;">${opt}</button>`;
    });
    html += `</div>`;
  }

  html += `<div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; font-size: 0.95rem;"></div><div style="text-align: right; margin-top: 15px;"><button id="next-q-btn" onclick="nextQuestion()" style="display: none; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Next →</button></div></div>`;
  displayArea.innerHTML = html;
}