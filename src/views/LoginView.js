import { loginWithEmail } from '../services/auth.js';
import logoImg from '../assets/logo/logo.png';
import '../styles/login.css';

export async function render(container, { router }) {

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
          <h2>Welcome Back</h2>
          <p>Log in with your account credentials</p>
        </div>

        <form id="login-form" class="login-form">
          <div id="alert-box" class="alert-box" style="display: none;"></div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <div class="input-wrapper">
              <input type="email" id="email" placeholder="your@email.com" required />
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

          <button type="submit" class="btn btn-primary btn-block" id="submit-btn">Sign In</button>
        </form>

        <div class="card-footer">
          <p>Don't have an account yet? <a href="https://wa.me/919074894575?text=Hi!%20I%20would%20like%20to%20enroll" target="_blank">Enroll Now</a></p>
        </div>
      </div>
    </div>
  `;

  const submitBtn = container.querySelector('#submit-btn');
  const loginForm = container.querySelector('#login-form');
  const emailInput = container.querySelector('#email');
  const passwordInput = container.querySelector('#password');
  const alertBox = container.querySelector('#alert-box');

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
      const userRole = result.profile?.role || 'student';

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
      submitBtn.textContent = 'Sign In';
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
