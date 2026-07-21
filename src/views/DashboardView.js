import { requireAuth, logout } from '../services/auth.js';
import { getUserProgress } from '../services/progress.js';
import { getAnnouncements } from '../services/announcement.js';
import courseDataJson from '../config/course.json';
import logoImg from '../assets/logo/logo.png';
import '../styles/dashboard.css';

export async function render(container, { router }) {
  const auth = await requireAuth(['student', 'admin']);
  if (!auth) return () => {};

  const { profile } = auth;

  container.innerHTML = `
    <div class="dashboard-layout">
      <!-- Navbar -->
      <nav class="dash-navbar">
        <div class="nav-container">
          <a href="/" class="logo">
            <img src="${logoImg}" alt="CreatorKid Academy" class="nav-logo" />
          </a>
          <div class="nav-right">
            <a href="/lesson" class="btn btn-secondary btn-sm">Course Player</a>
            <a href="/profile" class="btn btn-secondary btn-sm">Profile</a>
            <a href="/change-password" class="btn btn-secondary btn-sm">Change Password</a>
            <div class="profile-pill">
              <div class="user-avatar" id="nav-user-avatar">A</div>
              <span class="user-name" id="nav-user-name">Loading...</span>
            </div>
            <button id="logout-btn" class="btn btn-secondary btn-sm">Logout</button>
          </div>
        </div>
      </nav>

      <!-- Main Content Container -->
      <main class="dashboard-main container">
        <!-- Welcome Hero Banner -->
        <section class="welcome-banner">
          <div class="welcome-content">
            <span class="badge-role" id="user-role-badge">STUDENT</span>
            <h1 id="welcome-title">Welcome back, <span id="student-name">Creator</span>! 👋</h1>
            <p>Pick up right where you left off and keep building your digital art skills.</p>
          </div>
          <div class="hero-actions">
            <a href="/lesson" class="btn btn-primary" id="continue-learning-btn">▶ Continue Learning</a>
          </div>
        </section>

        <!-- Stats Metrics Cards -->
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
          <div class="stat-card" style="background: var(--color-card); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
            <div style="font-size: 1.5rem; background: rgba(16, 185, 129, 0.15); padding: 10px; border-radius: var(--radius-md);">✅</div>
            <div>
              <span id="stat-completed-lessons" style="display: block; font-size: 1.5rem; font-weight: 700; color: #6ee7b7;">0</span>
              <span style="font-size: 0.8rem; color: var(--color-text-muted);">Completed Lessons</span>
            </div>
          </div>

          <div class="stat-card" style="background: var(--color-card); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
            <div style="font-size: 1.5rem; background: rgba(6, 182, 212, 0.15); padding: 10px; border-radius: var(--radius-md);">⏳</div>
            <div>
              <span id="stat-remaining-lessons" style="display: block; font-size: 1.5rem; font-weight: 700; color: #67e8f9;">0</span>
              <span style="font-size: 0.8rem; color: var(--color-text-muted);">Remaining Lessons</span>
            </div>
          </div>

          <div class="stat-card" style="background: var(--color-card); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
            <div style="font-size: 1.5rem; background: rgba(124, 58, 237, 0.15); padding: 10px; border-radius: var(--radius-md);">📘</div>
            <div>
              <span id="stat-current-module" style="display: block; font-size: 1.1rem; font-weight: 700; color: #c4b5fd;">Basic</span>
              <span style="font-size: 0.8rem; color: var(--color-text-muted);">Current Module</span>
            </div>
          </div>
        </div>

        <!-- Overall Course Progress Card -->
        <section class="progress-card">
          <div class="progress-header">
            <div>
              <h3>Photoshop Masterclass Progress</h3>
              <p id="completed-count-text">0 of 40 lessons completed</p>
            </div>
            <span class="percentage-badge" id="overall-percentage">0%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" id="overall-progress-bar" style="width: 0%;"></div>
          </div>
        </section>

        <!-- Course Announcements Feed -->
        <div class="dash-widget">
          <div class="widget-header">
            <h3>📢 Course Announcements & Updates</h3>
          </div>
          <div class="announcements-list" id="announcements-list">
            <div class="loading-spinner">Loading announcements...</div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Populate Profile Header Info
  const navUserName = container.querySelector('#nav-user-name');
  const navUserAvatar = container.querySelector('#nav-user-avatar');
  const studentName = container.querySelector('#student-name');
  const userRoleBadge = container.querySelector('#user-role-badge');
  const logoutBtn = container.querySelector('#logout-btn');

  if (navUserName) navUserName.textContent = profile.full_name;
  if (studentName) studentName.textContent = profile.full_name.split(' ')[0];
  if (navUserAvatar) {
    if (profile.avatar_url) {
      navUserAvatar.innerHTML = `<img src="${profile.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
    } else {
      navUserAvatar.textContent = profile.full_name.charAt(0).toUpperCase();
    }
  }
  if (userRoleBadge) userRoleBadge.textContent = profile.role.toUpperCase();

  logoutBtn.addEventListener('click', async () => {
    await logout();
    router.navigate('/login');
  });

  // Load student progress & announcements
  await loadStudentProgress(profile.id, container);
  await loadAnnouncements(container);

  return () => {};
}

async function loadStudentProgress(userId, container) {
  const completedText = container.querySelector('#completed-count-text');
  const overallPercentage = container.querySelector('#overall-percentage');
  const progressBarFill = container.querySelector('#overall-progress-bar');
  const continueBtn = container.querySelector('#continue-learning-btn');

  const statCompleted = container.querySelector('#stat-completed-lessons');
  const statRemaining = container.querySelector('#stat-remaining-lessons');
  const statModule = container.querySelector('#stat-current-module');

  try {
    const courseData = courseDataJson;
    const totalLessonsCount = courseData.reduce((acc, m) => acc + (m.videos ? m.videos.length : 0), 0);

    const records = await getUserProgress(userId);
    const completedCount = records.filter(r => r.completed).length;
    const remainingCount = Math.max(0, totalLessonsCount - completedCount);
    const percentage = Math.min(100, Math.round((completedCount / totalLessonsCount) * 100));

    if (completedText) completedText.textContent = `${completedCount} of ${totalLessonsCount} lessons completed`;
    if (overallPercentage) overallPercentage.textContent = `${percentage}%`;
    if (progressBarFill) progressBarFill.style.width = `${percentage}%`;

    if (statCompleted) statCompleted.textContent = completedCount;
    if (statRemaining) statRemaining.textContent = remainingCount;

    if (records.length > 0 && continueBtn) {
      const sorted = [...records].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      const lastActive = sorted[0];
      if (lastActive && lastActive.lesson_id) {
        const cleanTitle = lastActive.lesson_id.replace(/\.mp4/g, '');
        continueBtn.textContent = `▶ Continue: ${cleanTitle}`;

        if (courseData && statModule) {
          const foundModule = courseData.find(m => m.videos && m.videos.some(v => (typeof v === 'string' ? v : v.file) === lastActive.lesson_id));
          if (foundModule) {
            statModule.textContent = foundModule.title;
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to load progress:', err);
  }
}

async function loadAnnouncements(container) {
  const announcementsList = container.querySelector('#announcements-list');
  if (!announcementsList) return;

  try {
    const list = await getAnnouncements();
    if (!list || list.length === 0) {
      announcementsList.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.85rem; padding: 1rem 0;">No announcements posted yet.</p>';
      return;
    }

    announcementsList.innerHTML = list.map(item => `
      <div class="announcement-item ${item.pinned ? 'pinned' : ''}">
        <h4>${item.pinned ? '📌 ' : ''}${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.message)}</p>
        <span class="announcement-date">${new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load announcements:', err);
    announcementsList.innerHTML = '<p style="color: #fca5a5; font-size: 0.85rem;">Failed to load announcements.</p>';
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
