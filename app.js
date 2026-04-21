/* ═══════════════════════════════════════════════════════
   STUDENT JOURNAL — Main Application
   Vanilla JS, Zero Dependencies, 60fps target
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ── VERSIONS ── */
const APP_VERSION  = '2.0';
const DATA_VERSION = 1; // bump when backup schema changes

/* ── TELEGRAM ANALYTICS ── */
const TG_TOKEN   = '7912834681:AAE1Nf7-coYuj5q7KFq6Qtbo7eDNHmpN1-4';
const TG_CHAT_ID = 1189173824;

/* ── PLATFORM DETECTION ── */
const Platform = {
  isIOS:       /iphone|ipad/i.test(navigator.userAgent),
  isStandalone: window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true,
};

/* ── SERVICE WORKER + UPDATE MANAGER ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
      // Auto-reload when a new SW takes control (skipWaiting + clients.claim fired)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        location.reload();
      });

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });

      // Force-check for update every time the page becomes visible
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update();
      });
    }).catch(() => {});
  });
}

function showUpdateBanner() {
  if (document.querySelector('.update-banner')) return;
  const b = document.createElement('div');
  b.className = 'update-banner';
  b.innerHTML = `<span>Доступно обновление</span>
    <button onclick="applyUpdate()">Обновить</button>`;
  document.body.appendChild(b);
  setTimeout(() => b.classList.add('show'), 100);
}

window.applyUpdate = function() {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    location.reload();
  });
};

/* ── STORAGE ── */
const DB = {
  get(key, def = []) {
    try { return JSON.parse(localStorage.getItem(key)) ?? def; }
    catch { return def; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  del(key) { localStorage.removeItem(key); }
};

/* ── CONSTANTS ── */
const SUBJECTS = [
  { id: 's1', name: 'Матанализ',        short: 'МА',  color: '#7c3aed' },
  { id: 's2', name: 'Программирование', short: 'ПГ',  color: '#2563eb' },
  { id: 's3', name: 'Физика',           short: 'ФЗ',  color: '#06b6d4' },
  { id: 's4', name: 'История',          short: 'ИС',  color: '#ec4899' },
  { id: 's5', name: 'Английский',       short: 'EN',  color: '#10b981' },
  { id: 's6', name: 'Базы данных',      short: 'БД',  color: '#f59e0b' },
];

const DAYS_RU = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня',
                   'июля','августа','сентября','октября','ноября','декабря'];
const GRADE_LABELS = { exam: 'Экзамен', test: 'Контрольная', hw: 'Домашняя', lab: 'Лабораторная', seminar: 'Семинар' };
const PRIORITY_LABELS = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };

/* ── SAMPLE DATA (first launch) ── */
function seedData() {
  if (DB.get('seeded', false)) return;

  const today = new Date();
  const d = (offset, h, m) => {
    const dt = new Date(today);
    dt.setDate(today.getDate() + offset);
    dt.setHours(h, m, 0, 0);
    return dt.toISOString();
  };
  const dStr = (offset) => {
    const dt = new Date(today);
    dt.setDate(today.getDate() + offset);
    return dt.toISOString().split('T')[0];
  };

  // Schedule (0=Sun,1=Mon,...,6=Sat)
  const schedule = [
    { id:'l1', day:1, start:'09:00', end:'10:30', subject:'s1', teacher:'Иванов И.И.',   room:'А-201' },
    { id:'l2', day:1, start:'11:00', end:'12:30', subject:'s2', teacher:'Петров П.П.',   room:'Б-105' },
    { id:'l3', day:1, start:'14:00', end:'15:30', subject:'s5', teacher:'Смит Д.',        room:'Е-310' },
    { id:'l4', day:2, start:'09:00', end:'10:30', subject:'s3', teacher:'Сидоров С.С.',  room:'В-207' },
    { id:'l5', day:2, start:'11:00', end:'12:30', subject:'s6', teacher:'Козлова А.В.',  room:'Д-103' },
    { id:'l6', day:2, start:'13:00', end:'14:30', subject:'s4', teacher:'Новикова Л.П.', room:'А-115' },
    { id:'l7', day:3, start:'09:00', end:'10:30', subject:'s1', teacher:'Иванов И.И.',   room:'А-201' },
    { id:'l8', day:3, start:'11:00', end:'12:30', subject:'s2', teacher:'Петров П.П.',   room:'Б-105' },
    { id:'l9', day:3, start:'14:00', end:'15:30', subject:'s3', teacher:'Сидоров С.С.', room:'В-207' },
    { id:'la', day:4, start:'09:00', end:'10:30', subject:'s6', teacher:'Козлова А.В.',  room:'Д-103' },
    { id:'lb', day:4, start:'11:00', end:'12:30', subject:'s5', teacher:'Смит Д.',        room:'Е-310' },
    { id:'lc', day:4, start:'14:00', end:'15:30', subject:'s4', teacher:'Новикова Л.П.', room:'А-115' },
    { id:'ld', day:5, start:'10:00', end:'11:30', subject:'s1', teacher:'Иванов И.И.',   room:'А-201' },
    { id:'le', day:5, start:'12:00', end:'13:30', subject:'s2', teacher:'Петров П.П.',   room:'Б-105' },
    { id:'lf', day:6, start:'10:00', end:'11:30', subject:'s6', teacher:'Козлова А.В.',  room:'Д-103' },
  ];

  // Grades
  const grades = [
    { id:'g1',  subject:'s1', value:5, type:'exam',    date:dStr(-30), note:'' },
    { id:'g2',  subject:'s2', value:4, type:'lab',     date:dStr(-25), note:'Алгоритм сортировки' },
    { id:'g3',  subject:'s3', value:4, type:'test',    date:dStr(-20), note:'' },
    { id:'g4',  subject:'s1', value:5, type:'seminar', date:dStr(-18), note:'' },
    { id:'g5',  subject:'s5', value:4, type:'hw',      date:dStr(-15), note:'' },
    { id:'g6',  subject:'s6', value:3, type:'test',    date:dStr(-12), note:'' },
    { id:'g7',  subject:'s2', value:5, type:'exam',    date:dStr(-10), note:'Отлично!' },
    { id:'g8',  subject:'s4', value:4, type:'hw',      date:dStr(-8),  note:'' },
    { id:'g9',  subject:'s3', value:5, type:'lab',     date:dStr(-5),  note:'' },
    { id:'g10', subject:'s1', value:4, type:'test',    date:dStr(-3),  note:'' },
    { id:'g11', subject:'s6', value:4, type:'seminar', date:dStr(-2),  note:'' },
    { id:'g12', subject:'s5', value:5, type:'exam',    date:dStr(-1),  note:'' },
    { id:'g13', subject:'s2', value:5, type:'lab',     date:dStr(-7),  note:'Неделю назад' },
    { id:'g14', subject:'s3', value:4, type:'test',    date:dStr(-7),  note:'' },
  ];

  // Tasks
  const tasks = [
    { id:'t1', title:'Лабораторная работа №4', subject:'s2', deadline:dStr(1),  priority:'high',   done:false, note:'Реализовать бинарное дерево' },
    { id:'t2', title:'Реферат по истории',     subject:'s4', deadline:dStr(3),  priority:'medium', done:false, note:'' },
    { id:'t3', title:'Задачи по физике',        subject:'s3', deadline:dStr(2),  priority:'high',   done:false, note:'Глава 7, задачи 1-15' },
    { id:'t4', title:'Словарь терминов',        subject:'s5', deadline:dStr(7),  priority:'low',    done:false, note:'' },
    { id:'t5', title:'SQL-запросы к БД',        subject:'s6', deadline:dStr(5),  priority:'medium', done:true,  note:'' },
    { id:'t6', title:'Контрольная по МА',       subject:'s1', deadline:dStr(10), priority:'high',   done:false, note:'Ряды Фурье' },
    { id:'t7', title:'Домашнее задание №8',     subject:'s1', deadline:dStr(-1), priority:'medium', done:true,  note:'' },
  ];

  // Attendance (per subject: [total, attended])
  const attendance = {
    s1:[28,26], s2:[30,29], s3:[24,20], s4:[20,18], s5:[22,22], s6:[26,23]
  };

  DB.set('schedule', schedule);
  DB.set('grades', grades);
  DB.set('tasks', tasks);
  DB.set('attendance', attendance);
  DB.set('seeded', true);
}

/* ── STATE ── */
const state = {
  screen: 'dashboard',
  scheduleDay: new Date().getDay() || 1, // default Mon if Sun
  gradeFilter: 'all',
  taskFilter: 'active',
};

/* ── HELPERS ── */
const subjectMap = Object.fromEntries(SUBJECTS.map(s => [s.id, s]));
const $ = id => document.getElementById(id);
const now = () => new Date();

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
}

function daysUntil(isoDate) {
  const diff = new Date(isoDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  return Math.round(diff / 86400000);
}

function deadlineClass(days) {
  if (days < 0) return 'deadline-urgent';
  if (days <= 2) return 'deadline-urgent';
  if (days <= 5) return 'deadline-soon';
  return 'deadline-ok';
}
function deadlineText(days) {
  if (days < 0)  return `${-days}д просрочено`;
  if (days === 0) return 'Сегодня!';
  if (days === 1) return 'Завтра';
  if (days <= 6) return `Через ${days}д`;
  return formatDate(new Date(Date.now() + days * 86400000).toISOString());
}

function calcGPA(grades) {
  if (!grades.length) return 0;
  return grades.reduce((s, g) => s + g.value, 0) / grades.length;
}

function subjectGPA(subjectId) {
  const grades = DB.get('grades').filter(g => g.subject === subjectId);
  return calcGPA(grades);
}

function getGreeting() {
  const h = now().getHours();
  if (h < 6)  return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 17) return 'Добрый день';
  return 'Добрый вечер';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ── ICONS SVG ── */
const Icons = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  schedule:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  grades:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  tasks:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  analytics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  profile:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  trend_up:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  trend_same: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>`,
};

/* ═══════════════ SCREENS ═══════════════ */

/* ── DASHBOARD ── */
function renderDashboard() {
  const grades   = DB.get('grades');
  const tasks    = DB.get('tasks');
  const schedule = DB.get('schedule');
  const attend   = DB.get('attendance');

  const gpa = calcGPA(grades);
  const todayDay = now().getDay();
  const todayLessons = schedule
    .filter(l => l.day === todayDay)
    .sort((a,b) => a.start.localeCompare(b.start));

  const activeTasks = tasks.filter(t => !t.done).sort((a,b) => new Date(a.deadline)-new Date(b.deadline));

  // "This day last week" grades — same calendar date 7 days ago
  const lastWeekDate = new Date(now());
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekStr = lastWeekDate.toISOString().split('T')[0];
  const lastWeekGrades = grades.filter(g => g.date === lastWeekStr);
  const lastWeekLabel  = `${lastWeekDate.getDate()} ${MONTHS_RU[lastWeekDate.getMonth()]}`;

  // Attendance avg
  const attended = Object.values(attend).reduce((s,[,a]) => s+a, 0);
  const total    = Object.values(attend).reduce((s,[t]) => s+t, 0);
  const attendPct = total ? Math.round(attended/total*100) : 0;

  const pendingDeadlines = activeTasks.filter(t => daysUntil(t.deadline) <= 7).length;

  const date = now();
  const dateStr = `${DAYS_RU[date.getDay()]}, ${date.getDate()} ${MONTHS_RU[date.getMonth()]}`;

  return `
  <div class="screen" id="screenDashboard">
    <!-- Stat grid -->
    <div class="stat-grid" style="margin-top:4px">
      <div class="glass card stat-card" style="grid-column:1/3">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="flex:1">
            <div class="stat-label">Средний балл</div>
            <div class="stat-value" style="background:linear-gradient(135deg,#a78bfa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${gpa.toFixed(2)}</div>
            <div class="stat-trend up">${Icons.trend_up} Семестровый GPA</div>
          </div>
          <canvas id="miniGpaChart" style="flex-shrink:0;opacity:.9"></canvas>
        </div>
      </div>

      <div class="glass card stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15)">📅</div>
        <div class="stat-value" style="font-size:26px;color:#34d399">${attendPct}%</div>
        <div class="stat-label">Посещаемость</div>
      </div>

      <div class="glass card stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.15)">⚡</div>
        <div class="stat-value" style="font-size:26px;color:#f87171">${pendingDeadlines}</div>
        <div class="stat-label">Дедлайны</div>
      </div>
    </div>

    <!-- Today's schedule -->
    <div class="glass card" style="margin-bottom:12px">
      <div class="card-header">
        <span class="card-title">Сегодня · ${dateStr}</span>
        <button class="card-action" onclick="navigate('schedule')">Всё</button>
      </div>
      ${todayLessons.length ? `
        <div class="schedule-list">
          ${todayLessons.map(l => lessonItem(l)).join('')}
        </div>
      ` : `
        <div class="empty-state" style="padding:20px 0">
          <div class="empty-icon">🎉</div>
          <div class="empty-title">Сегодня пар нет</div>
        </div>
      `}
    </div>

    <!-- Upcoming tasks -->
    <div class="glass card" style="margin-bottom:12px">
      <div class="card-header">
        <span class="card-title">Ближайшие задания</span>
        <button class="card-action" onclick="navigate('tasks')">Все</button>
      </div>
      ${activeTasks.slice(0,3).length ? `
        <div class="task-list">
          ${activeTasks.slice(0,3).map(t => taskItem(t, true)).join('')}
        </div>
      ` : `
        <div class="empty-state" style="padding:16px 0">
          <div class="empty-icon">✅</div>
          <div class="empty-title">Всё сдано!</div>
        </div>
      `}
    </div>

    <!-- This day last week -->
    <div class="glass card">
      <div class="card-header">
        <span class="card-title">Этот день неделю назад</span>
        <span style="font-size:12px;color:var(--t-muted);font-weight:600">${lastWeekLabel}</span>
      </div>
      ${lastWeekGrades.length ? `
        <div class="grade-list">
          ${lastWeekGrades.map(g => gradeItem(g)).join('')}
        </div>
      ` : `
        <div class="empty-state" style="padding:16px 0">
          <div class="empty-icon">📭</div>
          <div class="empty-title">Оценок не было</div>
          <div class="empty-sub">${lastWeekLabel} — свободный день</div>
        </div>
      `}
    </div>
  </div>`;
}

function initDashboard() {
  // defer canvas — не блокирует отрисовку первого кадра
  requestAnimationFrame(() => drawMiniChart());
}

/* ── SCHEDULE ── */
function renderSchedule() {
  const schedule = DB.get('schedule');
  const today    = new Date();
  const weekDays = [1,2,3,4,5,6];

  const days = weekDays.map(d => {
    const dt = new Date(today);
    const diff = d - today.getDay();
    dt.setDate(today.getDate() + diff);
    return { day: d, date: dt.getDate(), name: DAYS_RU[d], isToday: d === today.getDay() };
  });

  const lessons = schedule
    .filter(l => l.day === state.scheduleDay)
    .sort((a,b) => a.start.localeCompare(b.start));

  return `
  <div class="screen" id="screenSchedule">
    <div class="section-title">Расписание</div>

    <div class="day-picker">
      ${days.map(d => `
        <button class="day-btn${d.day === state.scheduleDay ? ' active' : ''}${d.isToday ? ' today' : ''}"
          onclick="setDay(${d.day})">
          <span class="day-name">${d.name}</span>
          <span class="day-num">${d.date}</span>
        </button>
      `).join('')}
    </div>

    <div class="glass card">
      ${lessons.length ? `
        <div class="schedule-list">
          ${lessons.map(l => lessonItem(l, true)).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-icon">😌</div>
          <div class="empty-title">Пар нет</div>
          <div class="empty-sub">Отдыхай, заслужил!</div>
        </div>
      `}
    </div>

    <div class="glass card" style="margin-top:12px">
      <div class="card-title" style="margin-bottom:14px">Все предметы</div>
      ${SUBJECTS.map(s => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer"
             onclick="navigate('grades')">
          <div style="width:8px;height:8px;border-radius:50%;background:${s.color};box-shadow:0 0 8px ${s.color}"></div>
          <span style="font-size:14px;font-weight:600;color:var(--t-primary);flex:1">${s.name}</span>
          <span style="font-size:12px;color:var(--t-secondary)">${schedule.filter(l=>l.subject===s.id).length} пар/нед</span>
        </div>
      `).join('')}
    </div>
  </div>`;
}

/* ── GRADES ── */
function renderGrades() {
  const grades = DB.get('grades');
  let filtered = [...grades].sort((a,b) => new Date(b.date)-new Date(a.date));
  if (state.gradeFilter !== 'all') {
    filtered = filtered.filter(g => g.subject === state.gradeFilter);
  }

  return `
  <div class="screen" id="screenGrades">
    <div class="card-header" style="margin-bottom:14px">
      <div class="section-title" style="margin-bottom:0">Оценки</div>
      <div style="font-size:14px;font-weight:700;color:#a78bfa" class="neon-purple">
        ${calcGPA(filtered).toFixed(2)} GPA
      </div>
    </div>

    <div class="tab-row">
      <button class="tab-pill${state.gradeFilter==='all'?' active':''}" onclick="filterGrades('all')">Все</button>
      ${SUBJECTS.map(s => `
        <button class="tab-pill${state.gradeFilter===s.id?' active':''}" onclick="filterGrades('${s.id}')">${s.short}</button>
      `).join('')}
    </div>

    ${filtered.length ? `
      <div class="grade-list">
        ${filtered.map(g => gradeItem(g)).join('')}
      </div>
    ` : `
      <div class="glass card">
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">Оценок нет</div>
          <div class="empty-sub">Нажми + чтобы добавить</div>
        </div>
      </div>
    `}
  </div>

  <button class="fab glass" onclick="openAddGrade()" title="Добавить оценку">
    <span style="font-size:24px;line-height:1">+</span>
  </button>`;
}

/* ── TASKS ── */
function renderTasks() {
  const tasks = DB.get('tasks');
  const filtered = tasks
    .filter(t => state.taskFilter === 'done' ? t.done : !t.done)
    .sort((a,b) => new Date(a.deadline) - new Date(b.deadline));

  const doneCount   = tasks.filter(t => t.done).length;
  const activeCount = tasks.filter(t => !t.done).length;

  return `
  <div class="screen" id="screenTasks">
    <div class="card-header" style="margin-bottom:14px">
      <div class="section-title" style="margin-bottom:0">Задания</div>
      <div style="font-size:13px;color:var(--t-secondary);font-weight:600">${doneCount}/${tasks.length} сдано</div>
    </div>

    <div class="tab-row" style="margin-bottom:14px">
      <button class="tab-pill${state.taskFilter==='active'?' active':''}" onclick="filterTasks('active')">
        Активные · ${activeCount}
      </button>
      <button class="tab-pill${state.taskFilter==='done'?' active':''}" onclick="filterTasks('done')">
        Сданные · ${doneCount}
      </button>
    </div>

    ${filtered.length ? `
      <div class="task-list">
        ${filtered.map(t => taskItem(t)).join('')}
      </div>
    ` : `
      <div class="glass card">
        <div class="empty-state">
          <div class="empty-icon">${state.taskFilter==='done' ? '🗃️' : '🥳'}</div>
          <div class="empty-title">${state.taskFilter==='done' ? 'Ещё ничего не сдано' : 'Всё выполнено!'}</div>
        </div>
      </div>
    `}
  </div>

  <button class="fab glass" onclick="openAddTask()" title="Добавить задание">
    <span style="font-size:24px;line-height:1">+</span>
  </button>`;
}

/* ── ANALYTICS ── */
function renderAnalytics() {
  const grades  = DB.get('grades');
  const attend  = DB.get('attendance');
  const attended = Object.values(attend).reduce((s,[,a]) => s+a, 0);
  const total    = Object.values(attend).reduce((s,[t]) => s+t, 0);
  const pct = total ? Math.round(attended/total*100) : 0;

  const gpa = calcGPA(grades);

  const subjectStats = SUBJECTS.map(s => ({
    ...s,
    gpa: subjectGPA(s.id),
    grades: grades.filter(g => g.subject === s.id)
  }));

  return `
  <div class="screen" id="screenAnalytics">
    <div class="section-title">Аналитика</div>

    <!-- GPA Summary -->
    <div class="glass chart-card" style="margin-bottom:12px">
      <div class="chart-title">Средний балл</div>
      <div class="chart-subtitle">Текущий семестр</div>
      <div class="gpa-ring-wrap">
        <div style="flex-shrink:0;width:110px;height:110px">
          <canvas id="donutChart" width="110" height="110" style="width:110px;height:110px"></canvas>
        </div>
        <div class="gpa-ring-label">
          <div class="gpa-big">${gpa.toFixed(1)}</div>
          <div class="gpa-sublabel">из 5.0 возможных</div>
          <div class="gpa-change">📈 Посещаемость ${pct}%</div>
        </div>
      </div>
    </div>

    <!-- GPA Trend Line Chart -->
    <div class="glass chart-card" style="margin-bottom:12px">
      <div class="chart-title">Динамика успеваемости</div>
      <div class="chart-subtitle">Последние оценки по дате</div>
      <div class="chart-canvas-wrap">
        <canvas id="lineChart" height="120"></canvas>
      </div>
    </div>

    <!-- Subject bars -->
    <div class="glass chart-card" style="margin-bottom:12px">
      <div class="chart-title">По предметам</div>
      <div class="chart-subtitle">Средний балл</div>
      <div class="subject-bars" id="subjectBars">
        ${subjectStats.map(s => `
          <div class="subject-row">
            <div class="subject-row-header">
              <span class="subject-name-bar">${s.name}</span>
              <span class="subject-gpa-val" style="color:${s.color}">${s.grades.length ? s.gpa.toFixed(1) : '—'}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" id="bar-${s.id}"
                style="background:linear-gradient(90deg,${s.color}99,${s.color});box-shadow:0 0 8px ${s.color}60"
                data-target="${s.grades.length ? (s.gpa/5*100).toFixed(1) : 0}">
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Attendance per subject -->
    <div class="glass chart-card">
      <div class="chart-title">Посещаемость по предметам</div>
      <div class="chart-subtitle">Пройдено / Всего пар</div>
      <div class="subject-bars">
        ${SUBJECTS.map(s => {
          const [tot, att] = attend[s.id] || [0,0];
          const p = tot ? Math.round(att/tot*100) : 0;
          const cls = p >= 90 ? '#10b981' : p >= 75 ? '#f59e0b' : '#ef4444';
          return `
          <div class="subject-row">
            <div class="subject-row-header">
              <span class="subject-name-bar">${s.short} · ${s.name.split(' ')[0]}</span>
              <span class="subject-gpa-val" style="color:${cls}">${p}%</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill"
                style="background:linear-gradient(90deg,${cls}80,${cls})"
                data-target-pct="${p}">
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}

function initAnalytics() {
  // Кадр 1: анимируем бары (лёгкая операция)
  requestAnimationFrame(() => {
    document.querySelectorAll('.bar-fill[data-target]').forEach(bar => {
      bar.style.transition = 'transform 1s cubic-bezier(.22,1,.36,1)';
      bar.style.transform = 'scaleX(' + (parseFloat(bar.dataset.target) / 100) + ')';
    });
    document.querySelectorAll('.bar-fill[data-target-pct]').forEach(bar => {
      bar.style.transition = 'transform 1.2s cubic-bezier(.22,1,.36,1)';
      bar.style.transform = 'scaleX(' + (parseFloat(bar.dataset.targetPct) / 100) + ')';
    });
    // Кадр 2: donut после того как бары запущены
    requestAnimationFrame(() => {
      drawDonut();
      // Кадр 3: line chart — самый тяжёлый, последним
      requestAnimationFrame(() => { drawLineChart(); });
    });
  });
}

/* ═══════════════ COMPONENTS ═══════════════ */

function lessonItem(l, detailed = false) {
  const s = subjectMap[l.subject];
  return `
  <div class="lesson-item">
    <span class="lesson-time">${l.start}</span>
    <div class="lesson-color" style="background:${s?.color || '#888'}"></div>
    <div class="lesson-info">
      <div class="lesson-name">${s?.name || l.subject}</div>
      <div class="lesson-meta">${l.teacher}</div>
    </div>
    <span class="lesson-room">${l.room}</span>
  </div>`;
}

function gradeItem(g) {
  const s = subjectMap[g.subject];
  return `
  <div class="grade-item" onclick="openGradeDetail('${g.id}')">
    <div class="grade-badge grade-${g.value}">${g.value}</div>
    <div class="grade-info">
      <div class="grade-subject">${s?.name || g.subject}</div>
      <div class="grade-type">${GRADE_LABELS[g.type] || g.type}</div>
    </div>
    <span class="grade-date">${formatDate(g.date)}</span>
  </div>`;
}

function taskItem(t, compact = false) {
  const s = subjectMap[t.subject];
  const days = daysUntil(t.deadline);
  return `
  <div class="task-item${t.done ? ' done' : ''}" data-id="${t.id}"
       onclick="toggleTask('${t.id}',event)">
    <div class="task-check" onclick="toggleTask('${t.id}',event)">
      ${Icons.check}
    </div>
    <div class="task-info">
      <div class="task-title">${t.title}</div>
      <div class="task-sub">${s?.name || ''}</div>
    </div>
    <span class="task-deadline ${deadlineClass(days)}" onclick="openEditTask('${t.id}',event)">${deadlineText(days)}</span>
    <div class="priority-dot priority-${t.priority}" style="margin-left:4px"></div>
  </div>`;
}

/* ═══════════════ CANVAS CHARTS ═══════════════ */

function drawMiniChart() {
  const canvas = $('miniGpaChart');
  if (!canvas) return;
  const grades = DB.get('grades');
  if (grades.length < 2) return;

  // DPR scaling — fixes pixelation on retina/iPhone screens
  const DPR  = window.devicePixelRatio || 1;
  const cssW = 80, cssH = 56;
  canvas.width  = cssW * DPR;
  canvas.height = cssH * DPR;
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);

  const sorted = [...grades].sort((a,b) => new Date(a.date)-new Date(b.date)).slice(-8);
  const vals = sorted.map(g => g.value);
  const W = cssW, H = cssH;
  const pad = 4;
  const minV = 1, maxV = 5;

  ctx.clearRect(0,0,W,H);

  const pts = vals.map((v,i) => ({
    x: pad + (i/(vals.length-1)) * (W-pad*2),
    y: H - pad - (v-minV)/(maxV-minV) * (H-pad*2)
  }));

  // Gradient fill
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, 'rgba(167,139,250,0.35)');
  grad.addColorStop(1, 'rgba(167,139,250,0.0)');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i=1;i<pts.length;i++) {
    const cx = (pts[i-1].x + pts[i].x)/2;
    ctx.bezierCurveTo(cx, pts[i-1].y, cx, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.lineTo(pts[pts.length-1].x, H);
  ctx.lineTo(pts[0].x, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i=1;i<pts.length;i++) {
    const cx = (pts[i-1].x + pts[i].x)/2;
    ctx.bezierCurveTo(cx, pts[i-1].y, cx, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#a78bfa';
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Last dot
  const last = pts[pts.length-1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 3, 0, Math.PI*2);
  ctx.fillStyle = '#a78bfa';
  ctx.shadowColor = '#a78bfa';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawDonut() {
  const canvas = $('donutChart');
  if (!canvas) return;

  // DPR scaling + no shadowBlur (avoids square-clip artifact from overflow:hidden)
  const DPR     = window.devicePixelRatio || 1;
  const cssSize = 110;
  canvas.width  = cssSize * DPR;
  canvas.height = cssSize * DPR;
  canvas.style.width  = cssSize + 'px';
  canvas.style.height = cssSize + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);

  const grades = DB.get('grades');
  const gpa = calcGPA(grades);
  const pct = gpa / 5;

  const cx = cssSize / 2, cy = cssSize / 2;
  // Keep radius well inside canvas so rounded lineCap doesn't clip
  const r = cssSize / 2 - 14;
  const start = -Math.PI / 2;
  const end   = start + pct * Math.PI * 2;

  ctx.clearRect(0, 0, cssSize, cssSize);

  // Track ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Gradient arc — no shadowBlur to prevent square clip
  const grad = ctx.createLinearGradient(0, 0, cssSize, cssSize);
  grad.addColorStop(0, '#7c3aed');
  grad.addColorStop(0.5, '#2563eb');
  grad.addColorStop(1, '#06b6d4');

  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Center text
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `bold ${Math.round(cssSize * 0.2)}px -apple-system,sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(gpa.toFixed(1), cx, cy);
}

function drawLineChart() {
  const canvas = $('lineChart');
  if (!canvas) return;

  const DPR = window.devicePixelRatio || 1;
  const cssW = canvas.parentElement.offsetWidth;
  const cssH = 120;
  canvas.width  = cssW * DPR;
  canvas.height = cssH * DPR;
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);

  const grades = DB.get('grades');
  const sorted = [...grades].sort((a,b) => new Date(a.date)-new Date(b.date));

  if (sorted.length < 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '14px -apple-system,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Добавьте оценки для графика', cssW/2, cssH/2);
    return;
  }

  const W = cssW, H = cssH;
  const padX = 12, padY = 14;
  const vals = sorted.map(g => g.value);
  const minV = Math.min(...vals) - 0.3;
  const maxV = 5.1;

  const pts = vals.map((v, i) => ({
    x: padX + (i / (vals.length-1)) * (W - padX*2),
    y: padY + (1 - (v-minV)/(maxV-minV)) * (H - padY*2)
  }));

  ctx.clearRect(0,0,W,H);

  // Horizontal grid lines
  [2,3,4,5].forEach(v => {
    const y = padY + (1 - (v-minV)/(maxV-minV)) * (H-padY*2);
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(W-padX, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = `10px -apple-system,sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(v, 0, y+3);
  });

  // Gradient fill
  const areaGrad = ctx.createLinearGradient(0, padY, 0, H);
  areaGrad.addColorStop(0, 'rgba(124,58,237,0.28)');
  areaGrad.addColorStop(1, 'rgba(6,182,212,0.0)');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i=1;i<pts.length;i++) {
    const cx = (pts[i-1].x + pts[i].x)/2;
    ctx.bezierCurveTo(cx, pts[i-1].y, cx, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.lineTo(pts[pts.length-1].x, H - padY);
  ctx.lineTo(pts[0].x, H - padY);
  ctx.closePath();
  ctx.fillStyle = areaGrad;
  ctx.fill();

  // Line stroke
  const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
  lineGrad.addColorStop(0, '#7c3aed');
  lineGrad.addColorStop(0.5, '#2563eb');
  lineGrad.addColorStop(1, '#06b6d4');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i=1;i<pts.length;i++) {
    const cx = (pts[i-1].x + pts[i].x)/2;
    ctx.bezierCurveTo(cx, pts[i-1].y, cx, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#7c3aed';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Dots
  pts.forEach((p, i) => {
    const v = vals[i];
    const col = v >= 4.5 ? '#10b981' : v >= 3.5 ? '#60a5fa' : v >= 2.5 ? '#fbbf24' : '#f87171';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI*2);
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

/* ═══════════════ MODAL SHEETS ═══════════════ */

function openSheet(html) {
  closeSheet();
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'sheetOverlay';
  overlay.innerHTML = `<div class="sheet">${html}</div>`;

  // Закрытие по тапу на оверлей — touchstart без задержки
  overlay.addEventListener('touchstart', e => {
    if (e.target === overlay) { e.preventDefault(); closeSheet(); }
  }, { passive: false });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeSheet(); });


  document.body.appendChild(overlay);
}

function closeSheet() {
  const o = $('sheetOverlay');
  if (o) o.remove();
}

let _wSubject, _wGrade, _wType;

function openAddGrade() {
  if (document.getElementById('cpopupEl')) return;
  const fab     = document.querySelector('.fab');
  const fabRect = fab ? fab.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2, width:0, height:0 };

  const subItems  = SUBJECTS.map(s => ({ label: s.name, value: s.id }));
  const gradeItems = [5,4,3,2].map(v => ({ label: String(v), value: v }));
  const typeItems  = Object.entries(GRADE_LABELS).map(([k,v]) => ({ label: v, value: k }));

  const el = document.createElement('div');
  el.id = 'cpopupEl'; el.className = 'cpopup-overlay';
  el.innerHTML = `
    <div class="cpopup-card grade-popup-card" onclick="event.stopPropagation()" style="opacity:0">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div class="sheet-title" style="margin-bottom:0;flex:1;text-align:center">Новая оценка</div>
        <button class="btn-primary" onclick="saveGrade()" style="padding:8px 0;font-size:18px;font-weight:700;margin:0;width:44%;flex-shrink:0">Добавить</button>
      </div>
      <div class="form-group form-date-wrap">
        <span class="form-date-hint" id="fDateHint">Дата</span>
        <input class="form-input" type="date" id="fDate" onchange="updateDateHint('fDateHint',this.value)">
      </div>
      <div class="grade-wheels">
        <div class="grade-wheel-col" style="flex:3"><div id="wpSubject"></div></div>
        <div class="grade-wheel-col" style="flex:1"><div id="wpGrade"></div></div>
        <div class="grade-wheel-col" style="flex:3"><div id="wpType"></div></div>
      </div>
      <div class="form-group">
        <input class="form-input" type="text" id="fNote" placeholder="Заметка">
      </div>
    </div>`;
  el.addEventListener('click', e => { if (e.target === el) closePopup(); });
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    const card = el.querySelector('.cpopup-card');
    genieOpen(card, fabRect);
    _wSubject = new WheelPicker(document.getElementById('wpSubject'), subItems,  0);
    _wGrade   = new WheelPicker(document.getElementById('wpGrade'),   gradeItems, 0);
    _wType    = new WheelPicker(document.getElementById('wpType'),    typeItems,  0);
  });
}

function saveGrade() {
  const grades = DB.get('grades');
  grades.unshift({
    id: uid(),
    subject: _wSubject ? _wSubject.getValue().value : (SUBJECTS[0]?.id ?? ''),
    value:   _wGrade   ? _wGrade.getValue().value   : 5,
    type:    _wType    ? _wType.getValue().value     : Object.keys(GRADE_LABELS)[0],
    date:    $('fDate')?.value || new Date().toISOString().split('T')[0],
    note:    $('fNote')?.value || ''
  });
  DB.set('grades', grades);
  closePopup();
  rerender();
  showToast('Оценка добавлена ✓');
}

function openGradeDetail(id) {
  const grades = DB.get('grades');
  const g = grades.find(x => x.id === id);
  if (!g) return;
  const s = subjectMap[g.subject];
  openSheet(`

    <div class="sheet-title">Оценка — ${s?.name}</div>
    <div style="display:flex;align-items:center;gap:16px;padding:12px 0 20px">
      <div class="grade-badge grade-${g.value}" style="width:60px;height:60px;font-size:28px;border-radius:18px">${g.value}</div>
      <div>
        <div style="font-size:16px;font-weight:700;color:var(--t-primary)">${GRADE_LABELS[g.type] || g.type}</div>
        <div style="font-size:13px;color:var(--t-secondary);margin-top:4px">${formatDate(g.date)}</div>
        ${g.note ? `<div style="font-size:13px;color:var(--t-secondary);margin-top:4px;font-style:italic">"${g.note}"</div>` : ''}
      </div>
    </div>
    <button class="btn-danger" onclick="deleteGrade('${id}')">Удалить оценку</button>
  `);
}

function deleteGrade(id) {
  let grades = DB.get('grades');
  grades = grades.filter(g => g.id !== id);
  DB.set('grades', grades);
  closeSheet();
  rerender();
  showToast('Оценка удалена');
}

function openAddTask() {
  if (document.getElementById('cpopupEl')) return;
  const fab     = document.querySelector('.fab');
  const fabRect = fab ? fab.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2, width:0, height:0 };

  const el = document.createElement('div');
  el.id = 'cpopupEl'; el.className = 'cpopup-overlay';
  el.innerHTML = `
    <div class="cpopup-card" onclick="event.stopPropagation()" style="opacity:0">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div class="sheet-title" style="margin-bottom:0;flex:1;text-align:center">Новое задание</div>
        <button class="btn-primary" onclick="saveTask()" style="padding:8px 0;font-size:18px;font-weight:700;margin:0;width:44%;flex-shrink:0">Добавить</button>
      </div>
      <div class="form-group">
        <input class="form-input" type="text" id="fTaskTitle" placeholder="Что нужно сделать?">
      </div>
      <div class="form-group">
        <select class="form-select" id="fTaskSubject">
          <option value="" disabled selected>Предмет</option>
          ${SUBJECTS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group form-date-wrap">
        <span class="form-date-hint" id="fTaskDeadlineHint">Дата</span>
        <input class="form-input" type="date" id="fTaskDeadline" onchange="updateDateHint('fTaskDeadlineHint',this.value)">
      </div>
      <div class="form-group">
        <select class="form-select" id="fTaskPriority">
          <option value="" disabled selected>Приоритет</option>
          <option value="high">🔴 Высокий</option>
          <option value="medium">🟡 Средний</option>
          <option value="low">🟢 Низкий</option>
        </select>
      </div>
      <div class="form-group">
        <input class="form-input" type="text" id="fTaskNote" placeholder="Заметки">
      </div>
    </div>`;
  el.addEventListener('click', e => { if (e.target === el) closePopup(); });
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    const card = el.querySelector('.cpopup-card');
    genieOpen(card, fabRect);
  });
}

function saveTask() {
  const title = $('fTaskTitle')?.value?.trim();
  if (!title) { showToast('Введи название'); return; }
  const tasks = DB.get('tasks');
  tasks.unshift({
    id: uid(),
    title,
    subject: $('fTaskSubject').value || (SUBJECTS[0]?.id ?? ''),
    deadline: $('fTaskDeadline').value,
    priority: $('fTaskPriority').value || 'medium',
    note: $('fTaskNote').value,
    done: false
  });
  DB.set('tasks', tasks);
  closePopup();
  rerender();
  showToast('Задание добавлено ✓');
}

function openEditTask(id, event) {
  event?.stopPropagation();
  const tasks = DB.get('tasks');
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  const esc = s => (s || '').replace(/"/g, '&quot;');
  openSheet(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <div class="sheet-title" style="margin-bottom:0;flex:1;min-width:0">Редактировать</div>
      <button class="btn-primary" onclick="saveEditTask('${id}')" style="padding:8px 0;font-size:18px;margin:0;width:50%;flex-shrink:0">Сохранить</button>
    </div>
    <div class="form-group">
      <input class="form-input" type="text" id="fTaskTitle" value="${esc(t.title)}" placeholder="Что нужно сделать?">
    </div>
    <div class="form-group">
      <select class="form-select" id="fTaskSubject">
        <option value="" disabled${!t.subject?' selected':''}>Предмет</option>
        ${SUBJECTS.map(s => `<option value="${s.id}"${s.id===t.subject?' selected':''}>${s.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group form-date-wrap">
      <span class="form-date-hint">Дата</span>
      <input class="form-input" type="date" id="fTaskDeadline" value="${t.deadline}">
    </div>
    <div class="form-group">
      <select class="form-select" id="fTaskPriority">
        <option value="" disabled${!t.priority?' selected':''}>Приоритет</option>
        <option value="high"${t.priority==='high'?' selected':''}>🔴 Высокий</option>
        <option value="medium"${t.priority==='medium'?' selected':''}>🟡 Средний</option>
        <option value="low"${t.priority==='low'?' selected':''}>🟢 Низкий</option>
      </select>
    </div>
    <div class="form-group">
      <input class="form-input" type="text" id="fTaskNote" value="${esc(t.note)}" placeholder="Заметки">
    </div>
    <button class="btn-danger" onclick="deleteTask('${id}')">Удалить задание</button>
  `);
}

function saveEditTask(id) {
  const title = $('fTaskTitle')?.value?.trim();
  if (!title) { showToast('Введи название'); return; }
  const tasks = DB.get('tasks');
  const idx = tasks.findIndex(x => x.id === id);
  if (idx === -1) return;
  tasks[idx] = { ...tasks[idx], title,
    subject:  $('fTaskSubject').value  || (SUBJECTS[0]?.id ?? ''),
    deadline: $('fTaskDeadline').value,
    priority: $('fTaskPriority').value || 'medium',
    note:     $('fTaskNote').value.trim() };
  DB.set('tasks', tasks);
  closeSheet();
  rerender();
  showToast('Задание обновлено ✓');
}

function deleteTask(id) {
  DB.set('tasks', DB.get('tasks').filter(t => t.id !== id));
  closeSheet();
  rerender();
  showToast('Задание удалено');
}

function toggleTask(id, event) {
  if (event) event.stopPropagation();
  const tasks = DB.get('tasks');
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  DB.set('tasks', tasks);

  // Animate in-place without full rerender
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) {
    el.classList.toggle('done', t.done);
    const check = el.querySelector('.task-check');
    check.style.background   = t.done ? 'var(--c-green)' : '';
    check.style.borderColor  = t.done ? 'var(--c-green)' : '';
    const checkSvg = check.querySelector('svg');
    if (checkSvg) checkSvg.style.opacity = t.done ? '1' : '0';
    const title = el.querySelector('.task-title');
    if (title) {
      title.style.textDecoration = t.done ? 'line-through' : '';
      title.style.color = t.done ? 'var(--t-muted)' : '';
    }
  }
  showToast(t.done ? 'Сдано ✓' : 'Возобновлено');
}

/* ═══════════════ 3D WHEEL PICKER ═══════════════ */
class WheelPicker {
  constructor(container, items, initial = 0) {
    this.items = items;
    this.idx = Math.max(0, Math.min(initial, items.length - 1));
    this.el = container;
    this._delta = 0;
    this._raf = null;
    this.onChange = null;
    this._build();
    this._listen();
    this._draw();
  }
  _build() {
    this.el.classList.add('wp');
    this.el.innerHTML = `<div class="wp-inner"><div class="wp-drum">${
      this.items.map((x,i) => `<div class="wp-item" data-i="${i}">${typeof x==='object'?x.label:x}</div>`).join('')
    }</div><div class="wp-fade-top"></div><div class="wp-fade-bot"></div><div class="wp-sel"></div></div>`;
    this._drum = this.el.querySelector('.wp-drum');
    this._els  = [...this._drum.querySelectorAll('.wp-item')];
  }
  _draw() {
    const n = this.items.length, DEG = 34, R = 79;
    this._els.forEach((el, i) => {
      let p = i - this.idx - this._delta;
      p = ((p + n * 1000 + n / 2) % n) - n / 2;
      if (Math.abs(p) > 2.8) { el.style.visibility = 'hidden'; return; }
      el.style.visibility = '';

      const rad = p * DEG * Math.PI / 180;
      const y   = Math.sin(rad) * R;
      const z   = (Math.cos(rad) - 1) * R;
      const rot = -p * DEG;

      const op     = Math.max(0, Math.cos(rad));
      const inZone = Math.max(0, Math.min(1, 1 - Math.abs(y) / 55));
      const alpha  = (0.45 + inZone * 0.55) * op;
      const scale  = (1.0 + inZone * 0.28).toFixed(3);

      el.style.transform  = `translateY(${y.toFixed(1)}px) translateZ(${z.toFixed(1)}px) rotateX(${rot.toFixed(1)}deg) scale(${scale})`;
      el.style.opacity    = alpha.toFixed(3);
      el.style.fontSize   = '14px';
      el.style.fontWeight = inZone > 0.5 ? '600' : '400';
    });
  }
  _listen() {
    let y0, startDelta, lastY, lastT, vel;
    const onS = y => {
      this._stop();
      y0 = lastY = y; startDelta = this._delta; lastT = Date.now(); vel = 0;
    };
    const onM = y => {
      const dt = Math.max(1, Date.now() - lastT);
      vel = (lastY - y) / dt; lastY = y; lastT = Date.now();
      this._delta = startDelta + (y0 - y) / 44; this._draw();
    };
    const onE = () => {
      if (Math.abs(vel) > 0.08) {
        this._inertia(vel);
      } else {
        const n = this.items.length;
        const target = (((Math.round(this.idx + this._delta)) % n) + n) % n;
        this._springTo(target);
      }
    };
    this.el.addEventListener('touchstart', e => onS(e.touches[0].clientY), { passive: true });
    this.el.addEventListener('touchmove', e => { e.stopPropagation(); onM(e.touches[0].clientY); }, { passive: true });
    this.el.addEventListener('touchend', onE, { passive: true });
    let md = false;
    this.el.addEventListener('mousedown', e => { onS(e.clientY); md = true; e.preventDefault(); });
    window.addEventListener('mousemove', e => { if (md) onM(e.clientY); });
    window.addEventListener('mouseup', () => { if (md) { md = false; onE(); } });
  }
  _inertia(vel) {
    this._stop();
    const n = this.items.length;
    // Roulette-style: slow initial friction, exponential decay
    let v = vel / 44;          // px/ms → items/ms
    const DECAY = 0.9965;      // velocity multiplier per ms (slower = longer spin)
    let prev = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt  = Math.min(now - prev, 32);
      prev = now;
      this._delta += v * dt;
      v *= Math.pow(DECAY, dt);
      this._draw();
      if (Math.abs(v) < 0.001) {
        // Normalize accumulated delta into idx to prevent reverse-spring artifact
        const excess = Math.trunc(this._delta);
        this.idx = ((this.idx + excess) % n + n) % n;
        this._delta -= excess;
        const target = (((Math.round(this.idx + this._delta)) % n) + n) % n;
        this._springTo(target);
        return;
      }
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }
  _springTo(target) {
    this._stop();
    const n = this.items.length;
    target = ((target % n) + n) % n;
    // Shortest path to target
    let endDelta = target - this.idx;
    if (endDelta > n / 2)  endDelta -= n;
    if (endDelta < -n / 2) endDelta += n;
    const s0 = this._delta, t0 = Date.now(), dur = 380;
    const tick = () => {
      const t = Math.min(1, (Date.now() - t0) / dur);
      // Spring with slight overshoot — revolver click feel
      const e = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2 + 0.04 * Math.sin(t * Math.PI * 2.5) * (1 - t);
      this._delta = s0 + (endDelta - s0) * e; this._draw();
      if (t < 1) { this._raf = requestAnimationFrame(tick); }
      else { this.idx = target; this._delta = 0; this._draw(); if (this.onChange) this.onChange(this.items[this.idx], this.idx); }
    };
    this._raf = requestAnimationFrame(tick);
  }
  _stop() { if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; } }
  getValue()  { return this.items[this.idx]; }
  getIndex()  { return this.idx; }
  setIndex(i, anim = false) {
    const n = this.items.length; i = ((i % n) + n) % n;
    if (anim) this._springTo(i); else { this.idx = i; this._delta = 0; this._draw(); }
  }
}

/* ═══════════════ POPUP UTILITIES ═══════════════ */

function spawnWaveRings() {}

function spawnEmojiReaction(emoji, sourceEl) {
  const count = 22;
  const rect = sourceEl ? sourceEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const ox = rect.left + rect.width / 2;
  const oy = rect.top + rect.height / 2;
  const W = window.innerWidth;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'emoji-burst-particle';
    el.textContent = emoji;

    // Drift left/right spread across screen width; rise to near top
    const dx   = (Math.random() - 0.5) * W * 0.9;
    const rise = oy * 0.85 + Math.random() * oy * 0.12; // float almost to top
    const r0   = ((Math.random() - 0.5) * 20).toFixed(1);
    const r1   = ((Math.random() - 0.5) * 30).toFixed(1);
    const dur  = (1200 + Math.random() * 600).toFixed(0);
    const delay = (i * 28 + Math.random() * 20).toFixed(0); // stagger like Telegram stream
    const size = 20 + Math.random() * 18;

    el.style.cssText = `left:${ox}px;top:${oy}px;font-size:${size}px;--dx:${dx.toFixed(1)}px;--rise:${rise.toFixed(1)}px;--r0:${r0}deg;--r1:${r1}deg;--dur:${dur}ms;--delay:${delay}ms;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), +dur + +delay + 50);
  }
}
window.spawnEmojiReaction = spawnEmojiReaction;

/* ── Genie Effect: Slicing technique (macOS-style) ── */

const _G_N    = 30;    // horizontal slice count
const _G_STAG = 0.55;  // stagger factor: leading rows finish this fraction earlier

function _genieSlicePoly(txPct, t, closing, bottomFirst) {
  // txPct: target X in % relative to element width (where animation converges)
  // t: 0→1 animation progress
  // closing: true = collapse to point; false = expand from point
  // bottomFirst: true = bottom rows lead; false = top rows lead
  const et = closing ? t * t : 1 - (1 - t) * (1 - t);
  const L = [], R = [];
  for (let i = 0; i <= _G_N; i++) {
    const y   = (i / _G_N * 100).toFixed(2);
    const lag = bottomFirst ? i / _G_N : 1 - i / _G_N;
    const rowP = closing
      ? Math.min(1, et * (1 + lag * _G_STAG))
      : Math.max(0, 1 - et * (1 + lag * _G_STAG));
    L.push(`${(rowP * txPct).toFixed(2)}% ${y}%`);
    R.push(`${(100 - rowP * (100 - txPct)).toFixed(2)}% ${y}%`);
  }
  return `polygon(${[...L, ...[...R].reverse()].join(',')})`;
}

function genieOpen(card, fabRect) {
  if (!card) return;
  const cR  = card.getBoundingClientRect();
  const txP = Math.max(2, Math.min(98, (fabRect.left + fabRect.width / 2 - cR.left) / cR.width * 100));
  const dur = 460;
  const t0  = performance.now();
  card.style.willChange = 'clip-path, opacity';
  (function step(ts) {
    const t = Math.min(1, (ts - t0) / dur);
    card.style.clipPath = _genieSlicePoly(txP, t, false, true);
    card.style.opacity  = Math.min(1, t / 0.18).toFixed(3);
    if (t < 1) requestAnimationFrame(step);
    else { card.style.clipPath = ''; card.style.opacity = '1'; card.style.willChange = ''; }
  })(t0);
}

function genieClose(card, fabRect, onDone) {
  if (!card) { onDone?.(); return; }
  const cR  = card.getBoundingClientRect();
  const txP = Math.max(2, Math.min(98, (fabRect.left + fabRect.width / 2 - cR.left) / cR.width * 100));
  const dur = 360;
  const t0  = performance.now();
  card.style.willChange = 'clip-path, opacity';
  (function step(ts) {
    const t = Math.min(1, (ts - t0) / dur);
    card.style.clipPath = _genieSlicePoly(txP, t, true, true);
    card.style.opacity  = t < 0.65 ? '1' : (1 - (t - 0.65) / 0.35).toFixed(3);
    if (t < 1) requestAnimationFrame(step);
    else { card.style.clipPath = ''; card.style.opacity = ''; card.style.willChange = ''; onDone?.(); }
  })(t0);
}

/* ── Genie for full-width top sheet (profile) ── */

function genieOpenSheet(sheet, avRect) {
  if (!sheet) return;
  const txP = Math.max(2, Math.min(98, (avRect.left + avRect.width / 2) / window.innerWidth * 100));
  const dur = 480;
  const t0  = performance.now();
  sheet.style.willChange = 'clip-path, opacity';
  (function step(ts) {
    const t = Math.min(1, (ts - t0) / dur);
    sheet.style.clipPath = _genieSlicePoly(txP, t, false, false);
    sheet.style.opacity  = Math.min(1, t / 0.20).toFixed(3);
    if (t < 1) requestAnimationFrame(step);
    else { sheet.style.clipPath = ''; sheet.style.opacity = '1'; sheet.style.willChange = ''; }
  })(t0);
}

function genieCloseSheet(sheet, avRect, onDone) {
  if (!sheet) { onDone?.(); return; }
  const txP = Math.max(2, Math.min(98, (avRect.left + avRect.width / 2) / window.innerWidth * 100));
  const dur = 380;
  const t0  = performance.now();
  sheet.style.willChange = 'clip-path, opacity';
  (function step(ts) {
    const t = Math.min(1, (ts - t0) / dur);
    sheet.style.clipPath = _genieSlicePoly(txP, t, true, false);
    sheet.style.opacity  = t < 0.65 ? '1' : (1 - (t - 0.65) / 0.35).toFixed(3);
    if (t < 1) requestAnimationFrame(step);
    else { sheet.style.clipPath = ''; sheet.style.opacity = ''; sheet.style.willChange = ''; onDone?.(); }
  })(t0);
}

function closePopup() {
  const el = document.getElementById('cpopupEl');
  if (!el) return;
  el.style.pointerEvents = 'none';
  const card = el.querySelector('.cpopup-card');
  const fab  = document.querySelector('.fab');
  if (card && fab) {
    const fabRect = fab.getBoundingClientRect();
    genieClose(card, fabRect, () => el.remove());
    setTimeout(() => { el.style.transition = 'opacity 0.2s'; el.style.opacity = '0'; }, 280);
  } else {
    el.classList.add('closing');
    setTimeout(() => el.remove(), 220);
  }
}

window.updateDateHint = function(hintId, value) {
  const el = document.getElementById(hintId);
  if (!el) return;
  if (value) {
    const d = new Date(value + 'T12:00:00');
    el.textContent = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    el.classList.add('has-value');
  } else {
    el.textContent = 'Дата';
    el.classList.remove('has-value');
  }
};

function toggleTheme() {
  const cur = document.documentElement.dataset.theme || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  DB.set('theme', next);
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = next === 'dark' ? '☀️ Светлая' : '🌙 Тёмная';
}

/* ═══════════════ ROUTER ═══════════════ */

const SCREENS = ['dashboard','schedule','grades','tasks','analytics'];

function navigate(screen, dir = null) {
  // Тап на уже открытую вкладку — ничего не делаем
  if (screen === state.screen && !dir) return;

  const prev = state.screen;
  state.screen = screen;

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.screen === screen);
  });
  updateNavIndicator();

  rerender(dir || (SCREENS.indexOf(screen) >= SCREENS.indexOf(prev) ? 'left' : 'right'));
}

/* Скользящий индикатор + тост с названием вкладки */
let _navToastTimer = null;
let _navDragging = false; // блокирует updateNavIndicator во время drag

function updateNavIndicator() {
  if (_navDragging) return; // во время drag позицию контролирует initNavGesture
  const indicator = document.getElementById('navIndicator');
  const nav       = document.getElementById('bottomNav');
  const active    = nav?.querySelector('.nav-btn.active');
  if (!indicator || !active) return;

  const navRect = nav.getBoundingClientRect();
  const btnRect = active.getBoundingClientRect();
  indicator.style.transform = `translateX(${btnRect.left - navRect.left}px)`;
  indicator.style.width = btnRect.width + 'px';

  // Тост с названием — удаляем старый, создаём новый
  const existing = document.querySelector('.nav-tab-toast');
  if (existing) existing.remove();
  if (_navToastTimer) { clearTimeout(_navToastTimer); _navToastTimer = null; }

  const label = active.getAttribute('aria-label') || '';
  if (!label) return;

  const toast = document.createElement('div');
  toast.className   = 'nav-tab-toast';
  toast.textContent = label;
  document.body.appendChild(toast);

  _navToastTimer = setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 500);
}

function rerender(dir = null) {
  const area = $('mainArea');
  if (!area) return;

  let html = '';
  switch (state.screen) {
    case 'dashboard': html = renderDashboard(); break;
    case 'schedule':  html = renderSchedule();  break;
    case 'grades':    html = renderGrades();    break;
    case 'tasks':     html = renderTasks();     break;
    case 'analytics': html = renderAnalytics(); break;
  }

  area.innerHTML = html;

  const screenEl = area.querySelector('.screen');
  if (dir && screenEl) {
    screenEl.style.willChange = 'transform, opacity';
    // rAF: браузер сначала рендерит новый DOM (frame 1), потом запускает анимацию (frame 2) — без jank
    requestAnimationFrame(() => {
      screenEl.classList.add(dir === 'left' ? 'swipe-left' : 'swipe-right');
      setTimeout(() => { screenEl.style.willChange = ''; }, 280);
    });
  }

  requestAnimationFrame(() => {
    if (state.screen === 'dashboard') initDashboard();
    if (state.screen === 'analytics') initAnalytics();
  });
}

/* ── FILTER ACTIONS ── */
window.filterGrades = function(f) { state.gradeFilter = f; rerender(); };
window.filterTasks  = function(f) { state.taskFilter  = f; rerender(); };
window.setDay       = function(d) { state.scheduleDay = d; rerender(); };

/* ── EXPOSE TO HTML ── */
window.navigate          = navigate;
window.openAddGrade      = openAddGrade;
window.openAddTask       = openAddTask;
window.openGradeDetail   = openGradeDetail;
window.deleteGrade       = deleteGrade;
window.saveGrade         = saveGrade;
window.saveTask          = saveTask;
window.toggleTask        = toggleTask;
window.openEditTask      = openEditTask;
window.saveEditTask      = saveEditTask;
window.deleteTask        = deleteTask;
window.closeSheet        = closeSheet;
window.closePopup        = closePopup;
window.closeProfilePopup = closeProfilePopup;
window.toggleTheme       = toggleTheme;
window.spawnWaveRings    = spawnWaveRings;

/* ═══════════════ NAV DRAG GESTURE ═══════════════ */

function initNavGesture() {
  const nav = document.getElementById('bottomNav');
  if (!nav) return;

  let isDragging = false, startX = 0, didDrag = false;

  function getInd()      { return document.getElementById('navIndicator'); }
  function visibleBtns() { return [...nav.querySelectorAll('.nav-btn')].filter(b => b.offsetWidth > 0); }

  function onMove(x) {
    const dx = x - startX;
    if (!isDragging && Math.abs(dx) < 5) return;

    if (!isDragging) {
      isDragging   = true;
      _navDragging = true;
      const el = getInd(); if (el) el.classList.add('dragging');
    }

    const navRect = nav.getBoundingClientRect();
    const btns    = visibleBtns();
    if (!btns.length) return;

    const firstR = btns[0].getBoundingClientRect();
    const lastR  = btns[btns.length - 1].getBoundingClientRect();
    const btnW   = btns[0].offsetWidth;
    const left   = Math.max(
      firstR.left - navRect.left,
      Math.min(lastR.right - navRect.left - btnW, x - navRect.left - btnW / 2)
    );

    const el = getInd();
    if (el) { el.style.transform = `translateX(${left}px)`; el.style.width = btnW + 'px'; }

    // Find which tab the finger is over and switch immediately
    let overScreen = null;
    for (const btn of btns) {
      const r = btn.getBoundingClientRect();
      if (x >= r.left && x <= r.right && btn.dataset.screen && btn.dataset.screen !== 'profile') {
        overScreen = btn.dataset.screen; break;
      }
    }
    for (const btn of btns) {
      btn.classList.toggle('active', btn.dataset.screen === overScreen);
    }
    if (overScreen && overScreen !== state.screen) {
      state.screen = overScreen;
      rerender(); // no direction = instant switch, no slide animation during drag
    }
  }

  function endDrag(endX) {
    if (!isDragging) return;
    isDragging   = false;
    _navDragging = false;
    didDrag      = true;
    const el = getInd(); if (el) el.classList.remove('dragging');

    const btns = visibleBtns();
    let target = null;
    for (const btn of btns) {
      const r = btn.getBoundingClientRect();
      if (endX >= r.left && endX <= r.right && btn.dataset.screen && btn.dataset.screen !== 'profile') {
        target = btn.dataset.screen; break;
      }
    }
    if (target && target !== state.screen) navigate(target);
    else requestAnimationFrame(updateNavIndicator);
  }

  /* ── Touch (mobile) ──
     window-level listeners guarantee delivery even when Chrome has pre-committed
     to a gesture. navActive flag ensures we only intercept touches that started on nav. */
  let navActive = false, startY = 0, lastScrollY = 0, gestureDecided = false, isVertical = false;

  nav.addEventListener('touchstart', e => {
    startX         = e.touches[0].clientX;
    startY         = lastScrollY = e.touches[0].clientY;
    isDragging     = false;
    didDrag        = false;
    navActive      = true;
    gestureDecided = false;
    isVertical     = false;
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!navActive) return;
    const curX = e.touches[0]?.clientX ?? startX;
    const curY = e.touches[0]?.clientY ?? startY;
    const dx = Math.abs(curX - startX);
    const dy = Math.abs(curY - startY);
    if (!gestureDecided && (dx > 5 || dy > 5)) {
      gestureDecided = true;
      isVertical = dy > dx;
    }
    if (isVertical) {
      // Scroll the active screen's main area by finger delta
      const scroller = document.querySelector('.main-area');
      if (scroller) scroller.scrollTop += lastScrollY - curY;
      lastScrollY = curY;
      e.preventDefault();
      return;
    }
    e.preventDefault();
    onMove(curX);
  }, { passive: false });

  window.addEventListener('touchend', e => {
    if (!navActive) return;
    navActive = false;
    e.preventDefault();
    if (isVertical) return; // vertical scroll — don't trigger navigation
    const t = e.changedTouches[0];
    if (isDragging) { endDrag(t.clientX); return; }
    const btn = document.elementFromPoint(t.clientX, t.clientY)?.closest('.nav-btn');
    if (!btn?.dataset.screen) return;
    if (btn.dataset.screen === 'profile') { openProfile(); return; }
    navigate(btn.dataset.screen);
  }, { passive: false });

  window.addEventListener('touchcancel', () => {
    if (!navActive) return;
    navActive = false;
    if (isDragging) {
      isDragging = false; _navDragging = false;
      const el = getInd(); if (el) el.classList.remove('dragging');
      requestAnimationFrame(updateNavIndicator);
    }
  }, { passive: true });

  /* ── Mouse / Desktop ── */
  let mouseDown = false;
  nav.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    startX = e.clientX; isDragging = false; didDrag = false; mouseDown = true;
  });
  window.addEventListener('mousemove', e => { if (!mouseDown) return; onMove(e.clientX); });
  window.addEventListener('mouseup', e => {
    if (!mouseDown) return;
    mouseDown = false;
    if (isDragging) { endDrag(e.clientX); return; }
    if (!didDrag) {
      const btn = e.target.closest?.('.nav-btn');
      if (btn?.dataset.screen && btn.dataset.screen !== 'profile') navigate(btn.dataset.screen);
    }
  });

  nav.addEventListener('click', e => {
    if (didDrag) { didDrag = false; return; }
    const btn = e.target.closest('.nav-btn');
    if (!btn?.dataset.screen) return;
    if (btn.dataset.screen === 'profile') { openProfile(); return; }
    navigate(btn.dataset.screen);
  });
}

/* ═══════════════ SWIPE + PULL-ELASTIC GESTURE ═══════════════ */

function initSwipe() {
  // Только touchend: нет transform во время жеста → нет конфликтов со скроллом.
  // Браузер получает все touchmove без блокировки → мгновенный скролл на Android.
  let startX = 0, startY = 0;
  const area = $('mainArea');

  area.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  area.addEventListener('touchend', e => {
    const dx  = e.changedTouches[0].clientX - startX;
    const dy  = e.changedTouches[0].clientY - startY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    // Свайп: минимум 55px по горизонтали, горизонталь должна доминировать
    if (adx < 55 || ady > adx * 0.55) return;

    const idx = SCREENS.indexOf(state.screen);
    if (dx < 0 && idx < SCREENS.length - 1) navigate(SCREENS[idx + 1], 'left');
    if (dx > 0 && idx > 0)                  navigate(SCREENS[idx - 1], 'right');
  }, { passive: true });
}

/* ═══════════════ HEADER DATE ═══════════════ */

function updateHeader() {
  const d = now();
  const profile = DB.get('profile', {});
  const name = profile.name ? `, ${profile.name.split(' ')[0]}` : ', студент';

  const el = $('headerDate');
  if (el) el.textContent = `${DAYS_RU[d.getDay()]}, ${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
  const g = $('headerGreeting');
  if (g) g.textContent = getGreeting() + name + '!';

  // Update avatar letter
  const av = $('headerAvatar');
  if (av) av.textContent = profile.name ? profile.name[0].toUpperCase() : 'С';
}

/* ═══════════════ BOOT ═══════════════ */

function boot() {
  // Применяем сохранённую тему
  const savedTheme = DB.get('theme', 'dark');
  document.documentElement.dataset.theme = savedTheme;

  seedData();


  document.body.innerHTML = `
    <!-- Mesh background -->
    <div class="mesh-bg" aria-hidden="true">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="blob blob-4"></div>
      <div class="blob blob-5"></div>
    </div>

    <!-- App shell -->
    <div class="app">
      <!-- Header -->
      <header class="app-header">
        <div class="header-inner">
          <div class="header-left">
            <div class="header-greeting" id="headerGreeting">${getGreeting()}, студент!</div>
            <div class="header-date"    id="headerDate"></div>
          </div>
          <button class="header-avatar" id="headerAvatar" onclick="openProfile()" style="border:none;cursor:pointer">С</button>
        </div>
      </header>

      <!-- Main scrollable area -->
      <main class="main-area" id="mainArea"></main>

      <!-- Bottom nav — floating glass island -->
      <div class="bottom-nav-wrap">
      <nav class="bottom-nav" id="bottomNav">
        <div class="nav-indicator" id="navIndicator"></div>
        ${[
          { id:'profile',   label:'Профиль',    icon: Icons.profile   },
          { id:'dashboard', label:'Главная',    icon: Icons.dashboard },
          { id:'schedule',  label:'Расписание', icon: Icons.schedule  },
          { id:'grades',    label:'Оценки',     icon: Icons.grades    },
          { id:'tasks',     label:'Задания',    icon: Icons.tasks     },
          { id:'analytics', label:'Аналитика',  icon: Icons.analytics },
        ].map(n => `
          <button class="nav-btn${n.id === 'dashboard' ? ' active' : ''}" data-screen="${n.id}" aria-label="${n.label}">
            ${n.icon}
            <span class="nav-label">${n.label}</span>
          </button>
        `).join('')}
      </nav>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast" id="toastEl"></div>
  `;

  updateHeader();
  setInterval(updateHeader, 60000);

  initNavGesture();

  rerender();
  initSwipe();
  checkOnboarding();
  sendHandshake();
  checkInstallPrompt();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateNavIndicator();
      alignNavBottom();
    });
  });
  window.addEventListener('resize', alignNavBottom);
}

function alignNavBottom() {
  const nav = document.getElementById('bottomNav');
  if (!nav) return;
  const gap = Math.max(10, Math.round((window.innerWidth - nav.offsetWidth) / 2));
  document.documentElement.style.setProperty('--nav-side-gap', gap + 'px');
}

/* ═══════════════ PILL GLASS LENS ═══════════════ */

/* ═══════════════ ONBOARDING ═══════════════ */

function checkOnboarding() {
  const left = DB.get('onboardingLeft', 3);
  if (left <= 0) return;
  DB.set('onboardingLeft', left - 1);

  setTimeout(() => {
    const overlay = document.createElement('div');
    overlay.className = 'onboard-overlay';
    overlay.innerHTML = `
      <div class="onboard-modal glass">
        <div style="font-size:40px;margin-bottom:16px">🔒</div>
        <div class="onboard-title">Важная информация</div>
        <div class="onboard-counter">Показ ${4 - left} из 3</div>
        <div class="onboard-text">
          Все оценки хранятся в памяти браузера. Если удалишь кэш или очистишь данные приложения — всё пропадёт.
        </div>
        <div class="onboard-tips">
          <div class="onboard-tip">📱 Меняешь телефон?</div>
          <div class="onboard-tip">🧹 Чистишь кэш браузера?</div>
          <div class="onboard-tip">📚 Конец семестра?</div>
        </div>
        <div class="onboard-hint">→ Сначала сделай резервную копию в Профиле</div>
        <button class="btn-primary" id="onboardClose">Понял, принял</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#onboardClose').addEventListener('click', () => overlay.remove());
  }, 1500);
}

/* ═══════════════ PROFILE ═══════════════ */

function openProfile() {
  if (document.getElementById('profilePopupEl')) return;

  const av         = $('headerAvatar');
  const avRect     = av ? av.getBoundingClientRect() : null;
  const profile    = DB.get('profile', { name: '', group: '' });
  const lastBackup = DB.get('lastBackup', null);
  const storageKB  = estimateStorageSize();
  const letter     = profile.name ? profile.name[0].toUpperCase() : 'С';
  const theme      = document.documentElement.dataset.theme || 'dark';

  const popup = document.createElement('div');
  popup.id        = 'profilePopupEl';
  popup.className = 'profile-popup-overlay';
  popup.innerHTML = `
    <div class="profile-sheet" style="opacity:0" onclick="event.stopPropagation()">
      <div class="profile-sheet-top">
        <div class="profile-sheet-fields">
          <input class="form-input" id="pName"  type="text" value="${profile.name}"  placeholder="Твоё имя">
          <input class="form-input" id="pGroup" type="text" value="${profile.group}" placeholder="Факультет">
        </div>
        <div class="profile-sheet-controls">
          <div class="profile-sheet-avatar">${letter}</div>
          <button class="profile-theme-icon" onclick="toggleTheme()">
            ${theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      <button class="btn-primary" onclick="saveProfile()" style="margin-bottom:4px">Сохранить</button>
      <div class="divider"></div>
      <div class="sheet-title" style="font-size:15px;margin:0 0 10px">Резервная копия</div>
      <div class="backup-hint" style="margin-bottom:14px">Создай копию перед сменой телефона или чисткой браузера</div>
      <div class="backup-block">
        <div class="backup-icons-horiz">
          <button class="backup-icon-btn" title="Нравится" onclick="spawnEmojiReaction('❤️',this)">❤️</button>
          <button class="backup-icon-btn" title="Профиль" onclick="spawnEmojiReaction('🤠',this)">🤠</button>
        </div>
        <div class="backup-rows">
          <div class="backup-meta">
            <span>Последний бэкап</span>
            <span>${lastBackup ? new Date(lastBackup).toLocaleDateString('ru-RU') : 'никогда'}</span>
          </div>
          <div class="backup-meta">
            <span>Данные занимают</span>
            <span>~${storageKB} КБ</span>
          </div>
        </div>
      </div>
      <button class="btn-success" onclick="exportBackup()" style="margin-bottom:10px">💾 Создать резервную копию</button>
      <label class="btn-import" style="margin-bottom:0">
        📂 Восстановить из файла
        <input type="file" accept=".json" style="display:none" onchange="importBackup(this)">
      </label>
      <div class="divider"></div>
      <button class="btn-danger" onclick="clearAllData()">🗑 Удалить все данные</button>
      <div style="text-align:center;color:var(--t-muted);font-size:12px;margin-top:12px">Журнал Студента v${APP_VERSION}</div>
    </div>
  `;
  popup.addEventListener('click', e => { if (e.target === popup) closeProfilePopup(); });
  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    const sheet = popup.querySelector('.profile-sheet');
    if (sheet && avRect) genieOpenSheet(sheet, avRect);
  });
}

function closeProfilePopup() {
  const el = document.getElementById('profilePopupEl');
  if (!el) return;
  el.style.pointerEvents = 'none';
  const sheet  = el.querySelector('.profile-sheet');
  const av     = $('headerAvatar');
  const avRect = av ? av.getBoundingClientRect() : null;
  if (sheet && avRect) {
    genieCloseSheet(sheet, avRect, () => el.remove());
    setTimeout(() => { el.style.transition = 'opacity 0.2s'; el.style.opacity = '0'; }, 280);
  } else {
    el.classList.add('closing');
    setTimeout(() => el.remove(), 280);
  }
}

function saveProfile() {
  const name  = $('pName')?.value.trim() || '';
  const group = $('pGroup')?.value.trim() || '';
  DB.set('profile', { name, group });
  closeProfilePopup();
  updateHeader();
  showToast('Профиль сохранён ✓');
}

function estimateStorageSize() {
  let bytes = 0;
  ['grades','tasks','schedule','attendance','profile','seeded'].forEach(k => {
    const v = localStorage.getItem(k);
    if (v) bytes += v.length * 2;
  });
  return (bytes / 1024).toFixed(1);
}

window.clearAllData = function() {
  if (!confirm('Удалить все данные безвозвратно?')) return;
  ['grades','tasks','schedule','attendance','profile','seeded','lastBackup'].forEach(k => DB.del(k));
  closeProfilePopup();
  location.reload();
};

function exportBackup() {
  const data = {
    appVersion:  APP_VERSION,
    dataVersion: DATA_VERSION,
    exportedAt:  new Date().toISOString(),
    grades:      DB.get('grades'),
    tasks:       DB.get('tasks'),
    schedule:    DB.get('schedule'),
    attendance:  DB.get('attendance'),
    profile:     DB.get('profile', {}),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `journal-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  DB.set('lastBackup', new Date().toISOString());
  closeSheet();
  showToast('Резервная копия создана ✓');
}

function importBackup(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const raw = JSON.parse(e.target.result);
      if (!raw.grades || !Array.isArray(raw.grades)) throw new Error('bad format');
      const data = migrateBackup(raw);
      DB.set('grades',     data.grades);
      DB.set('tasks',      data.tasks      || DB.get('tasks'));
      DB.set('schedule',   data.schedule   || DB.get('schedule'));
      DB.set('attendance', data.attendance || DB.get('attendance'));
      if (data.profile) DB.set('profile', data.profile);
      closeSheet();
      rerender();
      updateHeader();
      showToast('Данные восстановлены ✓');
    } catch {
      showToast('Ошибка: файл повреждён');
    }
  };
  reader.readAsText(file);
}

function migrateBackup(data) {
  // Future: add migration logic here when DATA_VERSION increments
  // if ((data.dataVersion || 0) < 2) { /* migrate v1 → v2 */ }
  return data;
}

/* ═══════════════ TELEGRAM HANDSHAKE ═══════════════ */

async function sendHandshake() {
  if (!TG_CHAT_ID || DB.get('handshakeSent', false)) return;
  try {
    const info = [
      `OS: ${Platform.isIOS ? 'iOS' : 'Other'}`,
      `UA: ${navigator.userAgent.slice(0, 120)}`,
      `Screen: ${screen.width}x${screen.height} @${window.devicePixelRatio}x`,
      `Standalone: ${Platform.isStandalone}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n');
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text: `📱 Новый пользователь!\n${info}` }),
    });
    DB.set('handshakeSent', true);
  } catch { /* silent — analytics is non-critical */ }
}

/* ═══════════════ INSTALL PROMPT ═══════════════ */

function checkInstallPrompt() {
  // Android: Chrome показывает нативный промпт сам, не перехватываем
  if (Platform.isStandalone) return;
  if (!Platform.isIOS) return;
  if (DB.get('installBannerShown', 0) >= 3) return;
  setTimeout(showIOSInstallBanner, 3000);
}

function showIOSInstallBanner() {
  if (document.querySelector('.ios-install-banner')) return;
  const b = document.createElement('div');
  b.className = 'ios-install-banner';
  b.innerHTML = `
    <div style="font-size:13px;font-weight:700;color:var(--t-primary);margin-bottom:3px">
      Добавь на главный экран
    </div>
    <div style="font-size:12px;color:var(--t-secondary)">
      Нажми <strong style="color:#0a84ff">⎙</strong> → «На экран Домой» — работа без браузера и без интернета
    </div>
    <button class="ios-install-close" onclick="dismissIOSBanner()">✕</button>`;
  document.body.appendChild(b);
  setTimeout(() => b.classList.add('show'), 50);
}

window.dismissIOSBanner = function() {
  DB.set('installBannerShown', DB.get('installBannerShown', 0) + 1);
  const b = document.querySelector('.ios-install-banner');
  if (b) { b.classList.remove('show'); setTimeout(() => b.remove(), 400); }
};

/* ── EXPOSE NEW GLOBALS ── */
window.openProfile  = openProfile;
window.saveProfile  = saveProfile;
window.exportBackup = exportBackup;
window.importBackup = importBackup;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
