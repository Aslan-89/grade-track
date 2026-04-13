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
  isIOS:       /iphone|ipad|ipod/i.test(navigator.userAgent),
  isAndroid:   /android/i.test(navigator.userAgent),
  isStandalone: window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true,
  isSafari:    /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
};

/* ── SERVICE WORKER + UPDATE MANAGER ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
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
                style="width:0%;background:linear-gradient(90deg,${s.color}99,${s.color});box-shadow:0 0 8px ${s.color}60"
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
                style="width:${p}%;background:linear-gradient(90deg,${cls}80,${cls});transition:width 1.2s cubic-bezier(.22,1,.36,1)">
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}

function initAnalytics() {
  // Animate bars
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.bar-fill[data-target]').forEach(bar => {
        bar.style.transition = 'width 1s cubic-bezier(.22,1,.36,1)';
        bar.style.width = bar.dataset.target + '%';
      });
      drawDonut();
      drawLineChart();
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
    <div class="task-check">
      ${Icons.check}
    </div>
    <div class="task-info">
      <div class="task-title">${t.title}</div>
      <div class="task-sub">${s?.name || ''}</div>
    </div>
    <span class="task-deadline ${deadlineClass(days)}">${deadlineText(days)}</span>
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
  overlay.addEventListener('click', e => { if (e.target === overlay) closeSheet(); });
  document.body.appendChild(overlay);
}

function closeSheet() {
  const o = $('sheetOverlay');
  if (o) o.remove();
}

function openAddGrade() {
  openSheet(`

    <div class="sheet-title">Новая оценка</div>

    <div class="form-group">
      <label class="form-label">Предмет</label>
      <select class="form-select" id="fSubject">
        ${SUBJECTS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Оценка</label>
      <div class="grade-select-grid">
        ${[5,4,3,2,1].map(v => `
          <button class="grade-option${v===5?' selected':''}" data-val="${v}" onclick="selectGradeVal(${v})">${v}</button>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Тип</label>
      <select class="form-select" id="fType">
        ${Object.entries(GRADE_LABELS).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Дата</label>
      <input class="form-input" type="date" id="fDate" value="${new Date().toISOString().split('T')[0]}">
    </div>

    <div class="form-group">
      <label class="form-label">Заметка (необязательно)</label>
      <input class="form-input" type="text" id="fNote" placeholder="Комментарий">
    </div>

    <button class="btn-primary" onclick="saveGrade()">Сохранить оценку</button>
  `);
}

let selectedGradeVal = 5;
function selectGradeVal(v) {
  selectedGradeVal = v;
  document.querySelectorAll('.grade-option').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.val) === v);
  });
}

function saveGrade() {
  const grades = DB.get('grades');
  grades.unshift({
    id: uid(),
    subject: $('fSubject').value,
    value: selectedGradeVal,
    type: $('fType').value,
    date: $('fDate').value,
    note: $('fNote').value
  });
  DB.set('grades', grades);
  closeSheet();
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
  openSheet(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <div class="sheet-title" style="margin-bottom:0;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Новое задание</div>
      <button class="btn-primary" onclick="saveTask()" style="padding:8px 0;font-size:14px;margin:0;width:50%;flex-shrink:0">Добавить</button>
    </div>

    <div class="form-group">
      <label class="form-label">Название</label>
      <input class="form-input" type="text" id="fTaskTitle" placeholder="Что нужно сделать?">
    </div>

    <div class="form-group">
      <label class="form-label">Предмет</label>
      <select class="form-select" id="fTaskSubject">
        ${SUBJECTS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Дедлайн</label>
      <input class="form-input" type="date" id="fTaskDeadline" value="${new Date(Date.now()+86400000*3).toISOString().split('T')[0]}">
    </div>

    <div class="form-group">
      <label class="form-label">Приоритет</label>
      <select class="form-select" id="fTaskPriority">
        <option value="high">🔴 Высокий</option>
        <option value="medium" selected>🟡 Средний</option>
        <option value="low">🟢 Низкий</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Заметка</label>
      <input class="form-input" type="text" id="fTaskNote" placeholder="Подробности...">
    </div>
  `);
}

function saveTask() {
  const title = $('fTaskTitle')?.value?.trim();
  if (!title) { showToast('Введи название'); return; }
  const tasks = DB.get('tasks');
  tasks.unshift({
    id: uid(),
    title,
    subject: $('fTaskSubject').value,
    deadline: $('fTaskDeadline').value,
    priority: $('fTaskPriority').value,
    note: $('fTaskNote').value,
    done: false
  });
  DB.set('tasks', tasks);
  closeSheet();
  rerender();
  showToast('Задание добавлено ✓');
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

function updateNavIndicator() {
  const indicator = document.getElementById('navIndicator');
  const nav       = document.getElementById('bottomNav');
  const active    = nav?.querySelector('.nav-btn.active');
  if (!indicator || !active) return;

  // Позиция индикатора
  const navRect = nav.getBoundingClientRect();
  const btnRect = active.getBoundingClientRect();
  indicator.style.left  = (btnRect.left - navRect.left - 1) + 'px';
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

  if (dir) {
    const screen = area.querySelector('.screen');
    if (screen) {
      // GPU-слой только на время анимации
      screen.style.willChange = 'transform, opacity';
      screen.classList.add(dir === 'left' ? 'swipe-left' : 'swipe-right');
      // Снимаем will-change сразу после анимации — освобождаем GPU память
      setTimeout(() => { screen.style.willChange = ''; }, 300);
    }
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
window.navigate         = navigate;
window.openAddGrade     = openAddGrade;
window.openAddTask      = openAddTask;
window.openGradeDetail  = openGradeDetail;
window.deleteGrade      = deleteGrade;
window.saveGrade        = saveGrade;
window.saveTask         = saveTask;
window.toggleTask       = toggleTask;
window.selectGradeVal   = selectGradeVal;
window.closeSheet       = closeSheet;

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
  seedData();

  // Apply platform classes so CSS can target each platform specifically
  if (Platform.isIOS)          document.body.classList.add('plat-ios');
  else if (Platform.isAndroid) document.body.classList.add('plat-android');
  else                         document.body.classList.add('plat-desktop');
  if (Platform.isStandalone)   document.body.classList.add('pwa-installed');

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

  // touchstart вместо click — убирает 300ms задержку на Android/iOS
  document.getElementById('bottomNav').addEventListener('touchstart', e => {
    const btn = e.target.closest('.nav-btn');
    if (!btn?.dataset.screen) return;
    e.preventDefault(); // блокируем дублирующий click
    if (btn.dataset.screen === 'profile') { openProfile(); return; }
    navigate(btn.dataset.screen);
  }, { passive: false });

  // Fallback для мыши/десктопа
  document.getElementById('bottomNav').addEventListener('click', e => {
    if (e._touchHandled) return;
    const btn = e.target.closest('.nav-btn');
    if (!btn?.dataset.screen) return;
    if (btn.dataset.screen === 'profile') { openProfile(); return; }
    navigate(btn.dataset.screen);
  });

  rerender();
  initSwipe();
  checkOnboarding();
  sendHandshake();
  checkInstallPrompt();
  // Первоначальная позиция индикатора (после layout)
  requestAnimationFrame(() => requestAnimationFrame(updateNavIndicator));
}

/* ═══════════════ PILL GLASS LENS ═══════════════ */

function initPillGlass() {
  // Генерируем displacement map для barrel distortion (выпуклая линза).
  //
  // Ключевое: filter:url() на ::before РАБОТАЕТ в Chrome.
  // backdrop-filter:url() — НЕ РАБОТАЕТ в Chrome (только blur/saturate/brightness).
  //
  // ::before имеет position:absolute; inset:-50px; background-attachment:fixed
  // с теми же цветами что mesh-bg. Этот клон фона деформируется filter:url(#pill-glass),
  // создавая реальное визуальное искажение как сквозь выпуклое стекло.

  const W = 256, H = 128;
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const ctx = off.getContext('2d');
  const id = ctx.createImageData(W, H);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const nx = (x / (W - 1)) * 2 - 1;  // -1..1 по горизонтали
      const ny = (y / (H - 1)) * 2 - 1;  // -1..1 по вертикали

      // Capsule SDF — расстояние от центра пилла
      const asp = W / H;  // ~2.0
      const hw  = asp * 0.5 - 0.5;
      const cx  = Math.max(Math.abs(nx * asp * 0.5) - hw, 0);
      const dist = Math.sqrt(cx * cx + ny * ny);
      const r   = 0.5;

      // Barrel profile: 0 в центре → 1 на краю (кубическая, плавный центр)
      const t = Math.min(dist / r, 1.2);
      const profile = t * t * t;

      // Outward push: правый край (nx>0) даёт R>128 → displacement вправо
      // feDisplacementMap: result[x,y] = source[x + scale*(R/255−0.5), y + scale*(G/255−0.5)]
      const amp = 100;
      const rByte = 128 + Math.round(nx * profile * amp);
      const gByte = 128 + Math.round(ny * profile * amp);

      const i = (y * W + x) * 4;
      id.data[i]   = Math.max(0, Math.min(255, rByte));
      id.data[i+1] = Math.max(0, Math.min(255, gByte));
      id.data[i+2] = 128;
      id.data[i+3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  const mapURL = off.toDataURL('image/png');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  svg.innerHTML = `<defs>
    <filter id="pill-glass" x="-20%" y="-20%" width="140%" height="140%"
            color-interpolation-filters="sRGB">
      <feImage href="${mapURL}" result="lensmap" preserveAspectRatio="none"/>
      <feDisplacementMap in="SourceGraphic" in2="lensmap"
                         scale="65"
                         xChannelSelector="R" yChannelSelector="G"
                         result="distorted"/>
      <!-- Хроматическая аберрация: R правее, B левее → призматический край -->
      <feColorMatrix in="distorted" type="matrix"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="rChan"/>
      <feColorMatrix in="distorted" type="matrix"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gChan"/>
      <feColorMatrix in="distorted" type="matrix"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="bChan"/>
      <feOffset in="rChan" dx="3" dy="0" result="rShifted"/>
      <feOffset in="bChan" dx="-3" dy="0" result="bShifted"/>
      <feBlend in="rShifted" in2="gChan"    mode="screen" result="rg"/>
      <feBlend in="rg"       in2="bShifted" mode="screen"/>
    </filter>
  </defs>`;
  document.body.appendChild(svg);
}

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
  const profile   = DB.get('profile', { name: '', group: '' });
  const lastBackup = DB.get('lastBackup', null);
  const storageKB  = estimateStorageSize();

  openSheet(`


    <div class="form-group">
      <label class="form-label">Имя</label>
      <input class="form-input" id="pName" type="text" value="${profile.name}"
             placeholder="Твоё имя">
    </div>

    <div class="form-group">
      <label class="form-label">Группа</label>
      <input class="form-input" id="pGroup" type="text" value="${profile.group}"
             placeholder="Например: КИ21-01">
    </div>

    <button class="btn-primary" onclick="saveProfile()" style="margin-bottom:24px">Сохранить</button>

    <div class="divider"></div>
    <div class="sheet-title" style="font-size:15px;margin:16px 0 12px">Резервная копия</div>

    <div class="backup-hint">
      Создай копию перед сменой телефона, чисткой браузера или в конце семестра
    </div>

    <div class="backup-meta">
      <span>Последний бэкап:</span>
      <span>${lastBackup ? new Date(lastBackup).toLocaleDateString('ru-RU') : 'никогда'}</span>
    </div>
    <div class="backup-meta" style="margin-bottom:16px">
      <span>Данные занимают:</span>
      <span>~${storageKB} КБ</span>
    </div>

    <button class="btn-primary" onclick="exportBackup()"
      style="background:linear-gradient(135deg,#10b981,#06b6d4);margin-bottom:8px">
      💾 Создать резервную копию
    </button>

    <label class="btn-import">
      📂 Восстановить из файла
      <input type="file" accept=".json" style="display:none" onchange="importBackup(this)">
    </label>

    <div class="divider"></div>
    <div style="text-align:center;color:var(--t-muted);font-size:12px;padding-bottom:4px">
      Журнал Студента v${APP_VERSION}
    </div>
  `);
}

function saveProfile() {
  const name  = $('pName')?.value.trim() || '';
  const group = $('pGroup')?.value.trim() || '';
  DB.set('profile', { name, group });
  closeSheet();
  updateHeader();
  showToast('Профиль сохранён ✓');
}

function estimateStorageSize() {
  let bytes = 0;
  ['grades','tasks','schedule','attendance','profile','seeded'].forEach(k => {
    const v = localStorage.getItem(k);
    if (v) bytes += v.length * 2; // UTF-16 chars
  });
  return (bytes / 1024).toFixed(1);
}

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
      `OS: ${Platform.isIOS ? 'iOS' : Platform.isAndroid ? 'Android' : 'Desktop'}`,
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

/* ═══════════════ iOS INSTALL PROMPT ═══════════════ */

function checkInstallPrompt() {
  if (Platform.isStandalone) return; // already installed
  if (!Platform.isIOS || !Platform.isSafari) return;
  if (DB.get('iOSInstallDismissed', false)) return;

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
  DB.set('iOSInstallDismissed', true);
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
