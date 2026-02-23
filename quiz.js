// Quiz History Manager
const QuizHistory = {
    STORAGE_KEY: 'mathQuiz_history',
    
    save(quizData) {
        const history = this.getAll();
        const session = {
            id: Date.now(),
            date: new Date().toISOString(),
            grade: quizData.grade,
            score: quizData.score,
            totalQuestions: quizData.totalQuestions,
            totalTime: quizData.totalTime,
            avgTime: quizData.avgTime,
            questions: quizData.questions.map(q => ({
                topic: q.topic,
                text: q.text,
                correct: q.correct,
                userAnswer: q.userAnswer,
                correctAnswer: q.correctAnswer,
                time: q.time
            }))
        };
        history.unshift(session);
        // Keep only last 50 sessions
        if (history.length > 50) history.pop();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        return session.id;
    },
    
    getAll() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    getStats() {
        const history = this.getAll();
        if (history.length === 0) return null;
        
        const scores = history.map(h => (h.score / h.totalQuestions) * 100);
        return {
            totalQuizzes: history.length,
            avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
            bestScore: Math.max(...scores).toFixed(1),
            currentStreak: this.getStreak(history),
            lastQuiz: history[0]
        };
    },
    
    getStreak(history) {
        let streak = 0;
        for (const quiz of history) {
            if (quiz.score >= quiz.totalQuestions / 2) streak++;
            else break;
        }
        return streak;
    },
    
    getWeakTopics(grade) {
        const history = this.getAll().filter(h => h.grade === grade);
        const topicStats = {};
        
        history.forEach(session => {
            session.questions.forEach(q => {
                if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, total: 0 };
                topicStats[q.topic].total++;
                if (q.correct) topicStats[q.topic].correct++;
            });
        });
        
        return Object.entries(topicStats)
            .filter(([_, stats]) => stats.total >= 3) // At least 3 attempts
            .map(([topic, stats]) => ({
                topic,
                rate: (stats.correct / stats.total * 100).toFixed(0),
                accuracy: (stats.correct / stats.total * 100).toFixed(1)
            }))
            .sort((a, b) => a.rate - b.rate) &>
            .slice(0, 3); // Top 3 weak areas
    },
    
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};

// Question Banks
const questions = {
    6: [
        { topic: 'Ratios', text: 'If 3 apples cost $1.20, how much would 6 apples cost?', options: ['$1.80', '$2.40', '$3.60', '$0.60'], correct: 1 },
        { topic: 'Ratios', text: 'A recipe calls for 2 cups of flour for every 3 cups of sugar. How many cups of flour for 9 cups of sugar?', options: ['4 cups', '5 cups', '6 cups', '8 cups'], correct: 2 },
        { topic: 'Fractions', text: 'What is 3/4 ÷ 1/2?', options: ['3/8', '1 1/2', '2/3', '3/2'], correct: 1 },
        { topic: 'Fractions', text: 'Simplify: 12/18', options: ['2/3', '3/4', '4/6', '6/9'], correct: 0 },
        { topic: 'Decimals', text: 'What is 0.4 × 0.5?', options: ['0.02', '0.2', '2.0', '0.9'], correct: 1 },
        { topic: 'Exponents', text: 'What is 2³?', options: ['6', '8', '9', '16'], correct: 1 },
        { topic: 'Area', text: 'Find the area of a rectangle with length 8 and width 5.', options: ['13', '26', '40', '45'], correct: 2 },
        { topic: 'Mean', text: 'Find the mean: 5, 8, 12, 3, 7', options: ['6', '7', '8', '9'], correct: 1 },
        { topic: 'Percent', text: 'What is 25% of 80?', options: ['15', '20', '25', '30'], correct: 1 },
        { topic: 'Equations', text: 'Solve: x + 5 = 12', options: ['5', '6', '7', '8'], correct: 2 }
    ],
    7: [
        { topic: 'Proportions', text: 'If 4 workers build a wall in 6 days, how long for 3 workers?', options: ['8 days', '7 days', '9 days', '5 days'], correct: 0 },
        { topic: 'Percent', text: 'A shirt costs $40 and is 25% off. What is the sale price?', options: ['$30', '$35', '$32', '$28'], correct: 1 },
        { topic: 'Integers', text: 'What is (-5) × (-4)?', options: ['-20', '20', '-9', '9'], correct: 1 },
        { topic: 'Integers', text: 'What is 8 + (-12)?', options: ['-20', '20', '-4', '4'], correct: 2 },
        { topic: 'Probability', text: 'A coin is flipped 3 times. What is P(3 heads)?', options: ['1/8', '1/6', '1/4', '1/2'], correct: 0 },
        { topic: 'Probability', text: 'What is the probability of rolling a 6 on a die?', options: ['1/3', '1/4', '1/6', '1/12'], correct: 2 },
        { topic: 'Expressions', text: 'Simplify: 3x + 5x - 2x', options: ['5x', '6x', '8x', '10x'], correct: 1 },
        { topic: 'Equations', text: 'Solve: 2x + 3 = 11', options: ['3', '4', '5', '7'], correct: 1 },
        { topic: 'Integers', text: 'What is (-15) ÷ 3?', options: ['-5', '5', '-12', '12'], correct: 0 },
        { topic: 'Angles', text: 'Two angles are supplementary. One is 85°. What is the other?', options: ['85°', '95°', '90°', '105°'], correct: 1 }
    ]
};

// State
let currentGrade = 6;
let currentQuestions = [];
let currentQuestion = 0;
let score = 0;
let startTime = 0;
let times = [];
let answered = false;
let questionResults = []; // Track detailed results per question

// Screens
const screens = {
    landing: document.getElementById('landing'),
    quiz: document.getElementById('quiz'),
    results: document.getElementById('results')
};

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

function startQuiz(grade) {
    currentGrade = grade;
    currentQuestions = [...questions[grade]].sort(() => Math.random() - 0.5);
    currentQuestion = 0;
    score = 0;
    times = [];
    questionResults = [];
    
    document.documentElement.style.setProperty('--primary', grade === 6 ? '#f97316' : '#10b981');
    document.documentElement.style.setProperty('--primary-dark', grade === 6 ? '#ea580c' : '#059669');
    
    showScreen('quiz');
    loadQuestion();
}

function loadQuestion() {
    answered = false;
    const q = currentQuestions[currentQuestion];
    startTime = Date.now();
    window.currentQuestionData = q; // Store for result tracking
    
    document.getElementById('progress').style.width = `${((currentQuestion + 1) / 10) * 100}%`;
    document.getElementById('question-counter').textContent = `Question ${currentQuestion + 1}/10`;
    document.getElementById('timer').textContent = '⏱️ 00:00';
    document.getElementById('topic-tag').textContent = q.topic;
    document.getElementById('question-text').textContent = q.text;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => selectAnswer(i);
        optionsDiv.appendChild(btn);
    });
    
    document.getElementById('feedback').className = 'feedback hidden';
    
    startTimer();
}

let timerInterval;
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (answered) return;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `⏱️ ${mins}:${secs}`;
    }, 1000);
}

function selectAnswer(index) {
    if (answered) return;
    answered = true;
    clearInterval(timerInterval);
    
    const question = currentQuestions[currentQuestion];
    const options = document.querySelectorAll('.option-btn');
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    times.push(timeTaken);
    
    options.forEach((btn, i) => {
        btn.disabled = true;
        if (i === question.correct) btn.classList.add('correct');
        if (i === index && i !== question.correct) btn.classList.add('wrong');
    });
    
    const feedback = document.getElementById('feedback');
    feedback.className = `feedback ${index === question.correct ? 'correct' : 'wrong'}`;
    document.getElementById('feedback-icon').textContent = index === question.correct ? '✅' : '❌';
    document.getElementById('feedback-text').textContent = index === question.correct ? 'Correct!' : `The answer was: ${question.options[question.correct]}`;
    
    const isCorrect = index === question.correct;
    if (isCorrect) score++;
    
    // Store detailed result for this question
    questionResults.push({
        topic: question.topic,
        text: question.text,
        correct: isCorrect,
        userAnswer: index,
        correctAnswer: question.correct,
        time: timeTaken,
        userAnswerText: question.options[index],
        correctAnswerText: question.options[question.correct]
    });
    
    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < 10) {
            loadQuestion();
        } else {
            showResults();
        }
    }, 1500);
}

function showResults() {
    // Save to history
    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = Math.round(totalTime / times.length);
    
    const quizData = {
        grade: currentGrade,
        score: score,
        totalQuestions: 10,
        totalTime: totalTime,
        avgTime: avgTime,
        questions: questionResults
    };
    
    const sessionId = QuizHistory.save(quizData);
    const stats = QuizHistory.getStats();
    const weakTopics = QuizHistory.getWeakTopics(currentGrade);
    
    showScreen('results');
    
    // Update basic stats
    document.getElementById('final-score').textContent = score;
    document.getElementById('correct-count').textContent = score;
    document.getElementById('avg-time').textContent = `${avgTime}s`;
    
    let rating = '😐';
    if (score >= 9) rating = '⭐⭐⭐';
    else if (score >= 7) rating = '⭐⭐';
    else if (score >= 5) rating = '⭐';
    else rating = '📚';
    
    document.getElementById('grade-rating').textContent = rating;
    
    // Build and show detailed summary
    buildSummary(sessionId, stats, weakTopics, quizData);
}

function retakeQuiz() {
    startQuiz(currentGrade);
}

function changeGrade() {
    showScreen('landing');
}

function buildSummary(sessionId, stats, weakTopics, quizData) {
    // Remove any existing summary
    const existingSummary = document.getElementById('quiz-summary');
    if (existingSummary) existingSummary.remove();
    
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'quiz-summary';
    summaryDiv.className = 'quiz-summary';
    
    // Build weak areas section
    let weakAreasHTML = '';
    if (weakTopics.length > 0) {
        weakAreasHTML = `
            <div class="summary-section weak-areas">
                <h3>📚 Areas to Improve</h3>
                <div class="weak-topics-grid">
                    ${weakTopics.map(t => `
                        <div class="weak-topic-card">
                            <span class="topic-name">${t.topic}</span>
                            <span class="topic-rate" style="color: ${t.rate < 50 ? '#ef4444' : '#f97316'}">${t.rate}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Build history comparison
    let historyHTML = '';
    if (stats && stats.totalQuizzes > 1) {
        const prevScore = stats.lastQuiz && stats.lastQuiz.id !== sessionId ? 
            Math.round((stats.lastQuiz.score / stats.lastQuiz.totalQuestions) * 100) : null;
        const currScore = Math.round((score / 10) * 100);
        const comparison = prevScore !== null ? (currScore > prevScore ? '📈' : currScore < prevScore ? '📉' : '➡️') : '';
        
        historyHTML = `
            <div class="summary-section history-stats">
                <h3>📊 Your Progress</h3>
                <div class="stats-row">
                    <div class="stat-mini">
                        <span class="stat-num">${stats.totalQuizzes}</span>
                        <span>Total Quizzes</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-num">${stats.avgScore}%</span>
                        <span>Avg Score</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-num">${stats.bestScore}%</span>
                        <span>Best Score</span>
                    </div>
                </div>
                ${prevScore !== null ? `
                    <div class="comparison-row">
                        <span>Last quiz: ${prevScore}% <span class="arrow">${comparison}</span> Current: ${currScore}%</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Build question breakdown
    const breakdownHTML = `
        <div class="summary-section question-breakdown">
            <h3>📝 Question Breakdown</h3>
            <div class="question-list">
                ${quizData.questions.map((q, i) => `
                    <div class="q-item ${q.correct ? 'correct' : 'wrong'}">
                        <div class="q-info">
                            <span class="q-num">Q${i+1}</span>
                            <span class="q-topic">${q.topic}</span>
                            <span class="q-time">⏱️ ${q.time}s</span>
                        </div>
                        ${!q.correct ? `
                            <div class="q-detail">
                                <span>Your answer: ${q.userAnswerText}</span>
                                <span class="correct-ans">✓ ${q.correctAnswerText}</span>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    summaryDiv.innerHTML = `
        <div class="summary-wrapper">
            <div class="summary-header">
                <h2>Quiz Summary</h2>
                <span class="session-date">${new Date().toLocaleDateString()}</span>
            </div>
            ${historyHTML}
            ${weakAreasHTML}
            ${breakdownHTML}
            <div class="summary-actions">
                <button class="btn btn-secondary" onclick="viewHistory()">📜 View History</button>
                <button class="btn" style="background: #ef4444; color: white;" onclick="clearHistory()">🗑️ Clear History</button>
            </div>
        </div>
    `;
    
    document.getElementById('results').appendChild(summaryDiv);
}

function viewHistory() {
    window.open('history.html', '_blank');
}

function clearHistory() {
    if (confirm('Clear all quiz history? This cannot be undone.')) {
        QuizHistory.clear();
        document.getElementById('quiz-summary').remove();
    }
}
