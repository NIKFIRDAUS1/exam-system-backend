
const currentUser = requireAuth(['student', 'admin']);
if (currentUser) {
  renderUserBadge();
  const slipName = document.getElementById('slip-student-name');
  if (slipName) slipName.textContent = currentUser.name || currentUser.full_name || 'Student';
}

let state = {
  courses: [],
  exams: [],
  results: [],
  notifications: []
};

let timeFilter = 'all';
let activeGradeFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await loadStudentData();
});

function setupNavigation() {
  document.querySelectorAll('.sidebar-menu button').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      switchSection(section);
    });
  });
}

function switchSection(sectionName) {
  document.querySelectorAll('.sidebar-menu button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-section') === sectionName);
  });

  document.querySelectorAll('.content-section').forEach(sec => {
    sec.style.display = 'none';
  });

  const activeSec = document.getElementById(`section-${sectionName}`);
  if (activeSec) {
    activeSec.style.display = 'block';
  }
}

async function loadStudentData() {
  try {
    const [regRes, examRes, resRes, notifRes] = await Promise.all([
      apiRequest('registrations.php?limit=100'),
      apiRequest('examinations.php?limit=100'),
      apiRequest('results.php?limit=100'),
      apiRequest('notifications.php?limit=100')
    ]);

    state.courses = regRes.data || [];
    state.exams = examRes.data || [];
    state.results = resRes.data || [];
    state.notifications = notifRes.data || [];

    calculateStats();
    renderTimetable();
    renderResults();
    renderCourses();
    renderNotifications();

  } catch (err) {
    showToast('Failed to load student academic records: ' + err.message, 'error');
  }
}

function calculateStats() {
  document.getElementById('stat-my-courses').textContent = state.courses.length;
  document.getElementById('stat-my-exams').textContent = state.exams.length;

  if (state.results.length > 0) {
    const totalMarks = state.results.reduce((acc, curr) => acc + parseFloat(curr.marks || 0), 0);
    const avg = (totalMarks / state.results.length).toFixed(1);
    document.getElementById('stat-avg-marks').textContent = `${avg}%`;
  } else {
    document.getElementById('stat-avg-marks').textContent = 'N/A';
  }
}

function setTimeFilter(filterType) {
  timeFilter = filterType;
  document.getElementById('chip-time-all').classList.toggle('active', filterType === 'all');
  document.getElementById('chip-time-upcoming').classList.toggle('active', filterType === 'upcoming');
  document.getElementById('chip-time-past').classList.toggle('active', filterType === 'past');
  filterTimetable();
}

function filterTimetable() {
  const q = document.getElementById('timetable-search').value.toLowerCase().trim();
  const today = new Date().toISOString().split('T')[0];

  const filtered = state.exams.filter(e => {
    const matchesSearch = !q || 
      e.course_code.toLowerCase().includes(q) || 
      e.course_name.toLowerCase().includes(q) || 
      e.venue_name.toLowerCase().includes(q);

    let matchesTime = true;
    if (timeFilter === 'upcoming') {
      matchesTime = e.exam_date >= today;
    } else if (timeFilter === 'past') {
      matchesTime = e.exam_date < today;
    }

    return matchesSearch && matchesTime;
  });

  renderTimetable(filtered);
}

function renderTimetable(list = state.exams) {
  const tbody = document.getElementById('timetable-table-body');
  document.getElementById('timetable-count').textContent = `${list.length} of ${state.exams.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row">No examination sessions found matching criteria.</td></tr>`;
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  tbody.innerHTML = list.map(e => {
    const isUpcoming = e.exam_date >= today;
    const statusBadge = isUpcoming
      ? '<span class="badge-tag tag-upcoming">Upcoming</span>'
      : '<span class="badge-tag tag-concluded">Concluded</span>';

    return `
      <tr>
        <td><strong>${escapeHtml(e.course_code)}</strong></td>
        <td>${escapeHtml(e.course_name)}</td>
        <td>${escapeHtml(e.venue_name)}</td>
        <td>${escapeHtml(e.exam_date)}</td>
        <td>${escapeHtml(e.exam_time)}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

function setGradeFilter(prefix, btn) {
  activeGradeFilter = prefix;
  document.querySelectorAll('#section-results .filter-btn-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterResults();
}

function filterResults() {
  const q = document.getElementById('result-search').value.toLowerCase().trim();

  const filtered = state.results.filter(r => {
    const matchesSearch = !q || 
      (r.course_code && r.course_code.toLowerCase().includes(q)) || 
      (r.course_name && r.course_name.toLowerCase().includes(q));

    let matchesGrade = true;
    if (activeGradeFilter) {
      matchesGrade = r.grade && r.grade.startsWith(activeGradeFilter);
    }

    return matchesSearch && matchesGrade;
  });

  renderResults(filtered);
}

function renderResults(list = state.results) {
  const tbody = document.getElementById('results-table-body');
  document.getElementById('results-count').textContent = `${list.length} of ${state.results.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty-row">No verified examination results recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => {
    const gradeLetter = r.grade ? r.grade.charAt(0) : 'F';
    const isPass = r.grade !== 'F';
    const statusBadge = isPass 
      ? '<span class="badge-tag tag-pass">PASSED</span>'
      : '<span class="badge-tag tag-fail">FAILED</span>';

    return `
      <tr>
        <td><strong>${escapeHtml(r.course_code)}</strong></td>
        <td>${escapeHtml(r.course_name)}</td>
        <td><strong>${parseFloat(r.marks).toFixed(1)}</strong></td>
        <td><span class="grade-box ${gradeLetter}">${r.grade}</span></td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

function filterCourses() {
  const q = document.getElementById('course-search').value.toLowerCase().trim();
  const filtered = state.courses.filter(c => {
    return !q || 
      (c.course_code && c.course_code.toLowerCase().includes(q)) || 
      (c.course_name && c.course_name.toLowerCase().includes(q));
  });
  renderCourses(filtered);
}

function renderCourses(list = state.courses) {
  const tbody = document.getElementById('courses-table-body');
  document.getElementById('courses-count').textContent = `${list.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty-row">No approved course enrollments found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr>
      <td style="color: var(--neutral-500);">${c.registration_id}</td>
      <td><strong>${escapeHtml(c.course_code)}</strong></td>
      <td>${escapeHtml(c.course_name)}</td>
      <td><span class="badge-tag tag-pass">Approved</span></td>
    </tr>
  `).join('');
}

function filterNotifications() {
  const q = document.getElementById('notif-search').value.toLowerCase().trim();
  const filtered = state.notifications.filter(n => {
    return !q || (n.message && n.message.toLowerCase().includes(q));
  });
  renderNotifications(filtered);
}

function renderNotifications(list = state.notifications) {
  const tbody = document.getElementById('notifications-table-body');
  document.getElementById('notif-count').textContent = `${list.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="2" class="table-empty-row">No notices in your academic inbox.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(n => `
    <tr>
      <td>
        <div style="font-weight: 500; color: var(--neutral-800);">${escapeHtml(n.message)}</div>
      </td>
      <td style="color: var(--neutral-500); font-size: 12px; white-space: nowrap;">
        ${n.created_at || '-'}
      </td>
    </tr>
  `).join('');
}
