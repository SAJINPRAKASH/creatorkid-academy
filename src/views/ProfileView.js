import { requireAuth } from '../services/auth.js';
import logoImg from '../assets/logo/logo.png';
import '../styles/profile.css';
import '../styles/dashboard.css';

export async function render(container, { router }) {
  const auth = await requireAuth(['student', 'admin']);
  if (!auth) return () => {};

  const { profile } = auth;
  const avatarLetter = (profile.full_name || 'U').charAt(0).toUpperCase();

  container.innerHTML = `
    <!-- Minimal Navbar -->
    <nav class="dash-navbar">
      <div class="nav-container">
        <a href="/" class="logo">
          <img src="${logoImg}" alt="CreatorKid Academy" class="nav-logo" />
        </a>
        <div class="nav-right">
          <a href="/dashboard" class="btn btn-secondary btn-sm">Dashboard</a>
          <a href="/change-password" class="btn btn-secondary btn-sm">Change Password</a>
        </div>
      </div>
    </nav>

    <main class="container">
      <div class="profile-card">
        <div class="profile-header-block">
          <div class="profile-large-avatar">${avatarLetter}</div>
          <div>
            <span class="badge-role">${(profile.role || 'student').toUpperCase()}</span>
            <h2 style="margin-top: 4px; font-size: 1.5rem;">${escapeHtml(profile.full_name || 'User Profile')}</h2>
            <p style="color: var(--color-text-muted); font-size: 0.9rem;">${escapeHtml(profile.email || '')}</p>
          </div>
        </div>

        <div class="profile-details-grid">
          <div class="profile-field">
            <span class="profile-field-label">Full Name</span>
            <span class="profile-field-value">${escapeHtml(profile.full_name || 'Not provided')}</span>
          </div>

          <div class="profile-field">
            <span class="profile-field-label">Email Address</span>
            <span class="profile-field-value">${escapeHtml(profile.email || 'Not provided')}</span>
          </div>

          <div class="profile-field">
            <span class="profile-field-label">Account Role</span>
            <span class="profile-field-value">${(profile.role || 'student').toUpperCase()}</span>
          </div>

          <div class="profile-field">
            <span class="profile-field-label">Enrolled Course</span>
            <span class="profile-field-value">🎨 Photoshop Masterclass</span>
          </div>
        </div>

        <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
          <a href="/dashboard" class="btn btn-secondary">← Back to Dashboard</a>
          <a href="/change-password" class="btn btn-primary">Change Password</a>
        </div>
      </div>
    </main>
  `;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return () => {};
}
