import { getCurrentSession, getCurrentProfile } from '../services/auth.js';

class Router {
  constructor() {
    this.routes = [];
    this.currentViewCleanup = null;
    this.appContainer = null;
    this.isNavigating = false;
  }

  init(containerSelector = '#app') {
    this.appContainer = document.querySelector(containerSelector);
    if (!this.appContainer) {
      console.error(`App container ${containerSelector} not found.`);
      return;
    }

    // Handle browser navigation (back/forward)
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname + window.location.search + window.location.hash);
    });

    // Intercept relative link clicks globally
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      const target = link.getAttribute('target');

      // Ignore external links, mailto, tel, whatsapp, hash-only, or new tab links
      if (!href || target === '_blank' || href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
      }

      // Check if it points to an old HTML file or relative path
      if (href.endsWith('.html') || href.startsWith('/')) {
        e.preventDefault();
        const cleanPath = this.normalizeHtmlPath(href);
        this.navigate(cleanPath);
      }
    });

    // Initial route handling
    this.handleRoute(window.location.pathname + window.location.search + window.location.hash);
  }

  normalizeHtmlPath(path) {
    if (!path) return '/';

    // Map old HTML file paths to clean SPA routes
    if (path.includes('/src/pages/login/login.html') || path.includes('../login/login.html')) return '/login';
    if (path.includes('/src/pages/dashboard/dashboard.html') || path.includes('../dashboard/dashboard.html')) return '/dashboard';
    if (path.includes('/src/pages/admin/admin.html') || path.includes('../admin/admin.html')) return '/admin';
    if (path.includes('/src/pages/lesson/lesson.html') || path.includes('../lesson/lesson.html')) return '/lesson';
    if (path.includes('/src/pages/change-password/change-password.html') || path.includes('../change-password/change-password.html')) return '/change-password';
    if (path.includes('/src/pages/reset-password/reset-password.html') || path.includes('../reset-password/reset-password.html')) return '/reset-password';
    if (path.includes('/index.html')) return '/';

    return path;
  }

  addRoute(path, viewLoader, options = {}) {
    // Convert path pattern to regex (e.g. /lesson/:module/:lesson)
    const paramNames = [];
    const regexPath = path === '*' 
      ? /.*/ 
      : new RegExp('^' + path.replace(/:([^/]+)/g, (_, paramName) => {
          paramNames.push(paramName);
          return '([^/]+)';
        }) + '/?$');

    this.routes.push({
      pathPattern: path,
      regex: regexPath,
      paramNames,
      viewLoader,
      meta: options.meta || {} // e.g., { requiresAuth: true, roles: ['student', 'admin'] }
    });
  }

  async navigate(path, replace = false) {
    const normalizedPath = this.normalizeHtmlPath(path);
    if (replace) {
      window.history.replaceState(null, null, normalizedPath);
    } else if (window.location.pathname + window.location.search + window.location.hash !== normalizedPath) {
      window.history.pushState(null, null, normalizedPath);
    }
    await this.handleRoute(normalizedPath);
  }

  async handleRoute(urlPath) {
    if (this.isNavigating) return;
    this.isNavigating = true;

    const [pathname, searchAndHash] = urlPath.split(/(?=[?#])/);
    const searchParams = new URLSearchParams(window.location.search);

    let matchedRoute = null;
    let routeParams = {};

    for (const route of this.routes) {
      const match = pathname.match(route.regex);
      if (match) {
        matchedRoute = route;
        route.paramNames.forEach((name, idx) => {
          routeParams[name] = decodeURIComponent(match[idx + 1]);
        });
        break;
      }
    }

    if (!matchedRoute) {
      const fallbackRoute = this.routes.find(r => r.pathPattern === '/not-found') || this.routes.find(r => r.pathPattern === '*');
      if (fallbackRoute) {
        matchedRoute = fallbackRoute;
      }
    }

    if (!matchedRoute) {
      console.error('No route matched for path:', pathname);
      this.isNavigating = false;
      return;
    }

    // Check Authentication & Role Guards
    let authGuardPassed = false;
    try {
      authGuardPassed = await this.checkAuthGuard(matchedRoute.meta);
    } catch (err) {
      console.error('Auth guard verification failed:', err);
      this.isNavigating = false;
      this.appContainer.innerHTML = `
        <div style="padding: 3rem; text-align: center; color: var(--color-text); background: var(--color-card); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); max-width: 500px; margin: 4rem auto;">
          <h2 style="color: #fca5a5;">Authentication Error</h2>
          <p style="color: var(--color-text-muted); margin-top: 0.75rem; font-size: 0.95rem; line-height: 1.5;">${escapeHtml(err.message || 'An error occurred while verifying your session.')}</p>
          <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1.5rem; padding: 10px 20px;">Reload Application</button>
        </div>
      `;
      return;
    }

    if (!authGuardPassed) {
      this.isNavigating = false;
      return;
    }

    // Execute view cleanup if previously mounted
    if (typeof this.currentViewCleanup === 'function') {
      try {
        this.currentViewCleanup();
      } catch (err) {
        console.warn('Error during view cleanup:', err);
      }
      this.currentViewCleanup = null;
    }

    try {
      // Clear container and load view module
      this.appContainer.innerHTML = '';
      const viewModule = await matchedRoute.viewLoader();
      
      // Render view component
      if (viewModule && typeof viewModule.render === 'function') {
        const cleanup = await viewModule.render(this.appContainer, {
          params: routeParams,
          query: searchParams,
          router: this
        });

        if (typeof cleanup === 'function') {
          this.currentViewCleanup = cleanup;
        }
      }
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(`Failed to load view for path ${pathname}:`, error);
      this.appContainer.innerHTML = `
        <div style="padding: 3rem; text-align: center; color: var(--color-text);">
          <h2>Error Loading View</h2>
          <p style="color: var(--color-text-muted); margin-top: 0.5rem;">${error.message}</p>
          <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Reload Page</button>
        </div>
      `;
    } finally {
      this.isNavigating = false;
    }
  }

  async checkAuthGuard(meta) {
    if (!meta || (!meta.requiresAuth && !meta.guestOnly)) {
      return true;
    }

    const session = await getCurrentSession();

    if (meta.guestOnly) {
      if (session) {
        const profile = await getCurrentProfile();
        this.isNavigating = false; // Release lock before nested navigation
        if (profile && profile.role === 'admin') {
          this.navigate('/admin', true);
        } else {
          this.navigate('/dashboard', true);
        }
        return false;
      }
      return true;
    }

    if (meta.requiresAuth) {
      if (!session) {
        this.isNavigating = false; // Release lock before nested navigation
        this.navigate('/login', true);
        return false;
      }

      const profile = await getCurrentProfile();
      if (meta.roles && meta.roles.length > 0) {
        if (!profile || !meta.roles.includes(profile.role)) {
          this.isNavigating = false; // Release lock before nested navigation
          if (profile && profile.role === 'admin') {
            this.navigate('/admin', true);
          } else {
            this.navigate('/dashboard', true);
          }
          return false;
        }
      }
    }

    return true;
  }
}

export const router = new Router();

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
