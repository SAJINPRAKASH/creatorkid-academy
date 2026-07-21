import { requestPasswordReset, updatePassword } from '../../services/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const step1Container = document.getElementById('step-1-container');
  const step2Container = document.getElementById('step-2-container');
  const step3Container = document.getElementById('step-3-container');
  const step4Container = document.getElementById('step-4-container');

  const step1Badge = document.getElementById('step1-badge');
  const step2Badge = document.getElementById('step2-badge');
  const step3Badge = document.getElementById('step3-badge');

  const step1Form = document.getElementById('step-1-form');
  const step2Form = document.getElementById('step-2-form');
  const step3Form = document.getElementById('step-3-form');

  const alertStep1 = document.getElementById('alert-step1');
  const alertStep2 = document.getElementById('alert-step2');
  const alertStep3 = document.getElementById('alert-step3');

  const resetEmail = document.getElementById('reset-email');
  const otpSentText = document.getElementById('otp-sent-text');

  const newPassword = document.getElementById('new-password');
  const confirmPassword = document.getElementById('confirm-password');
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');

  // Check if user arrived via Supabase Password Recovery link token
  if (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
    step1Container.style.display = 'none';
    step2Container.style.display = 'none';
    step3Container.style.display = 'block';
    step1Badge.className = 'step completed';
    step2Badge.className = 'step completed';
    step3Badge.className = 'step active';
  }

  // Step 1: Send Password Reset Email via Supabase
  step1Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = resetEmail.value.trim();
    if (!email) {
      showAlert(alertStep1, 'Please enter a valid email address.', 'error');
      return;
    }

    const submitBtn = step1Form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
      await requestPasswordReset(email);
      otpSentText.textContent = `Password recovery link has been sent to ${email}. Check your inbox.`;
      showAlert(alertStep1, 'Reset link sent! Please check your email.', 'success');

      setTimeout(() => {
        step1Container.style.display = 'none';
        step2Container.style.display = 'block';
        step1Badge.className = 'step completed';
        step2Badge.className = 'step active';
      }, 1200);
    } catch (err) {
      showAlert(alertStep1, err.message, 'error');
      submitBtn.textContent = 'Send Reset Code';
      submitBtn.disabled = false;
    }
  });

  // Step 2: Verify Code / Instructions
  step2Form.addEventListener('submit', (e) => {
    e.preventDefault();
    showAlert(alertStep2, 'Moving to password reset...', 'success');
    setTimeout(() => {
      step2Container.style.display = 'none';
      step3Container.style.display = 'block';
      step2Badge.className = 'step completed';
      step3Badge.className = 'step active';
      newPassword.focus();
    }, 800);
  });

  // Password Strength Indicator
  newPassword.addEventListener('input', () => {
    const val = newPassword.value;
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

  // Step 3: Update Password via Supabase Auth
  step3Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = newPassword.value;
    const confirm = confirmPassword.value;

    if (pass.length < 6) {
      showAlert(alertStep3, 'Password must be at least 6 characters long.', 'error');
      return;
    }

    if (pass !== confirm) {
      showAlert(alertStep3, 'Passwords do not match.', 'error');
      return;
    }

    const submitBtn = step3Form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Updating...';
    submitBtn.disabled = true;

    try {
      await updatePassword(pass);
      showAlert(alertStep3, 'Password updated successfully!', 'success');
      setTimeout(() => {
        step3Container.style.display = 'none';
        step4Container.style.display = 'block';
        step3Badge.className = 'step completed';
      }, 800);
    } catch (err) {
      showAlert(alertStep3, err.message, 'error');
      submitBtn.textContent = 'Update Password';
      submitBtn.disabled = false;
    }
  });

  function showAlert(elem, msg, type) {
    elem.textContent = msg;
    elem.className = `alert-box ${type}`;
    elem.style.display = 'block';
  }
});
