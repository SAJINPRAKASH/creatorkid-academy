import { loginWithEmail, redirectIfAuthenticated } from '../services/auth.js';
import logoImg from '../assets/logo/logo.png';
import '../styles/login.css';

export async function render(container, { router }) {
  // If already authenticated, redirect immediately
  await redirectIfAuthenticated();

  container.innerHTML = `
    <div class="login-wrapper">
      <div class="background-glow"></div>
      <div class="login-header">
        <a href="/" class="logo">
          <img src="${logoImg}" alt="CreatorKid Academy" class="nav-logo" />
        </a>
      </div>

      <div class="login-card">
        <div class="card-header">
          <h2 id="card-title">Welcome Back</h2>
          <p id="card-subtitle">Log in to access your courses and learning portal</p>
        </div>

        <div class="role-selector">
          <button type="button" class="role-btn active" data-role="student">Student Login</button>
          <button type="button" class="role-btn" data-role="admin">Admin Portal</button>
        </div>

        <form id="login-form" class="login-form">
          <div id="alert-box" class="alert-box" style="display: none;"></div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <div class="input-wrapper">
              <input type="email" id="email" placeholder="student@creatorkid.com" required />
            </div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="password">Password</label>
              <a href="/reset-password" class="forgot-link">Forgot Password?</a>
            </div>
            <div class="input-wrapper">
              <input type="password" id="password" placeholder="••••••••" required />
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" id="remember" checked />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="submit-btn">Sign In to Student Portal</button>
        </form>

        <div class="card-footer">
          <p>Don't have an account yet? <a href="https://wa.me/919074894575?text=Hi!%20I%20would%20like%20to%20enroll" target="_blank">Enroll Now</a></p>
        </div>
      </div>
    </div>
  `;

  const roleBtns = container.querySelectorAll('.role-btn');
  const cardTitle = container.querySelector('#card-title');
  const cardSubtitle = container.querySelector('#card-subtitle');
  const submitBtn = container.querySelector('#submit-btn');
  const loginForm = container.querySelector('#login-form');
  const emailInput = container.querySelector('#email');
  const passwordInput = container.querySelector('#password');
  const alertBox = container.querySelector('#alert-box');

  let currentRole = 'student';

  // Role toggle
  roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRole = btn.dataset.role;

      if (currentRole === 'admin') {
        cardTitle.textContent = 'Admin Portal';
        cardSubtitle.textContent = 'Sign in to manage students and course access';
        submitBtn.textContent = 'Sign In to Admin Dashboard';
        emailInput.placeholder = 'admin@creatorkid.com';
      } else {
        cardTitle.textContent = 'Welcome Back';
        cardSubtitle.textContent = 'Log in to access your courses and learning portal';
        submitBtn.textContent = 'Sign In to Student Portal';
        emailInput.placeholder = 'student@creatorkid.com';
      }
      hideAlert();
    });
  });

  // Handle Form Submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showAlert('Please enter both email and password.', 'error');
      return;
    }

    submitBtn.textContent = 'Authenticating...';
    submitBtn.disabled = true;
    hideAlert();

    try {
      const result = await loginWithEmail(email, password);
      const userRole = result.profile?.role || currentRole;

      showAlert('Authentication successful! Redirecting...', 'success');

      setTimeout(() => {
        if (userRole === 'admin') {
          router.navigate('/admin');
        } else {
          router.navigate('/dashboard');
        }
      }, 600);
    } catch (err) {
      showAlert(err.message, 'error');
      submitBtn.textContent = currentRole === 'admin' ? 'Sign In to Admin Dashboard' : 'Sign In to Student Portal';
      submitBtn.disabled = false;
    }
  };

  loginForm.addEventListener('submit', handleFormSubmit);

  function showAlert(msg, type) {
    alertBox.textContent = msg;
    alertBox.className = `alert-box ${type}`;
    alertBox.style.display = 'block';
  }

  function hideAlert() {
    alertBox.style.display = 'none';
  }

  return () => {};
}
