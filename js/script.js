(function authGuard() {
  const PROTECTED = [
    'timetable.html','tasks.html','notes.html',
    'money.html','timer.html','syllabus.html','projects.html'
  ];
  const page = location.pathname.split('/').pop() || 'index.html';
  if (!PROTECTED.includes(page)) return;               // not a protected page

  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (user) return;                                    // logged in — let it load

  // Not logged in — inject full-page lock overlay immediately
  document.addEventListener('DOMContentLoaded', function() {
    // Blur / disable the page content
    const main = document.querySelector('main');
    if (main) {
      main.style.filter       = 'blur(6px)';
      main.style.pointerEvents = 'none';
      main.style.userSelect   = 'none';
    }

    // Build overlay
    const overlay = document.createElement('div');
    overlay.id = 'authOverlay';
    overlay.innerHTML = `
      <div class="auth-overlay-box">
        <div class="auth-overlay-icon">🔒</div>
        <h2 class="auth-overlay-title">Login Required</h2>
        <p class="auth-overlay-sub">You need to be logged in<br/>to access this page.</p>
        <a href="loginpage.html" class="auth-overlay-btn">Login / Sign Up →</a>
        <a href="index.html" class="auth-overlay-home">← Back to Dashboard</a>
      </div>
    `;
    document.body.appendChild(overlay);
  });
})();

// Pop-ups
function showToast(msg, color) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = color || 'rgba(74,158,255,0.95)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// UTILS 
function getLS(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function setLS(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function getObj(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}
function fmt2(n) { return String(n).padStart(2, '0'); }
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* PROFILE PAGE */
function initProfile() {
  const form = document.getElementById('profileForm');
  if (!form) return;
  const saved = getObj('profile');
  if (saved.name) renderProfile(saved);
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name   = form.pName.value.trim();
    const email  = form.pEmail.value.trim();
    const course = form.pCourse.value.trim();
    if (!name || !email || !course) { showToast('Please fill all fields', '#ff6eb4'); return; }
    const profile = { name, email, course, saved: new Date().toLocaleDateString() };
    setLS('profile', profile);
    renderProfile(profile);
    showToast('Profile saved!');
  });
}
function renderProfile(p) {
  const disp = document.getElementById('profileDisplay');
  if (!disp) return;
  disp.innerHTML = `
    <div class="p-name">${escHtml(p.name)}</div>
    <div class="p-detail">📧 ${escHtml(p.email)}</div>
    <div class="p-detail">📚 ${escHtml(p.course)}</div>
    <div class="p-detail" style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.35);">Last updated: ${p.saved}</div>
  `;
  disp.style.display = 'block';
  // Pre-fill form
  const form = document.getElementById('profileForm');
  if (form) {
    form.pName.value   = p.name;
    form.pEmail.value  = p.email;
    form.pCourse.value = p.course;
  }
}

/* TIMETABLE PAGE */
function initTimetable() {
  if (!document.getElementById('ttForm')) return;
  renderTimetable();
  document.getElementById('ttForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const subject = this.ttSubject.value.trim();
    const day     = this.ttDay.value;
    const time    = this.ttTime.value;
    const room    = this.ttRoom.value.trim();
    if (!subject || !day || !time) { showToast('Fill subject, day & time', '#ff6eb4'); return; }
    const entries = getLS('timetable');
    entries.push({ id: Date.now(), subject, day, time, room });
    setLS('timetable', entries);
    this.reset();
    renderTimetable();
    showToast('Class added!');
  });
}
function renderTimetable() {
  const tbody = document.getElementById('ttBody');
  if (!tbody) return;
  const entries = getLS('timetable');
  if (!entries.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📅</div><p>No classes yet. Add one above!</p></div></td></tr>`;
    return;
  }
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const sorted = [...entries].sort((a,b) => days.indexOf(a.day)-days.indexOf(b.day) || a.time.localeCompare(b.time));
  tbody.innerHTML = sorted.map(e => `
    <tr>
      <td><span class="day-badge">${escHtml(e.day)}</span></td>
      <td>${escHtml(e.time)}</td>
      <td style="font-weight:600;">${escHtml(e.subject)}</td>
      <td>${escHtml(e.room || '—')}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteEntry('timetable',${e.id},renderTimetable)">✕ Remove</button></td>
    </tr>`).join('');
}

/* TASKS PAGE */
function initTasks() {
  if (!document.getElementById('taskForm')) return;
  renderTasks();
  document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const text     = this.taskText.value.trim();
    const priority = this.taskPriority.value;
    const due      = this.taskDue.value;
    if (!text) { showToast('Enter a task', '#ff6eb4'); return; }
    const tasks = getLS('tasks');
    tasks.push({ id: Date.now(), text, priority, due, done: false });
    setLS('tasks', tasks);
    this.reset();
    renderTasks();
    showToast('Task added!');
  });
}
function toggleTask(id) {
  const tasks = getLS('tasks');
  const t = tasks.find(x => x.id === id);
  if (t) t.done = !t.done;
  setLS('tasks', tasks);
  renderTasks();
}
function renderTasks() {
  const list = document.getElementById('taskList');
  if (!list) return;
  const tasks = getLS('tasks');
  if (!tasks.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><p>No tasks yet — add one!</p></div>`;
    return;
  }
  const pMap = { high:'priority-high', medium:'priority-med', low:'priority-low' };
  list.innerHTML = tasks.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}">
      <div class="task-check ${t.done ? 'checked' : ''}" onclick="toggleTask(${t.id})">${t.done ? '✓' : ''}</div>
      <div class="task-text">${escHtml(t.text)}${t.due ? `<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:3px;">Due: ${t.due}</div>` : ''}</div>
      <span class="priority-badge ${pMap[t.priority] || 'priority-low'}">${t.priority}</span>
      <button class="btn btn-danger btn-sm" onclick="deleteEntry('tasks',${t.id},renderTasks)">✕</button>
    </div>`).join('');
}

/* NOTES PAGE */
function initNotes() {
  if (!document.getElementById('noteForm')) return;
  renderNotes();
  document.getElementById('noteForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = this.noteTitle.value.trim();
    const body  = this.noteBody.value.trim();
    if (!title || !body) { showToast('Fill title and note', '#ff6eb4'); return; }
    const notes = getLS('notes');
    notes.push({ id: Date.now(), title, body, date: new Date().toLocaleDateString() });
    setLS('notes', notes);
    this.reset();
    renderNotes();
    showToast('Note saved!');
  });
}
function renderNotes() {
  const grid = document.getElementById('notesGrid');
  if (!grid) return;
  const notes = getLS('notes');
  if (!notes.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">📝</div><p>No notes yet!</p></div>`;
    return;
  }
  grid.innerHTML = notes.map((n, i) => `
    <div class="note-card note-accent-${i%4}">
      <h4>${escHtml(n.title)}</h4>
      <p>${escHtml(n.body)}</p>
      <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:10px;">${n.date}</div>
      <div class="note-actions">
        <button class="btn btn-ghost btn-sm" onclick="editNote(${n.id})">✏ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEntry('notes',${n.id},renderNotes)">✕</button>
      </div>
    </div>`).join('');
}
function editNote(id) {
  const notes = getLS('notes');
  const n = notes.find(x => x.id === id);
  if (!n) return;
  const newTitle = prompt('Edit title:', n.title);
  const newBody  = prompt('Edit note:', n.body);
  if (newTitle !== null && newBody !== null) {
    n.title = newTitle.trim() || n.title;
    n.body  = newBody.trim()  || n.body;
    setLS('notes', notes);
    renderNotes();
    showToast('Note updated!');
  }
}

/* MONEY PAGE */
function initMoney() {
  if (!document.getElementById('moneyForm')) return;
  renderMoney();
  document.getElementById('moneyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const desc   = this.moneyDesc.value.trim();
    const amount = parseFloat(this.moneyAmount.value);
    const type   = this.moneyType.value;
    if (!desc || isNaN(amount) || amount <= 0) { showToast('Enter valid details', '#ff6eb4'); return; }
    const txns = getLS('transactions');
    txns.push({ id: Date.now(), desc, amount, type, date: new Date().toLocaleDateString() });
    setLS('transactions', txns);
    this.reset();
    renderMoney();
    showToast(type === 'income' ? 'Income added! 💰' : 'Expense added! 💸', type === 'income' ? '#6ee7b7' : '#ff6b6b');
  });
}
function renderMoney() {
  const txns = getLS('transactions');
  let income = 0, expense = 0;
  txns.forEach(t => { t.type === 'income' ? income += t.amount : expense += t.amount; });
  const balance = income - expense;
  const balEl = document.getElementById('totalBalance');
  const incEl = document.getElementById('totalIncome');
  const expEl = document.getElementById('totalExpense');
  if (balEl) {
    balEl.textContent = `₹${balance.toFixed(2)}`;
    balEl.className = 'balance-amount ' + (balance >= 0 ? 'balance-positive' : 'balance-negative');
  }
  if (incEl) incEl.textContent = `₹${income.toFixed(2)}`;
  if (expEl) expEl.textContent = `₹${expense.toFixed(2)}`;
  const list = document.getElementById('txnList');
  if (!list) return;
  if (!txns.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">💰</div><p>No transactions yet!</p></div>`;
    return;
  }
  list.innerHTML = [...txns].reverse().map(t => `
    <div class="transaction-item tx-${t.type}">
      <div class="tx-icon">${t.type === 'income' ? '💰' : '💸'}</div>
      <div>
        <div class="tx-desc">${escHtml(t.desc)}</div>
        <div class="tx-date">${t.date}</div>
      </div>
      <div class="tx-amount">${t.type === 'income' ? '+' : '-'}₹${t.amount.toFixed(2)}</div>
      <button class="btn btn-danger btn-sm" onclick="deleteEntry('transactions',${t.id},renderMoney)">✕</button>
    </div>`).join('');
}

/* STUDY TIMER PAGE */
let timerInterval = null;
let timerSeconds  = 0;
let timerRunning  = false;

function initTimer() {
  if (!document.getElementById('timerDisplay')) return;
  updateTimerDisplay();
  document.getElementById('btnStart').addEventListener('click', startTimer);
  document.getElementById('btnPause').addEventListener('click', pauseTimer);
  document.getElementById('btnReset').addEventListener('click', resetTimer);
}
function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  setTimerStatus('Running...');
  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}
function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  setTimerStatus('Paused');
}
function resetTimer() {
  clearInterval(timerInterval);
  timerRunning  = false;
  timerSeconds  = 0;
  updateTimerDisplay();
  setTimerStatus('Ready');
}
function updateTimerDisplay() {
  const h = Math.floor(timerSeconds / 3600);
  const m = Math.floor((timerSeconds % 3600) / 60);
  const s = timerSeconds % 60;
  const el = document.getElementById('timerDisplay');
  if (el) el.textContent = `${fmt2(h)}:${fmt2(m)}:${fmt2(s)}`;
}
function setTimerStatus(msg) {
  const el = document.getElementById('timerStatus');
  if (el) el.textContent = msg;
}

/* SYLLABUS PAGE */
function initSyllabus() {
  if (!document.getElementById('syllabusForm')) return;
  renderSyllabus();
  document.getElementById('syllabusForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const subject = this.sylSubject.value.trim();
    const topics  = this.sylTopics.value.trim();
    if (!subject || !topics) { showToast('Enter subject and topics', '#ff6eb4'); return; }
    const topicList = topics.split(',').map(t => t.trim()).filter(Boolean);
    const subs = getLS('syllabus');
    subs.push({ id: Date.now(), subject, topics: topicList.map(t => ({ text: t, done: false })) });
    setLS('syllabus', subs);
    this.reset();
    renderSyllabus();
    showToast('Subject added!');
  });
}
function toggleTopic(subId, topicIdx) {
  const subs = getLS('syllabus');
  const sub  = subs.find(s => s.id === subId);
  if (sub && sub.topics[topicIdx]) sub.topics[topicIdx].done = !sub.topics[topicIdx].done;
  setLS('syllabus', subs);
  renderSyllabus();
}
function renderSyllabus() {
  const container = document.getElementById('syllabusList');
  if (!container) return;
  const subs = getLS('syllabus');
  if (!subs.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📖</div><p>No subjects yet!</p></div>`;
    return;
  }
  container.innerHTML = subs.map(sub => {
    const done  = sub.topics.filter(t => t.done).length;
    const total = sub.topics.length;
    const pct   = total ? Math.round(done / total * 100) : 0;
    return `
    <div class="subject-block">
      <h4>
        📚 ${escHtml(sub.subject)}
        <span style="font-size:12px;font-weight:400;color:rgba(255,255,255,0.4);margin-left:4px;">${done}/${total} done</span>
        <div class="subject-progress" title="${pct}%">
          <div class="subject-progress-fill" style="width:${pct}%"></div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteEntry('syllabus',${sub.id},renderSyllabus)" style="margin-left:8px;">✕</button>
      </h4>
      ${sub.topics.map((t, i) => `
        <div class="topic-item">
          <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTopic(${sub.id},${i})"/>
          <span class="${t.done ? 'topic-done' : ''}">${escHtml(t.text)}</span>
        </div>`).join('')}
    </div>`;
  }).join('');
}

/* PROJECTS PAGE */
function initProjects() {
  if (!document.getElementById('projectForm')) return;
  renderProjects();
  document.getElementById('projectForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name   = this.projName.value.trim();
    const desc   = this.projDesc.value.trim();
    const status = this.projStatus.value;
    if (!name) { showToast('Enter project name', '#ff6eb4'); return; }
    const projects = getLS('projects');
    projects.push({ id: Date.now(), name, desc, status, date: new Date().toLocaleDateString() });
    setLS('projects', projects);
    this.reset();
    renderProjects();
    showToast('Project added!');
  });
}
function renderProjects() {
  const list = document.getElementById('projectList');
  if (!list) return;
  const projects = getLS('projects');
  if (!projects.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🚀</div><p>No projects yet!</p></div>`;
    return;
  }
  const statusColor = { 'Planning':'#fbbf24', 'In Progress':'#4a9eff', 'Completed':'#6ee7b7', 'On Hold':'#ff6b6b' };
  list.innerHTML = [...projects].reverse().map(p => `
    <div class="project-card">
      <h4>${escHtml(p.name)}</h4>
      ${p.desc ? `<p>${escHtml(p.desc)}</p>` : ''}
      <div class="project-footer">
        <span class="project-tag" style="color:${statusColor[p.status]||'#4a9eff'};background:${statusColor[p.status]||'#4a9eff'}22;">${p.status}</span>
        <span style="font-size:11px;color:rgba(255,255,255,0.35);">${p.date}</span>
        <button class="btn btn-danger btn-sm" onclick="deleteEntry('projects',${p.id},renderProjects)">✕ Delete</button>
      </div>
    </div>`).join('');
}

/* SHARED HELPERS */
function deleteEntry(key, id, cb) {
  if (!confirm('Delete this item?')) return;
  const items = getLS(key).filter(x => x.id !== id);
  setLS(key, items);
  cb();
  showToast('Deleted', 'rgba(255,80,80,0.9)');
}


   //AUTO INIT
   
document.addEventListener('DOMContentLoaded', function() {
  initProfile();
  initTimetable();
  initTasks();
  initNotes();
  initMoney();
  initTimer();
  initSyllabus();
  initProjects();
});