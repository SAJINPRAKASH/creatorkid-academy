import './styles/global.css';
import { router } from './router/router.js';

// Register SPA Routes
router.addRoute('/', () => import('./views/HomeView.js'));

router.addRoute('/login', () => import('./views/LoginView.js'), {
  meta: { guestOnly: true }
});

router.addRoute('/dashboard', () => import('./views/DashboardView.js'), {
  meta: { requiresAuth: true, roles: ['student', 'admin'] }
});

router.addRoute('/lesson', () => import('./views/LessonView.js'), {
  meta: { requiresAuth: true, roles: ['student', 'admin'] }
});

router.addRoute('/lesson/:module/:lesson', () => import('./views/LessonView.js'), {
  meta: { requiresAuth: true, roles: ['student', 'admin'] }
});

router.addRoute('/profile', () => import('./views/ProfileView.js'), {
  meta: { requiresAuth: true, roles: ['student', 'admin'] }
});

router.addRoute('/change-password', () => import('./views/ChangePasswordView.js'), {
  meta: { requiresAuth: true, roles: ['student', 'admin'] }
});

router.addRoute('/reset-password', () => import('./views/ResetPasswordView.js'));

router.addRoute('/admin', () => import('./views/AdminView.js'), {
  meta: { requiresAuth: true, roles: ['admin'] }
});

router.addRoute('/not-found', () => import('./views/NotFoundView.js'));
router.addRoute('*', () => import('./views/NotFoundView.js'));

// Initialize Client-Side SPA Router on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  router.init('#app');
});
