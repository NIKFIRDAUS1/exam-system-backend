
const currentUser = requireAuth(['lecturer', 'admin']);
if (currentUser) {
  renderUserBadge();
}

let state = {
  courses: [],
  exams: [],
  results: [],
  students: [],
  venues: []
};

let courseScope = 'my';
let activeGradeFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await loadLecturerData();
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

async function loadLecturerData() {
  try {
    const [cRes, eRes, rRes, sRes, vRes] = await Promise.all([
      apiRequest('courses.php?limit=100'),
      apiRequest('examinations.php?limit=100'),
      apiRequest('results.php?limit=100'),
      apiRequest('student-options.php'),
      apiRequest('venue-options.php')
    ]);

    state.courses = cRes.data || [];
    state.exams = eRes.data || [];
    state.results = rRes.data || [];
    state.students = sRes.data || [];
    state.venues = vRes.data || [];

    renderCourses();
    renderExams(state.exams);
    renderGrades(state.results);
    populateDropdowns();

  } catch (err) {
    showToast('Failed to load faculty data: ' + err.message, 'error');
  }
}

function populateDropdowns() {
  const vFilter = document.getElementById('exam-venue-filter');
  if (vFilter) {
    let opts = '<option value="">All Venues</option>';
    state.venues.forEach(v => {
      opts += `<option value="${v.venue_name}">${escapeHtml(v.venue_name)}</option>`;
    });
    vFilter.innerHTML = opts;
  }

  const gFilter = document.getElementById('grade-exam-filter');
  if (gFilter) {
    let opts = '<option value="">All Examination Sessions</option>';
    state.exams.forEach(e => {
      opts += `<option value="${e.exam_id}">${escapeHtml(e.course_code)} - ${escapeHtml(e.course_name)}</option>`;
    });
    gFilter.innerHTML = opts;
  }

  const annStudent = document.getElementById('ann-student');
  const modalStudent = document.getElementById('modal-select-student');
  if (annStudent && modalStudent) {
    let opts = '<option value="">Select student...</option>';
    state.students.forEach(s => {
      opts += `<option value="${s.user_id}">${escapeHtml(s.full_name)}</option>`;
    });
    annStudent.innerHTML = opts;
    modalStudent.innerHTML = opts;
  }

  const modalExam = document.getElementById('modal-select-exam');
  if (modalExam) {
    let opts = '<option value="">Select exam...</option>';
    state.exams.forEach(e => {
      opts += `<option value="${e.exam_id}">${escapeHtml(e.course_code)} (${escapeHtml(e.exam_date)})</option>`;
    });
    modalExam.innerHTML = opts;
  }

  const lecCourse = document.getElementById('lec-exam-course');
  const lecVenue = document.getElementById('lec-exam-venue');
  if (lecCourse && lecVenue) {
    let cOpts = '<option value="">Select course...</option>';
    state.courses.forEach(c => {
      cOpts += `<option value="${c.course_id}">${escapeHtml(c.course_code)} - ${escapeHtml(c.course_name)}</option>`;
    });
    lecCourse.innerHTML = cOpts;

    let vOpts = '<option value="">Select venue...</option>';
    state.venues.forEach(v => {
      vOpts += `<option value="${v.venue_id}">${escapeHtml(v.venue_name)}</option>`;
    });
    lecVenue.innerHTML = vOpts;
  }
}

function toggleCourseScope(scope) {
  courseScope = scope;
  document.getElementById('chip-my-courses').classList.toggle('active', scope === 'my');
  document.getElementById('chip-all-courses').classList.toggle('active', scope === 'all');
  filterCourses();
}

function filterCourses() {
  const q = document.getElementById('course-search').value.toLowerCase().trim();
  let list = state.courses;

  if (courseScope === 'my') {
    list = list.filter(c => parseInt(c.lecturer_id) === parseInt(currentUser.id));
  }

  if (q) {
    list = list.filter(c => 
      c.course_code.toLowerCase().includes(q) || 
      c.course_name.toLowerCase().includes(q)
    );
  }

  const tbody = document.getElementById('courses-table-body');
  document.getElementById('course-count').textContent = `${list.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="table-empty-row">No courses found matching this view.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr>
      <td><strong>${escapeHtml(c.course_code)}</strong></td>
      <td>${escapeHtml(c.course_name)}</td>
      <td>
        ${parseInt(c.lecturer_id) === parseInt(currentUser.id) 
          ? '<span class="badge-tag tag-lecturer">Assigned to You</span>' 
          : `<span style="color: var(--neutral-600);">${escapeHtml(c.lecturer || 'Unassigned')}</span>`}
      </td>
    </tr>
  `).join('');
}

function renderCourses() {
  filterCourses();
}

function filterExams() {
  const q = document.getElementById('exam-search').value.toLowerCase().trim();
  const v = document.getElementById('exam-venue-filter').value;

  const filtered = state.exams.filter(e => {
    const matchesSearch = !q || 
      e.course_code.toLowerCase().includes(q) || 
      e.course_name.toLowerCase().includes(q) || 
      e.venue_name.toLowerCase().includes(q);
    const matchesVenue = !v || e.venue_name === v;
    return matchesSearch && matchesVenue;
  });

  renderExams(filtered);
}

function renderExams(list) {
  const tbody = document.getElementById('exams-table-body');
  document.getElementById('exam-count').textContent = `${list.length} of ${state.exams.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty-row">No examination sessions found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr>
      <td><strong>${escapeHtml(e.course_code)}</strong></td>
      <td>${escapeHtml(e.course_name)}</td>
      <td>${escapeHtml(e.venue_name)}</td>
      <td>${escapeHtml(e.exam_date)}</td>
      <td>${escapeHtml(e.exam_time)}</td>
    </tr>
  `).join('');
}

function openScheduleExamModal() {
  document.getElementById('lec-exam-course').value = '';
  document.getElementById('lec-exam-venue').value = '';
  document.getElementById('lec-exam-date').value = '';
  document.getElementById('lec-exam-time').value = '';
  openModal('modal-exam');
}

async function handleScheduleExamSubmit(e) {
  e.preventDefault();
  const course_id = parseInt(document.getElementById('lec-exam-course').value);
  const venue_id = parseInt(document.getElementById('lec-exam-venue').value);
  const exam_date = document.getElementById('lec-exam-date').value;
  const exam_time = document.getElementById('lec-exam-time').value;

  try {
    await apiRequest('examinations.php', { method: 'POST', body: { course_id, venue_id, exam_date, exam_time } });
    showToast('Examination session scheduled successfully', 'success');
    closeModal('modal-exam');
    const res = await apiRequest('examinations.php?limit=100');
    state.exams = res.data || [];
    filterExams();
    populateDropdowns();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function setGradeFilter(prefix, btn) {
  activeGradeFilter = prefix;
  document.querySelectorAll('#section-grading .filter-btn-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterGrades();
}

function filterGrades() {
  const q = document.getElementById('grade-search').value.toLowerCase().trim();
  const examId = document.getElementById('grade-exam-filter').value;

  const filtered = state.results.filter(r => {
    const matchesSearch = !q || 
      (r.student_name && r.student_name.toLowerCase().includes(q)) || 
      (r.course_code && r.course_code.toLowerCase().includes(q)) || 
      (r.course_name && r.course_name.toLowerCase().includes(q));

    const matchesExam = !examId || String(r.exam_id) === String(examId);

    let matchesGrade = true;
    if (activeGradeFilter) {
      matchesGrade = r.grade && r.grade.startsWith(activeGradeFilter);
    }

    return matchesSearch && matchesExam && matchesGrade;
  });

  renderGrades(filtered);
}

function renderGrades(list) {
  const tbody = document.getElementById('grades-table-body');
  document.getElementById('grade-count').textContent = `${list.length} of ${state.results.length} records`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row">No grading records found matching filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => {
    const gradeLetter = r.grade ? r.grade.charAt(0) : 'F';
    return `
      <tr>
        <td><strong>${escapeHtml(r.student_name)}</strong></td>
        <td><strong>${escapeHtml(r.course_code)}</strong></td>
        <td>${escapeHtml(r.course_name)}</td>
        <td><strong>${parseFloat(r.marks).toFixed(1)}</strong></td>
        <td><span class="grade-box ${gradeLetter}">${r.grade}</span></td>
        <td style="text-align: right;">
          <button class="btn-academic secondary sm" onclick="openEditGradeModal(${r.result_id})">Edit Mark</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddGradeModal() {
  document.getElementById('modal-grade-title').textContent = 'Record Student Mark';
  document.getElementById('grade-result-id').value = '';
  document.getElementById('grade-student-group').style.display = 'block';
  document.getElementById('grade-exam-group').style.display = 'block';

  const studentSelect = document.getElementById('modal-select-student');
  const examSelect = document.getElementById('modal-select-exam');
  studentSelect.disabled = false;
  studentSelect.required = true;
  studentSelect.value = '';
  examSelect.disabled = false;
  examSelect.required = true;
  examSelect.value = '';

  document.getElementById('modal-input-marks').value = '';
  openModal('modal-grade');
}

function openEditGradeModal(id) {
  const r = state.results.find(item => item.result_id === id);
  if (!r) return;
  document.getElementById('modal-grade-title').textContent = `Edit Mark - ${r.student_name}`;
  document.getElementById('grade-result-id').value = r.result_id;
  document.getElementById('grade-student-group').style.display = 'none';
  document.getElementById('grade-exam-group').style.display = 'none';

  const studentSelect = document.getElementById('modal-select-student');
  const examSelect = document.getElementById('modal-select-exam');
  studentSelect.required = false;
  studentSelect.disabled = true;
  studentSelect.value = r.student_id;
  examSelect.required = false;
  examSelect.disabled = true;
  examSelect.value = r.exam_id;

  document.getElementById('modal-input-marks').value = r.marks;
  openModal('modal-grade');
}

async function handleGradeSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('grade-result-id').value;
  const marksVal = document.getElementById('modal-input-marks').value;
  const marks = parseFloat(marksVal);

  if (isNaN(marks) || marks < 0 || marks > 100) {
    showToast('Marks must be a valid number between 0 and 100', 'error');
    return;
  }

  try {
    if (id) {
      const existing = state.results.find(r => r.result_id === parseInt(id));
      const student_id = existing ? parseInt(existing.student_id) : parseInt(document.getElementById('modal-select-student').value);
      const exam_id = existing ? parseInt(existing.exam_id) : parseInt(document.getElementById('modal-select-exam').value);

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
      const student_id = parseInt(document.getElementById('modal-select-student').value);
      const exam_id = parseInt(document.getElementById('modal-select-exam').value);

      if (!student_id || !exam_id) {
        showToast('Please select both a student and an examination session', 'error');
        return;
      }

      await apiRequest('results.php', { method: 'POST', body: { student_id, exam_id, marks } });
      showToast('Mark recorded successfully', 'success');
    }
    closeModal('modal-grade');
    const res = await apiRequest('results.php?limit=100');
    state.results = res.data || [];
    filterGrades();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleSendAnnouncement(e) {
  e.preventDefault();
  const user_id = parseInt(document.getElementById('ann-student').value);
  const message = document.getElementById('ann-message').value.trim();

  try {
    await apiRequest('notifications.php', { method: 'POST', body: { user_id, message } });
    showToast('Announcement dispatched to student', 'success');
    document.getElementById('form-announcement').reset();
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
