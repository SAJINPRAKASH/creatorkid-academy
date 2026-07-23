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
          <button id="dash-menu-toggle" class="dash-menu-toggle">☰</button>
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

        <!-- Overall Course Progress Cards (Populated by JS) -->
        <div id="course-progress-cards-container">
          <div class="loading-spinner">Loading course progress...</div>
        </div>

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

      <!-- Slide-out Drawer for Mobile -->
      <div class="dash-drawer" id="dash-drawer">
        <div class="drawer-header">
          <img src="${logoImg}" alt="CreatorKid Academy" class="nav-logo" style="max-height: 32px; width: auto;" />
          <button id="dash-drawer-close" class="drawer-close-btn">&times;</button>
        </div>
        <div class="drawer-content">
          <div class="profile-pill-large">
            <div class="user-avatar" id="drawer-user-avatar">A</div>
            <div class="user-details">
              <span class="user-name" id="drawer-user-name">Loading...</span>
              <span class="user-role" id="drawer-user-role">STUDENT</span>
            </div>
          </div>
          <div class="drawer-links">
            <a href="/lesson" class="drawer-link">📚 Course Player</a>
            <a href="/profile" class="drawer-link">👤 My Profile</a>
            <a href="/change-password" class="drawer-link">🔑 Change Password</a>
            <button id="drawer-logout-btn" class="drawer-link logout-link">🚪 Logout</button>
          </div>
        </div>
      </div>
      <div class="drawer-overlay" id="drawer-overlay"></div>
    </div>
  `;

  // Populate Profile Header Info
  const navUserName = container.querySelector('#nav-user-name');
  const navUserAvatar = container.querySelector('#nav-user-avatar');
  const studentName = container.querySelector('#student-name');
  const userRoleBadge = container.querySelector('#user-role-badge');
  const logoutBtn = container.querySelector('#logout-btn');

  // Populate Drawer Info
  const drawerUserName = container.querySelector('#drawer-user-name');
  const drawerUserAvatar = container.querySelector('#drawer-user-avatar');
  const drawerUserRole = container.querySelector('#drawer-user-role');
  const drawerLogoutBtn = container.querySelector('#drawer-logout-btn');

  if (navUserName) navUserName.textContent = profile.full_name;
  if (drawerUserName) drawerUserName.textContent = profile.full_name;
  if (studentName) studentName.textContent = profile.full_name.split(' ')[0];
  
  if (navUserAvatar) {
    if (profile.avatar_url) {
      navUserAvatar.innerHTML = `<img src="${profile.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
    } else {
      navUserAvatar.textContent = profile.full_name.charAt(0).toUpperCase();
    }
  }

  if (drawerUserAvatar) {
    if (profile.avatar_url) {
      drawerUserAvatar.innerHTML = `<img src="${profile.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
    } else {
      drawerUserAvatar.textContent = profile.full_name.charAt(0).toUpperCase();
    }
  }

  if (userRoleBadge) userRoleBadge.textContent = profile.role.toUpperCase();
  if (drawerUserRole) drawerUserRole.textContent = profile.role.toUpperCase();

  logoutBtn.addEventListener('click', async () => {
    await logout();
    router.navigate('/login');
  });

  if (drawerLogoutBtn) {
    drawerLogoutBtn.addEventListener('click', async () => {
      closeDrawer();
      await logout();
      router.navigate('/login');
    });
  }

  // Drawer toggling logic
  const menuToggle = container.querySelector('#dash-menu-toggle');
  const drawerClose = container.querySelector('#dash-drawer-close');
  const drawer = container.querySelector('#dash-drawer');
  const overlay = container.querySelector('#drawer-overlay');

  const openDrawer = () => {
    drawer.classList.add('open');
    overlay.classList.add('active');
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
  };

  if (menuToggle) menuToggle.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  // Load student progress & announcements
  await loadStudentProgress(profile, container);
  await loadAnnouncements(container);

  return () => {
    closeDrawer();
  };
}

async function loadStudentProgress(profile, container) {
  const userId = profile.id;
  const assignedCourses = profile.courses && profile.courses.length > 0 ? profile.courses : ['Photoshop Masterclass'];

  const continueBtn = container.querySelector('#continue-learning-btn');
  const statCompleted = container.querySelector('#stat-completed-lessons');
  const statRemaining = container.querySelector('#stat-remaining-lessons');
  const statModule = container.querySelector('#stat-current-module');
  const cardsContainer = container.querySelector('#course-progress-cards-container');

  try {
    const courseData = courseDataJson;
    const totalLessonsCount = courseData.reduce((acc, m) => acc + (m.videos ? m.videos.length : 0), 0);

    const records = await getUserProgress(userId);
    const completedCount = records.filter(r => r.completed).length;
    const remainingCount = Math.max(0, totalLessonsCount - completedCount);
    const percentage = Math.min(100, Math.round((completedCount / totalLessonsCount) * 100));

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

    // Render Progress Cards Dynamically
    if (cardsContainer) {
      cardsContainer.innerHTML = assignedCourses.map(course => {
        let progressPercentage = 0;
        let countText = '';
        const isPhotoshop = course === 'Photoshop Masterclass' || course === 'Photoshop';

        if (isPhotoshop) {
          progressPercentage = percentage;
          countText = `${completedCount} of ${totalLessonsCount} lessons completed`;
        } else {
          progressPercentage = 0;
          countText = `Content coming soon!`;
        }

        return `
          <section class="progress-card" style="margin-bottom: 1.5rem;">
            <div class="progress-header">
              <div>
                <h3>${escapeHtml(course)} Progress</h3>
                <p>${escapeHtml(countText)}</p>
              </div>
              <span class="percentage-badge">${progressPercentage}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${progressPercentage}%;"></div>
            </div>
          </section>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to load progress:', err);
    if (cardsContainer) {
      cardsContainer.innerHTML = `<p style="color: #fca5a5; font-size: 0.85rem; padding: 1.5rem 0;">Failed to load course progress.</p>`;
    }
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
