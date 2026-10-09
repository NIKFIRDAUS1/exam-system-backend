const getApiBase = () => {
  const path = window.location.pathname;
  if (path.includes('/exam-system')) {
    return '/exam-system/api';
  }
  return '/api';
};

const getFrontendBase = () => {
  const path = window.location.pathname;
  if (path.includes('/exam-system')) {
    return '/exam-system/frontend';
  }
  return '/frontend';
};

const API_BASE = getApiBase();
const FRONTEND_BASE = getFrontendBase();

function getToken() {
  return localStorage.getItem('ems_token');
}

function getUser() {
  const user = localStorage.getItem('ems_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function setAuth(token, user) {
  localStorage.setItem('ems_token', token);
  localStorage.setItem('ems_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('ems_token');
  localStorage.removeItem('ems_user');
}

function requireAuth(allowedRoles = []) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    clearAuth();
    window.location.href = `${FRONTEND_BASE}/index.html`;
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    redirectToRoleDashboard(user.role);
    return null;
  }

  return user;
}

function redirectToRoleDashboard(role) {
  if (role === 'admin') {
    window.location.href = `${FRONTEND_BASE}/admin/index.html`;
  } else if (role === 'lecturer') {
    window.location.href = `${FRONTEND_BASE}/lecturer/index.html`;
  } else if (role === 'student') {
    window.location.href = `${FRONTEND_BASE}/student/index.html`;
  } else {
    window.location.href = `${FRONTEND_BASE}/index.html`;
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method: options.method || 'GET',
    headers: headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (response.status === 401) {
      clearAuth();
      showToast('Session expired. Please log in again.', 'error');
      setTimeout(() => {
        window.location.href = `${FRONTEND_BASE}/index.html`;
      }, 1200);
      return data;
    }

    if (!response.ok && !data.success) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderUserBadge() {
  const user = getUser();
  if (!user) return;

  const nameEl = document.getElementById('header-user-name');
  const roleEl = document.getElementById('header-user-role');

  if (nameEl) nameEl.textContent = user.name || user.full_name || 'User';
  if (roleEl) {
    roleEl.textContent = user.role.toUpperCase();
    roleEl.className = `user-meta-role ${user.role}`;
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuth();
      showToast('Signed out of session', 'info');
      setTimeout(() => {
        window.location.href = `${FRONTEND_BASE}/index.html`;
      }, 400);
    });
  }
}

function filterData(dataArray, searchTerm, propertiesToSearch = []) {
  if (!searchTerm || searchTerm.trim() === '') return dataArray;
  const term = searchTerm.toLowerCase().trim();

  return dataArray.filter(item => {
    return propertiesToSearch.some(prop => {
      const val = item[prop];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(term);
    });
  });
}

function getGradeBadge(grade) {
  if (!grade) return '<span class="badge-tag tag-default">-</span>';
  const letter = grade.charAt(0);
  return `<span class="grade-box ${letter}">${grade}</span>`;
}
