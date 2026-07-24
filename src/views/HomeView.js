import { getCurrentSession, getCurrentProfile } from '../services/auth.js';
import logoImg from '../assets/logo/logo.png';
import photoshopCourseImg from '../assets/images/photoshop-course.png';

export async function render(container, { router }) {
  container.innerHTML = `
    <!-- Navbar -->
    <nav class="navbar">
      <div class="container">
        <a href="/" class="logo">
          <img src="${logoImg}" alt="CreatorKid Academy" class="nav-logo" />
        </a>
        <div class="nav-links">
          <a href="/" class="active" style="color: var(--color-primary);">The Course</a>
        </div>
        <div class="nav-actions" id="nav-actions-container">
          <a href="/login" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">Login</a>
        </div>
        <button class="mobile-menu-btn">☰</button>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <!-- Hero Section -->
      <section class="hero">
        <div class="container animate-slide-up" style="position: relative; z-index: 10;">
          <div class="hero-badge">Signature Course Available</div>
          <h1 class="hero-title text-gradient">Master Photoshop.<br/>Unleash Creativity.</h1>
          <p class="hero-description">The ultimate Photoshop course designed specifically for the next generation of digital artists. Bring your boldest ideas to life.</p>
          <div class="flex justify-center flex-wrap" style="gap: var(--spacing-md); margin-top: var(--spacing-lg);">
            <a href="/login" class="btn btn-primary hero-btn" id="hero-login-btn">Student Login</a>
          </div>
        </div>
      </section>

      <!-- Featured Course Section -->
      <section class="courses">
        <div class="container">
           <div class="featured-card animate-slide-up">
              <div>
                <img src="${photoshopCourseImg}" alt="Photoshop Masterclass" class="card-image" style="height: auto; width: 100%; border-radius: var(--radius-lg); box-shadow: 0 20px 40px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);" />
              </div>
              <div>
                <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">Photoshop Masterclass</h2>
                <p style="font-size: 1.1rem; margin-bottom: 1.5rem; color: var(--color-text-muted);">Go from absolute beginner to digital artist. Learn layers, masking, compositing, typography, and advanced retouching techniques in this comprehensive 6-week journey.</p>
                <ul style="list-style: none; margin-bottom: 2.5rem; color: var(--color-text);">
                  <li style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 10px;"><span style="color: var(--color-accent); font-weight: bold;">✓</span> 80+ HD Video Lessons</li>
                  <li style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 10px;"><span style="color: var(--color-accent); font-weight: bold;">✓</span> Downloadable Project Files</li>
                  <li style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 10px;"><span style="color: var(--color-accent); font-weight: bold;">✓</span> Portfolio Live Tutorial</li>
                  <li style="display: flex; align-items: center; gap: 10px;"><span style="color: var(--color-accent); font-weight: bold;">✓</span> Lifetime Access</li>
                </ul>
                <div class="flex wrap" style="gap: 1.5rem; align-items: center;">
                  <a href="https://wa.me/919074894575?text=Hi!%20I%20would%20like%20to%20enroll%20in%20the%20Photoshop%20Masterclass." target="_blank" class="btn btn-primary" style="padding: 0.75rem 1.75rem; font-size: 1rem;">
                    Enroll Now - ₹1999 <span style="text-decoration: line-through; opacity: 0.7; font-size: 0.85em; margin-left: 0.5rem; font-weight: 400;">₹5999</span>
                  </a>
                  <span style="color: var(--color-text-muted); font-size: 0.95rem; font-weight: 500;">★★★★★ 4.9 (120+ reviews)</span>
                </div>
              </div>
           </div>
        </div>
      </section>

      <!-- Syllabus Preview -->
      <section class="features" style="background-color: rgba(18, 24, 38, 0.5); margin-top: 2rem; padding: 5rem 0;">
        <div class="container">
          <h2 class="text-center" style="margin-bottom: var(--spacing-2xl); font-size: 2.25rem;">What You Will Build</h2>
          <div class="grid md:grid-cols-3">
            <div class="card" style="background: var(--color-bg); border-top: 4px solid var(--color-primary);">
              <h3 style="color: var(--color-text); margin-bottom: 1rem; font-size: 1.4rem;">Module 1: The Basics</h3>
              <p style="color: var(--color-text-muted); line-height: 1.7;">Master the interface, selection tools, and the power of non-destructive layer workflows.</p>
            </div>
            <div class="card" style="background: var(--color-bg); border-top: 4px solid var(--color-secondary);">
              <h3 style="color: var(--color-text); margin-bottom: 1rem; font-size: 1.4rem;">Module 2: Typography & Layout</h3>
              <p style="color: var(--color-text-muted); line-height: 1.7;">Learn to pair fonts, establish visual hierarchy, and design stunning posters and thumbnails.</p>
            </div>
            <div class="card" style="background: var(--color-bg); border-top: 4px solid var(--color-accent);">
              <h3 style="color: var(--color-text); margin-bottom: 1rem; font-size: 1.4rem;">Module 3: Compositing</h3>
              <p style="color: var(--color-text-muted); line-height: 1.7;">Blend multiple images seamlessly using advanced masking and lighting techniques.</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <img src="${logoImg}" alt="CreatorKid Academy" class="nav-logo" style="margin-bottom: var(--spacing-md);" />
            <p>Empowering the next generation of digital creators.</p>
          </div>
          <div class="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="/">The Course</a></li>
              <li><a href="https://wa.me/919074894575?text=Hi!%20I%20would%20like%20to%20enroll" target="_blank">Pricing</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="https://wa.me/919074894575" target="_blank">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 CreatorKid Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;

  // Dynamic navbar state update based on auth
  try {
    const session = await getCurrentSession();
    if (session) {
      const profile = await getCurrentProfile();
      const navActions = container.querySelector('#nav-actions-container');
      const heroBtn = container.querySelector('#hero-login-btn');
      if (profile) {
        const targetRoute = profile.role === 'admin' ? '/admin' : '/dashboard';
        const label = profile.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard';
        if (navActions) {
          navActions.innerHTML = `
            <a href="${targetRoute}" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">${label} →</a>
          `;
        }
        if (heroBtn) {
          heroBtn.href = targetRoute;
          heroBtn.textContent = 'Go to Dashboard';
        }
      }
    }
  } catch (e) {
    console.log('Home page auth check completed.');
  }

  return () => {}; // Cleanup handler if needed
}
