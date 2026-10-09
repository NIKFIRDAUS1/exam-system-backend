
const currentUser = requireAuth(['admin']);
if (currentUser) {
  renderUserBadge();
}

let state = {
  users: [],
  courses: [],
  venues: [],
  exams: [],
  registrations: [],
  results: [],
  notifications: [],
  lecturers: [],
  students: []
};

let activeGradeFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await loadAllInitialData();
  switchSection('overview');
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

async function loadAllInitialData() {
  try {
    const [
      usersRes, coursesRes, venuesRes, examsRes, 
      regsRes, resultsRes, notifsRes, lecsRes, studsRes
    ] = await Promise.all([
      apiRequest('users.php?limit=100'),
      apiRequest('courses.php?limit=100'),
      apiRequest('venues.php?limit=100'),
      apiRequest('examinations.php?limit=100'),
      apiRequest('registrations.php?limit=100'),
      apiRequest('results.php?limit=100'),
      apiRequest('notifications.php?limit=100'),
      apiRequest('lecturers.php'),
      apiRequest('student-options.php')
    ]);

    state.users = usersRes.data || [];
    state.courses = coursesRes.data || [];
    state.venues = venuesRes.data || [];
    state.exams = examsRes.data || [];
    state.registrations = regsRes.data || [];
    state.results = resultsRes.data || [];
    state.notifications = notifsRes.data || [];
    state.lecturers = lecsRes.data || [];
    state.students = studsRes.data || [];

    renderOverview();
    renderUsers(state.users);
    renderCourses(state.courses);
    renderVenues(state.venues);
    renderExams(state.exams);
    renderRegistrations(state.registrations);
    renderResults(state.results);
    renderNotifications(state.notifications);

    populateDropdowns();

  } catch (err) {
    showToast('Failed to load system data: ' + err.message, 'error');
  }
}

function populateDropdowns() {
  const courseLecFilter = document.getElementById('course-lecturer-filter');
  const courseLecSelect = document.getElementById('course-lecturer');
  if (courseLecFilter && courseLecSelect) {
    let opts = '<option value="">All Lecturers</option>';
    let formOpts = '<option value="">Select lecturer...</option>';
    state.lecturers.forEach(l => {
      opts += `<option value="${l.user_id}">${escapeHtml(l.full_name)}</option>`;
      formOpts += `<option value="${l.user_id}">${escapeHtml(l.full_name)}</option>`;
    });
    courseLecFilter.innerHTML = opts;
    courseLecSelect.innerHTML = formOpts;
  }

  const examVenueFilter = document.getElementById('exam-venue-filter');
  const examVenueSelect = document.getElementById('exam-venue');
  if (examVenueFilter && examVenueSelect) {
    let opts = '<option value="">All Venues</option>';
    let formOpts = '<option value="">Select venue...</option>';
    state.venues.forEach(v => {
      opts += `<option value="${v.venue_name}">${escapeHtml(v.venue_name)}</option>`;
      formOpts += `<option value="${v.venue_id}">${escapeHtml(v.venue_name)} (${v.capacity} Seats)</option>`;
    });
    examVenueFilter.innerHTML = opts;
    examVenueSelect.innerHTML = formOpts;
  }

  const examCourseSelect = document.getElementById('exam-course');
  if (examCourseSelect) {
    let opts = '<option value="">Select course...</option>';
    state.courses.forEach(c => {
      opts += `<option value="${c.course_id}">${escapeHtml(c.course_code)} - ${escapeHtml(c.course_name)}</option>`;
    });
    examCourseSelect.innerHTML = opts;
  }

  const regStudentSelect = document.getElementById('reg-student');
  const regCourseSelect = document.getElementById('reg-course');
  if (regStudentSelect && regCourseSelect) {
    let sOpts = '<option value="">Select student...</option>';
    state.students.forEach(s => {
      sOpts += `<option value="${s.user_id}">${escapeHtml(s.full_name)}</option>`;
    });
    regStudentSelect.innerHTML = sOpts;

    let cOpts = '<option value="">Select course...</option>';
    state.courses.forEach(c => {
      cOpts += `<option value="${c.course_id}">${escapeHtml(c.course_code)} - ${escapeHtml(c.course_name)}</option>`;
    });
    regCourseSelect.innerHTML = cOpts;
  }

  const resStudentSelect = document.getElementById('result-student');
  const resExamSelect = document.getElementById('result-exam');
  if (resStudentSelect && resExamSelect) {
    let sOpts = '<option value="">Select student...</option>';
    state.students.forEach(s => {
      sOpts += `<option value="${s.user_id}">${escapeHtml(s.full_name)}</option>`;
    });
    resStudentSelect.innerHTML = sOpts;

    let eOpts = '<option value="">Select exam...</option>';
    state.exams.forEach(e => {
      eOpts += `<option value="${e.exam_id}">${escapeHtml(e.course_code)} (${escapeHtml(e.exam_date)})</option>`;
    });
    resExamSelect.innerHTML = eOpts;
  }

  const notifUserSelect = document.getElementById('notif-user');
  if (notifUserSelect) {
    let uOpts = '<option value="">Select recipient...</option>';
    state.users.forEach(u => {
      uOpts += `<option value="${u.user_id}">${escapeHtml(u.full_name)} (${u.role})</option>`;
    });
    notifUserSelect.innerHTML = uOpts;
  }
}

function renderOverview() {
  document.getElementById('stat-users').textContent = state.users.length;
  document.getElementById('stat-courses').textContent = state.courses.length;
  document.getElementById('stat-exams').textContent = state.exams.length;
  document.getElementById('stat-venues').textContent = state.venues.length;

  const tbody = document.getElementById('overview-exam-table');
  if (!state.exams.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty-row">No upcoming examinations scheduled.</td></tr>';
    return;
  }

  tbody.innerHTML = state.exams.slice(0, 5).map(e => `
    <tr>
      <td><strong>${escapeHtml(e.course_code)}</strong></td>
      <td>${escapeHtml(e.course_name)}</td>
      <td>${escapeHtml(e.venue_name)}</td>
      <td>${escapeHtml(e.exam_date)}</td>
      <td>${escapeHtml(e.exam_time)}</td>
    </tr>
  `).join('');
}

function filterUsers() {
  const query = document.getElementById('user-search').value.toLowerCase().trim();
  const role = document.getElementById('user-role-filter').value;

  const filtered = state.users.filter(u => {
    const matchesSearch = !query || 
      u.full_name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query);
    const matchesRole = !role || u.role === role;
    return matchesSearch && matchesRole;
  });

  renderUsers(filtered);
}

function renderUsers(usersList) {
  const tbody = document.getElementById('users-table-body');
  document.getElementById('user-count').textContent = `${usersList.length} of ${state.users.length} records`;

  if (!usersList.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row">No user records matching the filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = usersList.map(u => `
    <tr>
      <td style="color: var(--neutral-500);">${u.user_id}</td>
      <td><strong>${escapeHtml(u.full_name)}</strong></td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="badge-tag tag-${u.role}">${u.role.toUpperCase()}</span></td>
      <td style="color: var(--neutral-500); font-size: 12px;">${u.created_at ? u.created_at.split(' ')[0] : '-'}</td>
      <td style="text-align: right;">
        <button class="btn-academic secondary sm" onclick="openEditUserModal(${u.user_id})">Edit</button>
        <button class="btn-academic danger sm" onclick="deleteUser(${u.user_id}, '${escapeHtml(u.full_name)}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openAddUserModal() {
  document.getElementById('modal-user-title').textContent = 'New User Account';
  document.getElementById('user-id').value = '';
  document.getElementById('user-full-name').value = '';
  document.getElementById('user-email').value = '';
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').required = true;
  document.getElementById('user-password-hint').style.display = 'none';
  document.getElementById('user-role').value = 'student';
  openModal('modal-user');
}

function openEditUserModal(id) {
  const user = state.users.find(u => u.user_id === id);
  if (!user) return;

  document.getElementById('modal-user-title').textContent = 'Edit User Account';
  document.getElementById('user-id').value = user.user_id;
  document.getElementById('user-full-name').value = user.full_name;
  document.getElementById('user-email').value = user.email;
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').required = false;
  document.getElementById('user-password-hint').style.display = 'block';
  document.getElementById('user-role').value = user.role;
  openModal('modal-user');
}

async function handleUserSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('user-id').value;
  const full_name = document.getElementById('user-full-name').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const password = document.getElementById('user-password').value;
  const role = document.getElementById('user-role').value;

  try {
    if (id) {
      const body = { user_id: parseInt(id), full_name, email, role };
      if (password) body.password = password;
      await apiRequest('users.php', { method: 'PUT', body });
      showToast('User record updated successfully', 'success');
    } else {
      await apiRequest('users.php', { method: 'POST', body: { full_name, email, password, role } });
      showToast('User account created', 'success');
    }

    closeModal('modal-user');
    const res = await apiRequest('users.php?limit=100');
    state.users = res.data || [];
    filterUsers();
    renderOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteUser(id, name) {
  if (!confirm(`Are you sure you want to delete user "${name}"?`)) return;

  try {
    await apiRequest('users.php', { method: 'DELETE', body: { user_id: id } });
    showToast('User account deleted', 'success');
    state.users = state.users.filter(u => u.user_id !== id);
    filterUsers();
    renderOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function filterCourses() {
  const query = document.getElementById('course-search').value.toLowerCase().trim();
  const lecId = document.getElementById('course-lecturer-filter').value;

  const filtered = state.courses.filter(c => {
    const matchesSearch = !query || 
      c.course_code.toLowerCase().includes(query) || 
      c.course_name.toLowerCase().includes(query);
    const matchesLec = !lecId || String(c.lecturer_id) === String(lecId);
    return matchesSearch && matchesLec;
  });

  renderCourses(filtered);
}

function renderCourses(list) {
  const tbody = document.getElementById('courses-table-body');
  document.getElementById('course-count').textContent = `${list.length} of ${state.courses.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty-row">No courses found matching filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr>
      <td style="color: var(--neutral-500);">${c.course_id}</td>
      <td><strong>${escapeHtml(c.course_code)}</strong></td>
      <td>${escapeHtml(c.course_name)}</td>
      <td>${escapeHtml(c.lecturer || 'Unassigned')}</td>
      <td style="text-align: right;">
        <button class="btn-academic secondary sm" onclick="openEditCourseModal(${c.course_id})">Edit</button>
        <button class="btn-academic danger sm" onclick="deleteCourse(${c.course_id}, '${escapeHtml(c.course_code)}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openAddCourseModal() {
  document.getElementById('modal-course-title').textContent = 'New Academic Course';
  document.getElementById('course-id').value = '';
  document.getElementById('course-code').value = '';
  document.getElementById('course-name').value = '';
  document.getElementById('course-lecturer').value = '';
  openModal('modal-course');
}

function openEditCourseModal(id) {
  const c = state.courses.find(item => item.course_id === id);
  if (!c) return;
  document.getElementById('modal-course-title').textContent = 'Edit Course Record';
  document.getElementById('course-id').value = c.course_id;
  document.getElementById('course-code').value = c.course_code;
  document.getElementById('course-name').value = c.course_name;
  document.getElementById('course-lecturer').value = c.lecturer_id;
  openModal('modal-course');
}

async function handleCourseSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('course-id').value;
  const course_code = document.getElementById('course-code').value.trim();
  const course_name = document.getElementById('course-name').value.trim();
  const lecturer_id = parseInt(document.getElementById('course-lecturer').value);

  try {
    if (id) {
      await apiRequest('courses.php', { method: 'PUT', body: { course_id: parseInt(id), course_code, course_name, lecturer_id } });
      showToast('Course record updated', 'success');
    } else {
      await apiRequest('courses.php', { method: 'POST', body: { course_code, course_name, lecturer_id } });
      showToast('Course added to registry', 'success');
    }
    closeModal('modal-course');
    const res = await apiRequest('courses.php?limit=100');
    state.courses = res.data || [];
    filterCourses();
    renderOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteCourse(id, code) {
  if (!confirm(`Delete course ${code}? All linked exams and registrations will also be removed.`)) return;
  try {
    await apiRequest('courses.php', { method: 'DELETE', body: { course_id: id } });
    showToast('Course deleted', 'success');
    state.courses = state.courses.filter(c => c.course_id !== id);
    filterCourses();
    renderOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function filterVenues() {
  const q = document.getElementById('venue-search').value.toLowerCase().trim();
  const filtered = state.venues.filter(v => !q || v.venue_name.toLowerCase().includes(q));
  renderVenues(filtered);
}

function renderVenues(list) {
  const tbody = document.getElementById('venues-table-body');
  document.getElementById('venue-count').textContent = `${list.length} of ${state.venues.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty-row">No venues recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(v => `
    <tr>
      <td style="color: var(--neutral-500);">${v.venue_id}</td>
      <td><strong>${escapeHtml(v.venue_name)}</strong></td>
      <td>${v.capacity} Seats</td>
      <td style="text-align: right;">
        <button class="btn-academic secondary sm" onclick="openEditVenueModal(${v.venue_id})">Edit</button>
        <button class="btn-academic danger sm" onclick="deleteVenue(${v.venue_id}, '${escapeHtml(v.venue_name)}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openAddVenueModal() {
  document.getElementById('modal-venue-title').textContent = 'New Examination Venue';
  document.getElementById('venue-id').value = '';
  document.getElementById('venue-name').value = '';
  document.getElementById('venue-capacity').value = '';
  openModal('modal-venue');
}

function openEditVenueModal(id) {
  const v = state.venues.find(item => item.venue_id === id);
  if (!v) return;
  document.getElementById('modal-venue-title').textContent = 'Edit Venue Record';
  document.getElementById('venue-id').value = v.venue_id;
  document.getElementById('venue-name').value = v.venue_name;
  document.getElementById('venue-capacity').value = v.capacity;
  openModal('modal-venue');
}

async function handleVenueSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('venue-id').value;
  const venue_name = document.getElementById('venue-name').value.trim();
  const capacity = parseInt(document.getElementById('venue-capacity').value);

  try {
    if (id) {
      await apiRequest('venues.php', { method: 'PUT', body: { venue_id: parseInt(id), venue_name, capacity } });
      showToast('Venue updated', 'success');
    } else {
      await apiRequest('venues.php', { method: 'POST', body: { venue_name, capacity } });
      showToast('Venue added to registry', 'success');
    }
    closeModal('modal-venue');
    const res = await apiRequest('venues.php?limit=100');
    state.venues = res.data || [];
    filterVenues();
    populateDropdowns();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteVenue(id, name) {
  if (!confirm(`Delete venue "${name}"?`)) return;
  try {
    await apiRequest('venues.php', { method: 'DELETE', body: { venue_id: id } });
    showToast('Venue deleted', 'success');
    state.venues = state.venues.filter(v => v.venue_id !== id);
    filterVenues();
    populateDropdowns();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function filterExams() {
  const q = document.getElementById('exam-search').value.toLowerCase().trim();
  const vName = document.getElementById('exam-venue-filter').value;

  const filtered = state.exams.filter(e => {
    const matchesSearch = !q || 
      e.course_code.toLowerCase().includes(q) || 
      e.course_name.toLowerCase().includes(q) || 
      e.venue_name.toLowerCase().includes(q);
    const matchesVenue = !vName || e.venue_name === vName;
    return matchesSearch && matchesVenue;
  });

  renderExams(filtered);
}

function renderExams(list) {
  const tbody = document.getElementById('exams-table-body');
  document.getElementById('exam-count').textContent = `${list.length} of ${state.exams.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row">No examination sessions found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr>
      <td style="color: var(--neutral-500);">${e.exam_id}</td>
      <td>
        <strong>${escapeHtml(e.course_code)}</strong> - ${escapeHtml(e.course_name)}
      </td>
      <td>${escapeHtml(e.venue_name)}</td>
      <td>${escapeHtml(e.exam_date)}</td>
      <td>${escapeHtml(e.exam_time)}</td>
      <td style="text-align: right;">
        <button class="btn-academic secondary sm" onclick="openEditExamModal(${e.exam_id})">Edit</button>
        <button class="btn-academic danger sm" onclick="deleteExam(${e.exam_id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openAddExamModal() {
  document.getElementById('modal-exam-title').textContent = 'Schedule Examination Session';
  document.getElementById('exam-id').value = '';
  document.getElementById('exam-course').value = '';
  document.getElementById('exam-venue').value = '';
  document.getElementById('exam-date').value = '';
  document.getElementById('exam-time').value = '';
  openModal('modal-exam');
}

function openEditExamModal(id) {
  const e = state.exams.find(item => item.exam_id === id);
  if (!e) return;
  document.getElementById('modal-exam-title').textContent = 'Edit Examination Session';
  document.getElementById('exam-id').value = e.exam_id;
  document.getElementById('exam-course').value = e.course_id;
  document.getElementById('exam-venue').value = e.venue_id;
  document.getElementById('exam-date').value = e.exam_date;
  document.getElementById('exam-time').value = e.exam_time;
  openModal('modal-exam');
}

async function handleExamSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('exam-id').value;
  const course_id = parseInt(document.getElementById('exam-course').value);
  const venue_id = parseInt(document.getElementById('exam-venue').value);
  const exam_date = document.getElementById('exam-date').value;
  const exam_time = document.getElementById('exam-time').value;

  try {
    if (id) {
      await apiRequest('examinations.php', { method: 'PUT', body: { exam_id: parseInt(id), course_id, venue_id, exam_date, exam_time } });
      showToast('Examination schedule updated', 'success');
    } else {
      await apiRequest('examinations.php', { method: 'POST', body: { course_id, venue_id, exam_date, exam_time } });
      showToast('Examination session scheduled', 'success');
    }
    closeModal('modal-exam');
    const res = await apiRequest('examinations.php?limit=100');
    state.exams = res.data || [];
    filterExams();
    renderOverview();
    populateDropdowns();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteExam(id) {
  if (!confirm(`Delete this examination schedule?`)) return;
  try {
    await apiRequest('examinations.php', { method: 'DELETE', body: { exam_id: id } });
    showToast('Examination removed', 'success');
    state.exams = state.exams.filter(e => e.exam_id !== id);
    filterExams();
    renderOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function filterRegistrations() {
  const q = document.getElementById('registration-search').value.toLowerCase().trim();
  const filtered = state.registrations.filter(r => {
    return !q || 
      (r.student_name && r.student_name.toLowerCase().includes(q)) || 
      (r.course_code && r.course_code.toLowerCase().includes(q)) || 
      (r.course_name && r.course_name.toLowerCase().includes(q));
  });
  renderRegistrations(filtered);
}

function renderRegistrations(list) {
  const tbody = document.getElementById('registrations-table-body');
  document.getElementById('registration-count').textContent = `${list.length} of ${state.registrations.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty-row">No enrollment records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr>
      <td style="color: var(--neutral-500);">${r.registration_id}</td>
      <td><strong>${escapeHtml(r.student_name)}</strong></td>
      <td><strong>${escapeHtml(r.course_code)}</strong></td>
      <td>${escapeHtml(r.course_name)}</td>
      <td style="text-align: right;">
        <button class="btn-academic danger sm" onclick="deleteRegistration(${r.registration_id})">Unenroll</button>
      </td>
    </tr>
  `).join('');
}

function openAddRegistrationModal() {
  document.getElementById('reg-student').value = '';
  document.getElementById('reg-course').value = '';
  openModal('modal-registration');
}

async function handleRegistrationSubmit(e) {
  e.preventDefault();
  const student_id = parseInt(document.getElementById('reg-student').value);
  const course_id = parseInt(document.getElementById('reg-course').value);

  try {
    await apiRequest('registrations.php', { method: 'POST', body: { student_id, course_id } });
    showToast('Student enrolled successfully', 'success');
    closeModal('modal-registration');
    const res = await apiRequest('registrations.php?limit=100');
    state.registrations = res.data || [];
    filterRegistrations();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteRegistration(id) {
  if (!confirm('Remove this course enrollment record?')) return;
  try {
    await apiRequest('registrations.php', { method: 'DELETE', body: { registration_id: id } });
    showToast('Enrollment removed', 'success');
    state.registrations = state.registrations.filter(r => r.registration_id !== id);
    filterRegistrations();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function setGradeFilter(prefix, btn) {
  activeGradeFilter = prefix;
  document.querySelectorAll('.filter-button-group .filter-btn-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterResults();
}

function filterResults() {
  const q = document.getElementById('result-search').value.toLowerCase().trim();

  const filtered = state.results.filter(r => {
    const matchesSearch = !q || 
      (r.student_name && r.student_name.toLowerCase().includes(q)) || 
      (r.course_name && r.course_name.toLowerCase().includes(q)) || 
      (r.course_code && r.course_code.toLowerCase().includes(q));

    let matchesGrade = true;
    if (activeGradeFilter) {
      matchesGrade = r.grade && r.grade.startsWith(activeGradeFilter);
    }

    return matchesSearch && matchesGrade;
  });

  renderResults(filtered);
}

function renderResults(list) {
  const tbody = document.getElementById('results-table-body');
  document.getElementById('result-count').textContent = `${list.length} of ${state.results.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row">No grade records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => {
    const gradeLetter = r.grade ? r.grade.charAt(0) : 'F';
    return `
      <tr>
        <td style="color: var(--neutral-500);">${r.result_id}</td>
        <td><strong>${escapeHtml(r.student_name)}</strong></td>
        <td>${escapeHtml(r.course_code)} - ${escapeHtml(r.course_name)}</td>
        <td><strong>${parseFloat(r.marks).toFixed(1)}</strong></td>
        <td><span class="grade-box ${gradeLetter}">${r.grade}</span></td>
        <td style="text-align: right;">
          <button class="btn-academic secondary sm" onclick="openEditResultModal(${r.result_id})">Edit</button>
          <button class="btn-academic danger sm" onclick="deleteResult(${r.result_id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddResultModal() {
  document.getElementById('modal-result-title').textContent = 'Record Examination Mark';
  document.getElementById('result-id').value = '';
  document.getElementById('result-student-group').style.display = 'block';
  document.getElementById('result-exam-group').style.display = 'block';

  const studentSelect = document.getElementById('result-student');
  const examSelect = document.getElementById('result-exam');
  studentSelect.disabled = false;
  studentSelect.required = true;
  studentSelect.value = '';
  examSelect.disabled = false;
  examSelect.required = true;
  examSelect.value = '';

  document.getElementById('result-marks').value = '';
  openModal('modal-result');
}

function openEditResultModal(id) {
  const r = state.results.find(item => item.result_id === id);
  if (!r) return;
  document.getElementById('modal-result-title').textContent = `Edit Result - ${r.student_name}`;
  document.getElementById('result-id').value = r.result_id;
  document.getElementById('result-student-group').style.display = 'none';
  document.getElementById('result-exam-group').style.display = 'none';

  const studentSelect = document.getElementById('result-student');
  const examSelect = document.getElementById('result-exam');
  studentSelect.required = false;
  studentSelect.disabled = true;
  studentSelect.value = r.student_id;
  examSelect.required = false;
  examSelect.disabled = true;
  examSelect.value = r.exam_id;

  document.getElementById('result-marks').value = r.marks;
  openModal('modal-result');
}

async function handleResultSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('result-id').value;
  const marksVal = document.getElementById('result-marks').value;
  const marks = parseFloat(marksVal);

  if (isNaN(marks) || marks < 0 || marks > 100) {
    showToast('Marks must be a valid number between 0 and 100', 'error');
    return;
  }

  try {
    if (id) {
      const existing = state.results.find(r => r.result_id === parseInt(id));
      const student_id = existing ? parseInt(existing.student_id) : parseInt(document.getElementById('result-student').value);
      const exam_id = existing ? parseInt(existing.exam_id) : parseInt(document.getElementById('result-exam').value);

      if (!student_id || !exam_id) {
        showToast('Invalid student or exam session for this mark record', 'error');
        return;
      }

      await apiRequest('results.php', { 
        method: 'PUT', 
        body: { result_id: parseInt(id), student_id, exam_id, marks } 
      });
      showToast('Mark record updated successfully', 'success');
    } else {
      const student_id = parseInt(document.getElementById('result-student').value);
      const exam_id = parseInt(document.getElementById('result-exam').value);

      if (!student_id || !exam_id) {
        showToast('Please select both a student and an examination session', 'error');
        return;
      }

      await apiRequest('results.php', { method: 'POST', body: { student_id, exam_id, marks } });
      showToast('Mark recorded successfully', 'success');
    }
    closeModal('modal-result');
    const res = await apiRequest('results.php?limit=100');
    state.results = res.data || [];
    filterResults();
    renderOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteResult(id) {
  if (!confirm('Delete this examination result record?')) return;
  try {
    await apiRequest('results.php', { method: 'DELETE', body: { result_id: id } });
    showToast('Result deleted', 'success');
    state.results = state.results.filter(r => r.result_id !== id);
    filterResults();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function filterNotifications() {
  const q = document.getElementById('notification-search').value.toLowerCase().trim();
  const filtered = state.notifications.filter(n => {
    return !q || 
      (n.message && n.message.toLowerCase().includes(q)) || 
      (n.full_name && n.full_name.toLowerCase().includes(q));
  });
  renderNotifications(filtered);
}

function renderNotifications(list) {
  const tbody = document.getElementById('notifications-table-body');
  document.getElementById('notification-count').textContent = `${list.length} of ${state.notifications.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty-row">No notifications recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(n => `
    <tr>
      <td style="color: var(--neutral-500);">${n.notification_id}</td>
      <td><strong>${escapeHtml(n.full_name || 'All Users')}</strong></td>
      <td>${escapeHtml(n.message)}</td>
      <td style="color: var(--neutral-500); font-size: 12px;">${n.created_at || '-'}</td>
      <td style="text-align: right;">
        <button class="btn-academic danger sm" onclick="deleteNotification(${n.notification_id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openAddNotificationModal() {
  document.getElementById('notif-user').value = '';
  document.getElementById('notif-message').value = '';
  openModal('modal-notification');
}

async function handleNotificationSubmit(e) {
  e.preventDefault();
  const user_id = parseInt(document.getElementById('notif-user').value);
  const message = document.getElementById('notif-message').value.trim();

  try {
    await apiRequest('notifications.php', { method: 'POST', body: { user_id, message } });
    showToast('Notification dispatched', 'success');
    closeModal('modal-notification');
    const res = await apiRequest('notifications.php?limit=100');
    state.notifications = res.data || [];
    filterNotifications();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteNotification(id) {
  if (!confirm('Delete this notification?')) return;
  try {
    await apiRequest('notifications.php', { method: 'DELETE', body: { notification_id: id } });
    showToast('Notification removed', 'success');
    state.notifications = state.notifications.filter(n => n.notification_id !== id);
    filterNotifications();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}
