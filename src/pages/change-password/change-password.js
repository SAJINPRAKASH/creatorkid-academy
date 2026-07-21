import { updatePassword, requireAuth } from '../../services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Protect route - requires logged in user
  const auth = await requireAuth(['student', 'admin']);
  if (!auth) return;

  const form = document.getElementById('change-password-form');
  const newPassInput = document.getElementById('new-pass');
  const confirmPassInput = document.getElementById('confirm-pass');
  const alertBox = document.getElementById('alert-box');
  const saveBtn = document.getElementById('save-btn');
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');

  // Strength Indicator
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
        window.location.href = '../dashboard/dashboard.html';
      }, 1200);
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
});
