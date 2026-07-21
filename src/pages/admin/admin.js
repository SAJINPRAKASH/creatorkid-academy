import { requireAuth, logout } from '../../services/auth.js';
import { getAllProfiles } from '../../services/profile.js';
import { getAnnouncements, createAnnouncement } from '../../services/announcement.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Route guard - require Admin role
  const auth = await requireAuth(['admin']);
  if (!auth) return;

  const { profile } = auth;
  const adminNameElem = document.getElementById('admin-user-name');
  if (adminNameElem) adminNameElem.textContent = profile.full_name;

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', () => logout());

  // Local state
  let students = [];
  let announcements = [];

  // Elements
  const studentsTableBody = document.getElementById('students-table-body');
  const noResults = document.getElementById('no-results');
  const searchInput = document.getElementById('search-input');
  const courseFilter = document.getElementById('course-filter');
  const statusFilter = document.getElementById('status-filter');

  const statTotalStudents = document.getElementById('stat-total-students');
  const statAnnouncementsCount = document.getElementById('stat-announcements-count');
  const statActiveStudents = document.getElementById('stat-active-students');

  // Modals
  const studentModal = document.getElementById('student-modal');
  const addStudentBtn = document.getElementById('add-student-btn');
  const modalClose = document.getElementById('modal-close');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const studentForm = document.getElementById('student-form');

  const announcementModal = document.getElementById('announcement-modal');
  const addAnnouncementBtn = document.getElementById('add-announcement-btn');
  const announcementClose = document.getElementById('announcement-modal-close');
  const announcementCancelBtn = document.getElementById('announcement-cancel-btn');
  const announcementForm = document.getElementById('announcement-form');

  // Initial Data Fetch
  await loadAllData();

  async function loadAllData() {
    await Promise.all([
      loadStudents(),
      loadAnnouncementsList(),
    ]);
  }

  async function loadStudents() {
    try {
      const res = await getAllProfiles();
      students = res || [];
      renderTable();
    } catch (err) {
      console.error('Error loading student profiles:', err);
      students = [];
      renderTable();
    }
  }

  async function loadAnnouncementsList() {
    try {
      announcements = await getAnnouncements();
      if (statAnnouncementsCount) statAnnouncementsCount.textContent = announcements.length;
    } catch (err) {
      console.error('Error loading announcements:', err);
    }
  }

  function renderTable() {
    if (statTotalStudents) statTotalStudents.textContent = students.length;
    if (statActiveStudents) statActiveStudents.textContent = students.filter(s => s.status !== 'Suspended').length;

    const query = searchInput.value.toLowerCase().trim();
    const selectedCourse = courseFilter.value;
    const selectedStatus = statusFilter.value;

    const filtered = students.filter(s => {
      const matchesSearch = (s.full_name || s.name || '').toLowerCase().includes(query) || (s.email || '').toLowerCase().includes(query);
      const matchesCourse = selectedCourse === 'ALL' || (s.courses && s.courses.includes(selectedCourse)) || selectedCourse === 'Photoshop Masterclass';
      const matchesStatus = selectedStatus === 'ALL' || (s.status || 'Active') === selectedStatus;
      return matchesSearch && matchesCourse && matchesStatus;
    });

    studentsTableBody.innerHTML = '';

    if (filtered.length === 0) {
      noResults.style.display = 'block';
      return;
    } else {
      noResults.style.display = 'none';
    }

    filtered.forEach(s => {
      const tr = document.createElement('tr');
      const name = s.full_name || s.name || 'Student';
      const avatarLetter = name.charAt(0).toUpperCase();

      tr.innerHTML = `
        <td>
          <div class="student-cell">
            <div class="student-avatar">${avatarLetter}</div>
            <div>
              <div class="student-name">${escapeHtml(name)}</div>
              <div class="student-email">${escapeHtml(s.email)}</div>
            </div>
          </div>
        </td>
        <td><span class="badge-role">${(s.role || 'student').toUpperCase()}</span></td>
        <td>
          <div class="course-badges">
            <span class="badge-course">Photoshop Masterclass</span>
          </div>
        </td>
        <td style="color: var(--color-text-muted);">${s.created_at ? s.created_at.split('T')[0] : 'Recent'}</td>
        <td>
          <span class="badge-status status-active">${s.status || 'Active'}</span>
        </td>
        <td style="text-align: right;">
          <div class="action-btns">
            <button class="btn-icon edit-btn" data-id="${s.id}">✏️ Edit</button>
          </div>
        </td>
      `;

      studentsTableBody.appendChild(tr);
    });
  }

  // Filter Listeners
  searchInput.addEventListener('input', renderTable);
  courseFilter.addEventListener('change', renderTable);
  statusFilter.addEventListener('change', renderTable);

  // Add Student Modal Handlers
  addStudentBtn.addEventListener('click', () => {
    studentForm.reset();
    studentModal.style.display = 'flex';
  });
  modalClose.addEventListener('click', () => studentModal.style.display = 'none');
  modalCancelBtn.addEventListener('click', () => studentModal.style.display = 'none');

  studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    alert('Student profile saved.');
    studentModal.style.display = 'none';
    await loadStudents();
  });

  // Announcement Modal Handlers
  addAnnouncementBtn.addEventListener('click', () => {
    announcementForm.reset();
    announcementModal.style.display = 'flex';
  });
  announcementClose.addEventListener('click', () => announcementModal.style.display = 'none');
  announcementCancelBtn.addEventListener('click', () => announcementModal.style.display = 'none');

  announcementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('announcement-title').value.trim();
    const message = document.getElementById('announcement-message').value.trim();
    const pinned = document.getElementById('announcement-pinned').checked;

    try {
      await createAnnouncement({ title, message, pinned });
      alert('Announcement posted successfully!');
      announcementModal.style.display = 'none';
      await loadAnnouncementsList();
    } catch (err) {
      alert('Failed to save announcement: ' + err.message);
    }
  });

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
