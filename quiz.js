// Quiz State Management
const quizState = {
    timers: {},          // Store timer intervals
    startTimes: {},      // Store when each question timer started
    timesTaken: {},      // Store time taken for each question
    answered: {},        // Track which questions have been answered
    scores: {},          // Track correct/incorrect answers
    totalQuestions: 6
};

// Initialize quiz when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeQuiz();
});

function initializeQuiz() {
    const quizCards = document.querySelectorAll('.quiz-card');
    
    quizCards.forEach(card => {
        const questionNum = card.dataset.question;
        const options = card.querySelectorAll('.option-btn');
        
        options.forEach(btn => {
            btn.addEventListener('click', () => handleAnswer(questionNum, btn));
        });
        
        // Add click listener to start timer on the card
        card.addEventListener('click', function(e) {
            if (!quizState.startTimes[questionNum] && !quizState.answered[questionNum]) {
                startTimer(questionNum);
            }
        }, { once: true });
    });
}

function startTimer(questionNum) {
    const timerElement = document.getElementById(`timer-${questionNum}`);
    quizState.startTimes[questionNum] = Date.now();
    
    timerElement.classList.add('running');
    timerElement.textContent = '⏱️ 0:00';
    
    // Update timer every second
    quizState.timers[questionNum] = setInterval(() => {
        const elapsed = Math.floor((Date.now() - quizState.startTimes[questionNum]) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerElement.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer(questionNum) {
    if (quizState.timers[questionNum]) {
        clearInterval(quizState.timers[questionNum]);
        delete quizState.timers[questionNum];
    }
    
    // Calculate time taken
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - quizState.startTimes[questionNum]) / 1000);
    quizState.timesTaken[questionNum] = timeTaken;
    
    return timeTaken;
}

function handleAnswer(questionNum, selectedBtn) {
    // Prevent answering if already answered
    if (quizState.answered[questionNum]) {
        return;
    }
    
    // Mark as answered
    quizState.answered[questionNum] = true;
    
    // Stop timer
    const timeTaken = stopTimer(questionNum);
    
    // Get correct answer
    const card = document.querySelector(`.quiz-card[data-question="${questionNum}"]`);
    const correctAnswer = card.dataset.answer;
    const selectedAnswer = selectedBtn.dataset.value;
    
    // Check if correct
    const isCorrect = selectedAnswer === correctAnswer;
    quizState.scores[questionNum] = isCorrect;
    
    // Update UI
    const allBtns = card.querySelectorAll('.option-btn');
    allBtns.forEach(btn => {
        btn.disabled = true; // Disable all buttons
        
        // Mark correct answer
        if (btn.dataset.value === correctAnswer) {
            btn.classList.add('correct');
        }
        // Mark wrong selection
        if (btn === selectedBtn && !isCorrect) {
            btn.classList.add('wrong');
        }
    });
    
    // Update card styling
    card.classList.add('answered');
    if (isCorrect) {
        card.classList.add('correct-answer');
    } else {
        card.classList.add('wrong-answer');
    }
    
    // Show result icon
    const resultArea = document.getElementById(`result-${questionNum}`);
    resultArea.innerHTML = isCorrect 
        ? '<span class="icon">✅</span>'
        : '<span class="icon">❌</span>';
    
    // Show time taken
    const timeDisplay = document.getElementById(`time-${questionNum}`);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    const timeText = minutes > 0 
        ? `Time: ${minutes}m ${seconds}s`
        : `Time: ${seconds}s`;
    timeDisplay.textContent = timeText;
    
    // Update score display
    updateScoreDisplay();
    
    // Check if quiz is complete
    checkQuizComplete();
}

function updateScoreDisplay() {
    const correctCount = Object.values(quizState.scores).filter(s => s).length;
    document.getElementById('score-display').textContent = `${correctCount}/6`;
    
    // Calculate average time bonus
    const times = Object.values(quizState.timesTaken);
    if (times.length > 0) {
        const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const avgMinutes = Math.floor(avgTime / 60);
        const avgSeconds = avgTime % 60;
        document.getElementById('time-bonus').textContent = 
            avgMinutes > 0 ? `${avgMinutes}m ${avgSeconds}s avg` : `${avgSeconds}s avg`;
    }
}

function checkQuizComplete() {
    const answeredCount = Object.keys(quizState.answered).length;
    
    if (answeredCount === quizState.totalQuestions) {
        showQuizSummary();
    }
}

function showQuizSummary() {
    const correctCount = Object.values(quizState.scores).filter(s => s).length;
    const times = Object.values(quizState.timesTaken);
    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = Math.round(totalTime / times.length);
    
    const summary = document.getElementById('quiz-summary');
    const finalScore = document.getElementById('final-score');
    const avgTimeDisplay = document.getElementById('avg-time');
    
    // Determine message based on score
    let message = '';
    if (correctCount === 6) {
        message = '🏆 Perfect Score! Amazing job!';
    } else if (correctCount >= 4) {
        message = '👏 Great work! Keep it up!';
    } else if (correctCount >= 2) {
        message = '💪 Good effort! Practice makes perfect!';
    } else {
        message = '📚 Keep practicing! You\'ll get there!';
    }
    
    finalScore.textContent = `${message} You got ${correctCount}/6 correct!`;
    
    const avgMinutes = Math.floor(avgTime / 60);
    const avgSeconds = avgTime % 60;
    avgTimeDisplay.textContent = `Average time per question: ${avgMinutes > 0 ? avgMinutes + 'm ' : ''}${avgSeconds}s`;
    
    summary.style.display = 'block';
    
    // Scroll to summary
    summary.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetQuiz() {
    // Clear all timers
    Object.values(quizState.timers).forEach(timer => clearInterval(timer));
    
    // Reset state
    quizState.timers = {};
    quizState.startTimes = {};
    quizState.timesTaken = {};
    quizState.answered = {};
    quizState.scores = {};
    
    // Reset UI
    const quizCards = document.querySelectorAll('.quiz-card');
    quizCards.forEach(card => {
        const questionNum = card.dataset.question;
        
        // Remove classes
        card.classList.remove('answered', 'correct-answer', 'wrong-answer');
        
        // Reset timer
        const timer = document.getElementById(`timer-${questionNum}`);
        timer.textContent = '⏱️ Click to start';
        timer.classList.remove('running');
        
        // Reset buttons
        const buttons = card.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'wrong');
        });
        
        // Clear results
        document.getElementById(`result-${questionNum}`).innerHTML = '';
        document.getElementById(`time-${questionNum}`).textContent = '';
    });
    
    // Reset stats
    document.getElementById('score-display').textContent = '0/6';
    document.getElementById('time-bonus').textContent = '-';
    document.getElementById('quiz-summary').style.display = 'none';
    
    // Re-initialize quiz
    initializeQuiz();
    
    // Scroll to top of quiz
    document.getElementById('daily-quiz').scrollIntoView({ behavior: 'smooth' });
}

// Check for saved quiz progress in localStorage (optional feature)
function saveProgress() {
    localStorage.setItem('mathQuizProgress', JSON.stringify({
        answered: quizState.answered,
        scores: quizState.scores,
        timesTaken: quizState.timesTaken
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('mathQuizProgress');
    if (saved) {
        const data = JSON.parse(saved);
        // Could restore progress here if desired
    }
}
