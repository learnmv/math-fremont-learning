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
    
    document.documentElement.style.setProperty('--primary', grade === 6 ? '#f97316' : '#10b981');
    document.documentElement.style.setProperty('--primary-dark', grade === 6 ? '#ea580c' : '#059669');
    
    showScreen('quiz');
    loadQuestion();
}

function loadQuestion() {
    answered = false;
    const q = currentQuestions[currentQuestion];
    startTime = Date.now();
    
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
    
    if (index === question.correct) score++;
    
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
    showScreen('results');
    
    document.getElementById('final-score').textContent = score;
    document.getElementById('correct-count').textContent = score;
    
    const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    document.getElementById('avg-time').textContent = `${avgTime}s`;
    
    let rating = '😐';
    if (score >= 9) rating = '⭐⭐⭐';
    else if (score >= 7) rating = '⭐⭐';
    else if (score >= 5) rating = '⭐';
    else rating = '📚';
    
    document.getElementById('grade-rating').textContent = rating;
}

function retakeQuiz() {
    startQuiz(currentGrade);
}

function changeGrade() {
    showScreen('landing');
}
