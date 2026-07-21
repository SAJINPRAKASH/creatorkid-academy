import { updatePassword, requireAuth } from '../services/auth.js';
import logoImg from '../assets/logo/logo.png';
import '../styles/change-password.css';

export async function render(container, { router }) {
  const auth = await requireAuth(['student', 'admin']);
  if (!auth) return () => {};

  container.innerHTML = `
    <div class="change-wrapper">
      <div class="background-glow"></div>
      <div class="change-header">
        <a href="/dashboard" class="logo">
          <img src="${logoImg}" alt="CreatorKid Academy" class="nav-logo" />
        </a>
      </div>

      <div class="change-card">
        <div class="card-header">
          <h2>Change Password</h2>
          <p>Update your account password securely</p>
        </div>

        <form id="change-password-form">
          <div id="alert-box" class="alert-box" style="display: none;"></div>

          <div class="form-group">
            <label for="new-pass">New Password</label>
            <div class="input-wrapper">
              <input type="password" id="new-pass" placeholder="••••••••" required />
            </div>
            <div class="strength-bar-wrapper">
              <div class="strength-bar" id="strength-bar"></div>
            </div>
            <span class="strength-text" id="strength-text">Password strength: Empty</span>
          </div>

          <div class="form-group" style="margin-top: 1rem;">
            <label for="confirm-pass">Confirm New Password</label>
            <div class="input-wrapper">
              <input type="password" id="confirm-pass" placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1.5rem;" id="save-btn">Update Password</button>
        </form>

        <div class="card-footer" style="margin-top: 1.5rem; text-align: center;">
          <a href="/dashboard" class="back-link">← Back to Dashboard</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#change-password-form');
  const newPassInput = container.querySelector('#new-pass');
  const confirmPassInput = container.querySelector('#confirm-pass');
  const alertBox = container.querySelector('#alert-box');
  const saveBtn = container.querySelector('#save-btn');
  const strengthBar = container.querySelector('#strength-bar');
  const strengthText = container.querySelector('#strength-text');

  // Strength Indicator Listener
  newPassInput.addEventListener('input', () => {
    const val = newPassInput.value;
    if (!val) {
      strengthBar.style.width = '0%';
      strengthBar.style.background = 'transparent';
      strengthText.textContent = 'Password strength: Empty';
      return;
    }

    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 2) {
      strengthBar.style.width = '33%';
      strengthBar.style.background = '#ef4444';
      strengthText.textContent = 'Password strength: Weak';
    } else if (score <= 4) {
      strengthBar.style.width = '66%';
      strengthBar.style.background = '#f59e0b';
      strengthText.textContent = 'Password strength: Medium';
    } else {
      strengthBar.style.width = '100%';
      strengthBar.style.background = '#10b981';
      strengthText.textContent = 'Password strength: Strong';
    }
  });

  // Form Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = newPassInput.value;
    const confirm = confirmPassInput.value;

    if (pass.length < 6) {
      showAlert('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (pass !== confirm) {
      showAlert('Passwords do not match.', 'error');
      return;
    }

    saveBtn.textContent = 'Updating...';
    saveBtn.disabled = true;

    try {
      await updatePassword(pass);
      showAlert('Password updated successfully! Redirecting...', 'success');
      setTimeout(() => {
        router.navigate('/dashboard');
      }, 1000);
    } catch (err) {
      showAlert(err.message, 'error');
      saveBtn.textContent = 'Update Password';
      saveBtn.disabled = false;
    }
  });

  function showAlert(msg, type) {
    alertBox.textContent = msg;
    alertBox.className = `alert-box ${type}`;
    alertBox.style.display = 'block';
  }

  return () => {};
}
