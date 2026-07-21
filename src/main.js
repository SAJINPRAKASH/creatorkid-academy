import './styles/global.css';
import { getCurrentSession, getCurrentProfile } from './services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const session = await getCurrentSession();
    if (session) {
      const profile = await getCurrentProfile();
      const navActions = document.querySelector('.nav-actions');
      if (navActions && profile) {
        const targetUrl = profile.role === 'admin' ? '/src/pages/admin/admin.html' : '/src/pages/dashboard/dashboard.html';
        const label = profile.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard';
        navActions.innerHTML = `
          <a href="${targetUrl}" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">${label} →</a>
        `;
      }
    }
  } catch (e) {
    console.log('Landing page initialized.');
  }
});
