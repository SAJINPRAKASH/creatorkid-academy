import { createClient } from '@supabase/supabase-js';
import { requireAuth, logout, getCurrentUser } from '../services/auth.js';
import { getAllProfiles, updateProfile } from '../services/profile.js';
import { supabase } from '../services/supabase.js';
import { getAnnouncements, createAnnouncement } from '../services/announcement.js';
import logoImg from '../assets/logo/logo.png';
import '../styles/admin.css';

// Initialize a secondary, temporary client that does not persist session storage.
// This allows the admin to register new users in Supabase Auth without logging the admin out.
const tempSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

export async function render(container, { router }) {
  const auth = await requireAuth(['admin']);
  if (!auth) return () => {};

  const { profile } = auth;

  container.innerHTML = `
    <div class="admin-layout">
      <!-- Navbar -->
      <nav class="admin-navbar">
        <div class="nav-container">
          <div class="nav-left">
            <a href="/" class="logo">
              <img src="${logoImg}" alt="CreatorKid Academy" class="nav-logo" />
            </a>
            <span class="admin-badge">Admin Control Center</span>
          </div>
          <div class="nav-right">
            <div class="user-info">
              <div class="avatar">A</div>
              <span class="user-name" id="admin-user-name">Super Admin</span>
            </div>
            <button id="logout-btn" class="btn btn-secondary btn-sm">Logout</button>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="admin-main container">
        <!-- Header Section -->
        <div class="dashboard-header">
          <div>
            <h1>Admin Management Portal</h1>
            <p>Control student profiles, announcements, and course access in Supabase.</p>
          </div>
          <div class="header-action-group" style="display: flex; gap: 10px;">
            <button id="add-announcement-btn" class="btn btn-secondary">+ Post Announcement</button>
            <button id="add-student-btn" class="btn btn-primary">+ Add Student</button>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon icon-purple">👥</div>
            <div>
              <span class="stat-value" id="stat-total-students">0</span>
              <span class="stat-label">Total Students</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-cyan">📢</div>
            <div>
              <span class="stat-value" id="stat-announcements-count">0</span>
              <span class="stat-label">Announcements</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-green">⚡</div>
            <div>
              <span class="stat-value" id="stat-active-students">0</span>
              <span class="stat-label">Active Accounts</span>
            </div>
          </div>
        </div>

        <!-- Filter and Control Bar -->
        <div class="controls-bar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="search-input" placeholder="Search student by name or email..." />
          </div>
          <div class="filters-group">
            <select id="course-filter">
              <option value="ALL">All Courses</option>
              <option value="Photoshop Masterclass">Photoshop Masterclass</option>
              <option value="Illustrator Masterclass">Illustrator Masterclass</option>
              <option value="Premiere Pro Video Editing">Premiere Pro Video Editing</option>
              <option value="After Effects & 3D">After Effects & 3D</option>
            </select>

            <select id="status-filter">
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <!-- Students Table -->
        <div class="table-card">
          <div class="table-wrapper">
            <table class="students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Role</th>
                  <th>Selected Courses</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="students-table-body">
                <!-- JS rendered rows -->
              </tbody>
            </table>
          </div>
          <div id="no-results" class="no-results" style="display: none;">
            <p>No students match your filter criteria.</p>
          </div>
        </div>
      </main>

      <!-- Student Modal (Add / Edit) -->
      <div id="student-modal" class="modal-overlay" style="display: none;">
        <div class="modal-card">
          <div class="modal-header">
            <h3 id="modal-title">Add New Student</h3>
            <button id="modal-close" class="close-btn">&times;</button>
          </div>
          <form id="student-form">
            <input type="hidden" id="student-id" />

            <div class="form-row">
              <div class="form-group">
                <label for="student-name">Full Name *</label>
                <input type="text" id="student-name" placeholder="e.g. Alex Johnson" required />
              </div>
              <div class="form-group">
                <label for="student-email">Email Address *</label>
                <input type="email" id="student-email" placeholder="alex@creatorkid.com" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="student-phone">Phone Number</label>
                <input type="tel" id="student-phone" placeholder="+91 9074894575" />
              </div>
              <div class="form-group">
                <label for="student-status">Account Status</label>
                <select id="student-status">
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div class="form-row" id="password-form-row">
              <div class="form-group" style="grid-column: span 2;">
                <label for="student-password">Initial Password *</label>
                <input type="text" id="student-password" placeholder="Min 6 characters, e.g. 123456" />
              </div>
            </div>

            <div class="form-group">
              <label>Assign Selected Courses *</label>
              <div class="courses-checkbox-grid">
                <label class="course-checkbox-item">
                  <input type="checkbox" name="courses" value="Photoshop Masterclass" checked />
                  <span>🎨 Photoshop Masterclass</span>
                </label>
                <label class="course-checkbox-item">
                  <input type="checkbox" name="courses" value="Illustrator Masterclass" />
                  <span>✒️ Illustrator Masterclass</span>
                </label>
                <label class="course-checkbox-item">
                  <input type="checkbox" name="courses" value="Premiere Pro Video Editing" />
                  <span>🎬 Premiere Pro Video Editing</span>
                </label>
                <label class="course-checkbox-item">
                  <input type="checkbox" name="courses" value="After Effects & 3D" />
                  <span>✨ After Effects & 3D</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Student Profile</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Announcement Modal -->
      <div id="announcement-modal" class="modal-overlay" style="display: none;">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Post New Announcement</h3>
            <button id="announcement-modal-close" class="close-btn">&times;</button>
          </div>
          <form id="announcement-form">
            <div class="form-group">
              <label for="announcement-title">Announcement Title *</label>
              <input type="text" id="announcement-title" placeholder="e.g. Photoshop New Module Available" required />
            </div>
            <div class="form-group" style="margin-top: 1rem;">
              <label for="announcement-message">Message *</label>
              <textarea id="announcement-message" rows="4" placeholder="Enter announcement content..." style="width: 100%; padding: 10px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-md); color: var(--color-text);" required></textarea>
            </div>
            <div class="form-group" style="margin-top: 1rem;">
              <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="announcement-pinned" />
                <span>📌 Pin to top of Student Dashboard</span>
              </label>
            </div>
            <div class="modal-footer">
              <button type="button" id="announcement-cancel-btn" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Post Announcement</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const adminNameElem = container.querySelector('#admin-user-name');
  if (adminNameElem) adminNameElem.textContent = profile.full_name;

  const logoutBtn = container.querySelector('#logout-btn');
  logoutBtn.addEventListener('click', async () => {
    await logout();
    router.navigate('/login');
  });

  let students = [];
  let announcements = [];

  const studentsTableBody = container.querySelector('#students-table-body');
  const noResults = container.querySelector('#no-results');
  const searchInput = container.querySelector('#search-input');
  const courseFilter = container.querySelector('#course-filter');
  const statusFilter = container.querySelector('#status-filter');

  const statTotalStudents = container.querySelector('#stat-total-students');
  const statAnnouncementsCount = container.querySelector('#stat-announcements-count');
  const statActiveStudents = container.querySelector('#stat-active-students');

  const studentModal = container.querySelector('#student-modal');
  const addStudentBtn = container.querySelector('#add-student-btn');
  const modalClose = container.querySelector('#modal-close');
  const modalCancelBtn = container.querySelector('#modal-cancel-btn');
  const studentForm = container.querySelector('#student-form');

  const announcementModal = container.querySelector('#announcement-modal');
  const addAnnouncementBtn = container.querySelector('#add-announcement-btn');
  const announcementClose = container.querySelector('#announcement-modal-close');
  const announcementCancelBtn = container.querySelector('#announcement-cancel-btn');
  const announcementForm = container.querySelector('#announcement-form');

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
      const matchesCourse = selectedCourse === 'ALL' || (s.courses && s.courses.includes(selectedCourse));
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
            ${(s.courses || ['Photoshop Masterclass']).map(c => `<span class="badge-course">${escapeHtml(c)}</span>`).join('')}
          </div>
        </td>
        <td style="color: var(--color-text-muted);">${s.created_at ? s.created_at.split('T')[0] : 'Recent'}</td>
        <td>
          <span class="badge-status status-${(s.status || 'Active').toLowerCase()}">${s.status || 'Active'}</span>
        </td>
        <td style="text-align: right;">
          <div class="action-btns">
            <button class="btn-icon edit-btn" data-id="${s.id}">✏️ Edit</button>
            <button class="btn-icon btn-danger delete-btn" data-id="${s.id}" style="color: #fca5a5; border-color: rgba(239, 68, 68, 0.2);">🗑️ Delete</button>
          </div>
        </td>
      `;

      studentsTableBody.appendChild(tr);
    });
  }

  searchInput.addEventListener('input', renderTable);
  courseFilter.addEventListener('change', renderTable);
  statusFilter.addEventListener('change', renderTable);

  const openEditModal = (student) => {
    studentForm.reset();
    container.querySelector('#modal-title').textContent = 'Edit Student Profile';
    container.querySelector('#student-id').value = student.id;
    container.querySelector('#student-name').value = student.full_name || '';
    container.querySelector('#student-email').value = student.email || '';
    container.querySelector('#student-email').disabled = true; // Email cannot be changed
    container.querySelector('#student-status').value = student.status || 'Active';

    // Set course checkboxes
    const assignedCourses = student.courses || ['Photoshop Masterclass'];
    const checkboxes = container.querySelectorAll('input[name="courses"]');
    checkboxes.forEach(cb => {
      cb.checked = assignedCourses.includes(cb.value);
    });

    container.querySelector('#password-form-row').style.display = 'none';
    container.querySelector('#student-password').required = false;
    container.querySelector('#student-password').value = '';
    studentModal.style.display = 'flex';
  };

  addStudentBtn.addEventListener('click', () => {
    studentForm.reset();
    container.querySelector('#modal-title').textContent = 'Add New Student';
    container.querySelector('#student-id').value = '';
    container.querySelector('#student-email').disabled = false;
    container.querySelector('#student-status').value = 'Active';
    container.querySelector('#password-form-row').style.display = 'grid';
    container.querySelector('#student-password').required = true;
    container.querySelector('#student-password').value = '';
    const checkboxes = container.querySelectorAll('input[name="courses"]');
    checkboxes.forEach(cb => {
      cb.checked = cb.value === 'Photoshop Masterclass';
    });
    studentModal.style.display = 'flex';
  });

  modalClose.addEventListener('click', () => studentModal.style.display = 'none');
  modalCancelBtn.addEventListener('click', () => studentModal.style.display = 'none');

  // Delegated edit/delete click listener
  studentsTableBody.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      const studentId = editBtn.dataset.id;
      const student = students.find(s => s.id === studentId);
      if (student) {
        openEditModal(student);
      }
    }

    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      const studentId = deleteBtn.dataset.id;
      const student = students.find(s => s.id === studentId);
      if (student) {
        const currentUser = await getCurrentUser();
        if (currentUser && currentUser.id === studentId) {
          alert('You cannot delete your own admin account.');
          return;
        }

        if (confirm(`Are you sure you want to delete student "${student.full_name}"? This will permanently remove their profile record.`)) {
          try {
            const { error } = await supabase
              .from('profiles')
              .delete()
              .eq('id', studentId);
            if (error) throw error;
            alert('Student profile deleted successfully.');
            await loadStudents();
          } catch (err) {
            alert('Error deleting student: ' + err.message);
          }
        }
      }
    }
  });

  studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = container.querySelector('#student-id').value;
    const name = container.querySelector('#student-name').value.trim();
    const email = container.querySelector('#student-email').value.trim();
    const status = container.querySelector('#student-status').value;
    const checkboxes = container.querySelectorAll('input[name="courses"]:checked');
    const assignedCourses = Array.from(checkboxes).map(cb => cb.value);

    try {
      if (id) {
        // Edit mode
        await updateProfile(id, {
          full_name: name,
          status: status,
          courses: assignedCourses
        });
        alert('Student profile updated successfully.');
      } else {
        // Add mode - sign up via temp client
        const password = container.querySelector('#student-password').value.trim();
        if (password.length < 6) {
          alert('Password must be at least 6 characters long.');
          return;
        }

        const { data, error } = await tempSupabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: 'student'
            }
          }
        });

        if (error) throw error;

        // The handle_new_user database trigger automatically inserts the profiles row.
        // We will fetch the created profile and update status & courses to match selections.
        const newUserId = data.user?.id;
        if (newUserId) {
          await updateProfile(newUserId, {
            status: status,
            courses: assignedCourses
          });
        }
        alert('Student registered and profile created successfully.');
      }
      studentModal.style.display = 'none';
      await loadStudents();
    } catch (err) {
      alert('Error saving student profile: ' + err.message);
    }
  });

  addAnnouncementBtn.addEventListener('click', () => {
    announcementForm.reset();
    announcementModal.style.display = 'flex';
  });
  announcementClose.addEventListener('click', () => announcementModal.style.display = 'none');
  announcementCancelBtn.addEventListener('click', () => announcementModal.style.display = 'none');

  announcementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = container.querySelector('#announcement-title').value.trim();
    const message = container.querySelector('#announcement-message').value.trim();
    const pinned = container.querySelector('#announcement-pinned').checked;

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

  return () => {};
}
