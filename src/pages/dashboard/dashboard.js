import { requireAuth, logout } from '../../services/auth.js';
import { getUserProgress } from '../../services/progress.js';
import { getAnnouncements } from '../../services/announcement.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Guard route & get profile
  const auth = await requireAuth(['student', 'admin']);
  if (!auth) return;

  const { profile } = auth;

  // Render user header info
  const navUserName = document.getElementById('nav-user-name');
  const navUserAvatar = document.getElementById('nav-user-avatar');
  const studentName = document.getElementById('student-name');
  const userRoleBadge = document.getElementById('user-role-badge');
  const logoutBtn = document.getElementById('logout-btn');

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

  logoutBtn.addEventListener('click', () => logout());

  // Load Student Progress dynamically from course.json & Supabase
  loadStudentProgress(profile.id);

  // Load Announcements
  loadAnnouncements();
});

async function loadStudentProgress(userId) {
  const completedText = document.getElementById('completed-count-text');
  const overallPercentage = document.getElementById('overall-percentage');
  const progressBarFill = document.getElementById('overall-progress-bar');
  const continueBtn = document.getElementById('continue-learning-btn');

  const statCompleted = document.getElementById('stat-completed-lessons');
  const statRemaining = document.getElementById('stat-remaining-lessons');
  const statModule = document.getElementById('stat-current-module');

  try {
    let totalLessonsCount = 40;
    let courseData = null;
    try {
      const res = await fetch('../../config/course.json');
      if (res.ok) {
        courseData = await res.json();
        totalLessonsCount = courseData.reduce((acc, m) => acc + (m.videos ? m.videos.length : 0), 0);
      }
    } catch (e) {
      console.warn('Using default total lessons count');
    }

    const records = await getUserProgress(userId);
    const completedCount = records.filter(r => r.completed).length;
    const remainingCount = Math.max(0, totalLessonsCount - completedCount);
    const percentage = Math.min(100, Math.round((completedCount / totalLessonsCount) * 100));

    if (completedText) completedText.textContent = `${completedCount} of ${totalLessonsCount} lessons completed`;
    if (overallPercentage) overallPercentage.textContent = `${percentage}%`;
    if (progressBarFill) progressBarFill.style.width = `${percentage}%`;

    if (statCompleted) statCompleted.textContent = completedCount;
    if (statRemaining) statRemaining.textContent = remainingCount;

    // Highlight last active lesson & module for Continue Learning
    if (records.length > 0 && continueBtn) {
      const sorted = [...records].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      const lastActive = sorted[0];
      if (lastActive && lastActive.lesson_id) {
        const cleanTitle = lastActive.lesson_id.replace(/\.mp4/g, '');
        continueBtn.textContent = `▶ Continue: ${cleanTitle}`;

        // Find module for this lesson
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

async function loadAnnouncements() {
  const container = document.getElementById('announcements-list');
  if (!container) return;

  try {
    const list = await getAnnouncements();
    if (!list || list.length === 0) {
      container.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.85rem; padding: 1rem 0;">No announcements posted yet.</p>';
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="announcement-item ${item.pinned ? 'pinned' : ''}">
        <h4>${item.pinned ? '📌 ' : ''}${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.message)}</p>
        <span class="announcement-date">${new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load announcements:', err);
    container.innerHTML = '<p style="color: #fca5a5; font-size: 0.85rem;">Failed to load announcements.</p>';
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
