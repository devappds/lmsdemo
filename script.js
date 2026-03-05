/**
 * LMS — Shared JavaScript
 * Handles: localStorage helpers, theme toggle, toast notifications,
 *          sidebar toggle, student quiz engine, confetti.
 */

/* ============================================================
   STORAGE HELPERS
   Attached to window so inline scripts in all pages can access them
   regardless of const/let scoping between <script> tags.
   ============================================================ */
window.DB = {
  /** Get parsed JSON or a default */
  get(key, def = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? def; }
    catch { return def; }
  },
  /** Set serialised JSON */
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  /** Remove key */
  del(key) { localStorage.removeItem(key); },
};

/* Namespaced keys — on window so every inline script can reference KEYS.* */
window.KEYS = {
  QUESTIONS: 'lms_questions',
  RESULTS:   'lms_quiz_results',
  THEME:     'lms_theme',
  USER:      'lms_user',
};

/* Seed demo questions if none exist */
function seedDemoQuestions() {
  if (DB.get(KEYS.QUESTIONS, []).length > 0) return;
  const demos = [
    {
      id: uid(), createdAt: Date.now(),
      question: 'What does HTML stand for?',
      options: ['Hyper Text Markup Language','High Tech Modern Language','Hyperlink and Text Markup Language','Home Tool Markup Language'],
      correct: 0,
    },
    {
      id: uid(), createdAt: Date.now() - 1000,
      question: 'Which CSS property controls the text size?',
      options: ['font-weight','text-size','font-size','text-scale'],
      correct: 2,
    },
    {
      id: uid(), createdAt: Date.now() - 2000,
      question: 'Which keyword declares a constant in JavaScript?',
      options: ['var','let','const','static'],
      correct: 2,
    },
    {
      id: uid(), createdAt: Date.now() - 3000,
      question: 'What does the CSS "box model" include?',
      options: ['Content, border, margin, padding','Width and height only','Color and font','Display and visibility'],
      correct: 0,
    },
    {
      id: uid(), createdAt: Date.now() - 4000,
      question: 'Which method is used to add an element at the end of a JavaScript array?',
      options: ['push()','pop()','shift()','unshift()'],
      correct: 0,
    },
    {
      id: uid(), createdAt: Date.now() - 5000,
      question: 'What is the correct way to comment in JavaScript?',
      options: ['<!-- comment -->','/* comment */','// comment','## comment'],
      correct: 2,
    },
    {
      id: uid(), createdAt: Date.now() - 6000,
      question: 'Which HTTP method is typically used to send data to a server?',
      options: ['GET','HEAD','POST','FETCH'],
      correct: 2,
    },
    {
      id: uid(), createdAt: Date.now() - 7000,
      question: 'What is localStorage in JavaScript?',
      options: ['A server-side database','A way to store files locally','A web storage API for key-value pairs','A CSS variable system'],
      correct: 2,
    },
  ];
  DB.set(KEYS.QUESTIONS, demos);
}

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */
/** Generate a short unique ID */
window.uid = function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Format date to readable string */
window.fmtDate = function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

/** Format seconds to mm:ss */
window.fmtTime = function fmtTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Clamp a number between min and max */
window.clamp = function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

/* ============================================================
   THEME TOGGLE
   ============================================================ */
function initTheme() {
  const saved = DB.get(KEYS.THEME, 'dark');
  if (saved === 'light') document.body.classList.add('light-mode');
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
  DB.set(KEYS.THEME, theme);
}

/* Wire every .theme-toggle button on the page */
function initThemeToggles() {
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
window.showToast = function showToast(msg, type = 'success', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type !== 'success' ? type : ''}`;
  toast.innerHTML = `<span>${icons[type] || '✅'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/* ============================================================
   SIDEBAR (mobile toggle)
   ============================================================ */
function initSidebar() {
  const sidebar  = document.querySelector('.sidebar');
  const overlay  = document.querySelector('.sidebar-overlay');
  const hamburger = document.querySelector('.hamburger');
  if (!sidebar || !hamburger) return;

  function openSidebar()  { sidebar.classList.add('open'); overlay?.classList.add('open'); }
  function closeSidebar() { sidebar.classList.remove('open'); overlay?.classList.remove('open'); }

  hamburger.addEventListener('click', openSidebar);
  overlay?.addEventListener('click', closeSidebar);

  // Active nav highlight
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    if (item.dataset.page === current) item.classList.add('active');
  });
}

/* ============================================================
   STAGGER ANIMATIONS
   ============================================================ */
function initStagger() {
  document.querySelectorAll('[data-stagger]').forEach(el => {
    el.classList.add('ready');
  });
}

/* ============================================================
   ANIMATED NUMBER COUNTER
   ============================================================ */
window.animateCount = function animateCount(el, target, duration = 800) {
  const start = performance.now();
  const from = parseInt(el.textContent) || 0;
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    el.textContent = Math.round(from + (target - from) * ease);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================================================
   QUIZ ENGINE (Student Interface)
   ============================================================ */
window.Quiz = (() => {
  // State
  let questions    = [];
  let current      = 0;
  let answers      = [];       // index of chosen option, or -1 for skip
  let timerInterval = null;
  let timeLeft     = 0;
  let totalTime    = 0;
  let studentName  = '';
  let quizActive   = false;
  const SECONDS_PER_Q = 30;    // timer per question

  /* -- DOM refs -- */
  const $ = id => document.getElementById(id);

  /* Screens */
  function showScreen(id) {
    document.querySelectorAll('.quiz-screen').forEach(s => s.style.display = 'none');
    const el = $(id);
    if (el) { el.style.display = ''; el.classList.add('animate-fade-in'); }
  }

  /* ---- LANDING ---- */
  function renderLanding() {
    const qs = DB.get(KEYS.QUESTIONS, []);
    const totalQ = $('landing-total-q');
    const totalT = $('landing-timer');
    if (totalQ) totalQ.textContent = qs.length;
    if (totalT) totalT.textContent = fmtTime(qs.length * SECONDS_PER_Q);
    showScreen('screen-landing');
  }

  /* ---- NAME ENTRY ---- */
  function startNameEntry() {
    const q = DB.get(KEYS.QUESTIONS, []);
    if (q.length === 0) {
      showToast('No questions available yet. Ask your admin to add some!', 'warn');
      return;
    }
    showScreen('screen-name');
    const input = $('student-name-input');
    if (input) input.focus();
  }

  /* ---- BEGIN QUIZ ---- */
  function beginQuiz() {
    const nameInput = $('student-name-input');
    studentName = nameInput ? nameInput.value.trim() : 'Student';
    if (!studentName) { showToast('Please enter your name', 'warn'); return; }

    questions = DB.get(KEYS.QUESTIONS, []);
    if (questions.length === 0) { showToast('No questions found!', 'error'); return; }

    // Shuffle questions
    questions = [...questions].sort(() => Math.random() - 0.5);

    current   = 0;
    answers   = new Array(questions.length).fill(-1);
    quizActive = true;
    totalTime  = 0;

    showScreen('screen-quiz');
    renderQuestion();
  }

  /* ---- RENDER QUESTION ---- */
  function renderQuestion() {
    const q = questions[current];
    const total = questions.length;

    // Update header info
    setText('q-num', `Question ${current + 1} of ${total}`);
    setText('q-text', q.question);

    // Progress bar
    const pct = ((current) / total) * 100;
    const pBar = $('q-progress-fill');
    if (pBar) pBar.style.width = `${pct}%`;

    // Options
    const optList = $('options-list');
    if (optList) {
      const letters = ['A','B','C','D'];
      optList.innerHTML = q.options.map((opt, i) => `
        <div class="option-item" data-idx="${i}" onclick="Quiz.selectOption(${i})">
          <div class="option-letter">${letters[i]}</div>
          <div class="option-text">${opt}</div>
        </div>
      `).join('');
    }

    // Restore previous answer highlight if navigating back
    if (answers[current] !== -1) highlightSelected(answers[current]);

    // Next/Submit button
    const nextBtn = $('btn-next');
    if (nextBtn) {
      nextBtn.textContent = current === total - 1 ? '🏁 Finish Quiz' : 'Next →';
      nextBtn.disabled = answers[current] === -1;
    }

    // Timer
    startTimer(SECONDS_PER_Q);
  }

  /* ---- SELECT OPTION ---- */
  function selectOption(idx) {
    if (!quizActive) return;
    answers[current] = idx;
    highlightSelected(idx);
    const nextBtn = $('btn-next');
    if (nextBtn) nextBtn.disabled = false;
  }

  function highlightSelected(idx) {
    document.querySelectorAll('.option-item').forEach((el, i) => {
      el.classList.toggle('selected', i === idx);
    });
  }

  /* ---- TIMER ---- */
  function startTimer(secs) {
    clearInterval(timerInterval);
    timeLeft = secs;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeLeft--;
      totalTime++;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        // Auto-advance on time-up
        if (answers[current] === -1) answers[current] = -1; // mark skipped
        handleNext(true);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const el = $('timer-display');
    if (!el) return;
    el.textContent = `⏱ ${fmtTime(timeLeft)}`;
    el.parentElement?.classList.toggle('warning', timeLeft <= 8);
  }

  /* ---- NEXT / FINISH ---- */
  function handleNext(autoAdvance = false) {
    clearInterval(timerInterval);

    if (!autoAdvance && answers[current] === -1) {
      showToast('Please select an answer', 'warn');
      return;
    }

    // Reveal correct / wrong briefly
    const q = questions[current];
    document.querySelectorAll('.option-item').forEach((el, i) => {
      if (i === q.correct) el.classList.add('correct');
      else if (i === answers[current] && answers[current] !== q.correct) el.classList.add('wrong');
      else el.classList.add('disabled');
    });

    const nextBtn = $('btn-next');
    if (nextBtn) nextBtn.disabled = true;

    setTimeout(() => {
      if (current < questions.length - 1) {
        current++;
        renderQuestion();
      } else {
        finishQuiz();
      }
    }, 900);
  }

  /* ---- FINISH ---- */
  function finishQuiz() {
    quizActive = false;
    clearInterval(timerInterval);

    // Calculate score
    const score = answers.reduce((acc, ans, i) => acc + (ans === questions[i].correct ? 1 : 0), 0);
    const total  = questions.length;
    const pct    = Math.round((score / total) * 100);
    const result = {
      id: uid(), studentName, score, total,
      percentage: pct, timeTaken: totalTime,
      date: Date.now(),
    };

    // Save result
    const history = DB.get(KEYS.RESULTS, []);
    history.push(result);
    DB.set(KEYS.RESULTS, history);

    renderResults(result);
    if (pct >= 70) spawnConfetti();
  }

  /* ---- RESULTS ---- */
  function renderResults(result) {
    showScreen('screen-results');

    const { score, total, percentage, timeTaken, studentName: sn } = result;

    // Greeting
    let emoji = '😐', grade = 'average', msg = 'Good effort! Keep practicing.';
    if (percentage >= 90) { emoji = '🏆'; grade = 'excellent'; msg = 'Outstanding performance!'; }
    else if (percentage >= 70) { emoji = '🎉'; grade = 'good'; msg = 'Great job! Well done!'; }
    else if (percentage < 50) { emoji = '📚'; grade = 'poor'; msg = 'Keep studying, you\'ll improve!'; }

    setText('result-emoji', emoji);
    setText('result-name', sn);
    setText('result-msg', msg);
    setText('result-score', `${score} / ${total}`);
    setText('result-pct', `${percentage}%`);
    setText('result-time', fmtTime(timeTaken));
    setText('result-correct', score);
    setText('result-wrong', total - score);
    setText('result-time-stat', fmtTime(timeTaken));

    const circle = $('score-circle');
    if (circle) {
      circle.className = `score-circle ${grade}`;
    }

    // Animate donut
    const fill = $('donut-fill');
    if (fill) {
      const colour = { excellent: '#10b981', good: '#00e5cc', average: '#f59e0b', poor: '#f43f5e' }[grade];
      fill.setAttribute('stroke', colour);
      // 283 = circumference of r=45 circle
      const offset = 283 - (283 * percentage / 100);
      setTimeout(() => { fill.style.strokeDashoffset = offset; }, 100);
    }
  }

  /* ---- RESTART ---- */
  function restart() {
    showScreen('screen-landing');
    renderLanding();
  }

  /* ---- HELPER ---- */
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ---- PUBLIC API ---- */
  return { renderLanding, startNameEntry, beginQuiz, selectOption, handleNext, restart };
})();

/* ============================================================
   CONFETTI
   ============================================================ */
window.spawnConfetti = function spawnConfetti() {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  document.body.appendChild(canvas);
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -Math.random() * canvas.height,
    size: Math.random() * 8 + 4,
    colour: ['#00e5cc','#6366f1','#f43f5e','#f59e0b','#10b981'][Math.floor(Math.random()*5)],
    speed: Math.random() * 3 + 2,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    drift: (Math.random() - 0.5) * 1.5,
  }));
  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    pieces.forEach(p => {
      if (p.y > canvas.height + 20) return;
      alive++;
      p.y += p.speed; p.x += p.drift; p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.colour;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    });
    if (alive > 0) frame = requestAnimationFrame(draw);
    else canvas.remove();
  }
  draw();
  setTimeout(() => { cancelAnimationFrame(frame); canvas.remove(); }, 5000);
}

/* ============================================================
   MINI BAR CHART (used in admin analytics)
   ============================================================ */
window.renderBarChart = function renderBarChart(containerId, data, max) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = data.map(({ label, val, filled }) => {
    const h = max > 0 ? Math.round((val / max) * 100) : 0;
    return `<div class="chart-bar ${filled ? 'filled' : ''}" style="height:${h}%" data-val="${val}" title="${label}: ${val}"></div>`;
  }).join('');
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  seedDemoQuestions();
  initTheme();
  initThemeToggles();
  initSidebar();
  initStagger();
});
