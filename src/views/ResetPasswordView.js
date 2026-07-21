import { requestPasswordReset, updatePassword } from '../services/auth.js';
import logoImg from '../assets/logo/logo.png';
import '../styles/reset-password.css';

export async function render(container, { router }) {
  container.innerHTML = `
    <div class="reset-wrapper">
      <div class="background-glow"></div>
      <div class="reset-header">
        <a href="/" class="logo">
          <img src="${logoImg}" alt="CreatorKid Academy" class="nav-logo" />
        </a>
      </div>

      <div class="reset-card">
        <div class="step-indicator">
          <span class="step active" id="step1-badge">1. Email</span>
          <span class="step-line"></span>
          <span class="step" id="step2-badge">2. Verification</span>
          <span class="step-line"></span>
          <span class="step" id="step3-badge">3. New Password</span>
        </div>

        <!-- Step 1: Enter Email -->
        <div id="step-1-container">
          <div class="card-header">
            <h2>Reset Password</h2>
            <p>Enter your registered email address to receive a verification code</p>
          </div>

          <form id="step-1-form">
            <div id="alert-step1" class="alert-box" style="display: none;"></div>

            <div class="form-group">
              <label for="reset-email">Email Address</label>
              <div class="input-wrapper">
                <input type="email" id="reset-email" placeholder="student@creatorkid.com" required />
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Send Reset Code</button>
          </form>
        </div>

        <!-- Step 2: Verification Code -->
        <div id="step-2-container" style="display: none;">
          <div class="card-header">
            <h2>Check Your Email</h2>
            <p id="otp-sent-text">We sent a recovery link to your email.</p>
          </div>

          <form id="step-2-form">
            <div id="alert-step2" class="alert-box" style="display: none;"></div>

            <div class="otp-inputs">
              <input type="text" maxlength="1" class="otp-box" autofocus />
              <input type="text" maxlength="1" class="otp-box" />
              <input type="text" maxlength="1" class="otp-box" />
              <input type="text" maxlength="1" class="otp-box" />
            </div>

            <button type="submit" class="btn btn-primary btn-block">Verify Code</button>
            <div class="resend-text">Didn't receive code? <button type="button" id="resend-btn" class="text-btn">Resend OTP</button></div>
          </form>
        </div>

        <!-- Step 3: Set New Password -->
        <div id="step-3-container" style="display: none;">
          <div class="card-header">
            <h2>Create New Password</h2>
            <p>Ensure your new password is at least 6 characters long</p>
          </div>

          <form id="step-3-form">
            <div id="alert-step3" class="alert-box" style="display: none;"></div>

            <div class="form-group">
              <label for="new-password">New Password</label>
              <div class="input-wrapper">
                <input type="password" id="new-password" placeholder="••••••••" required />
              </div>
              <div class="strength-bar-wrapper">
                <div class="strength-bar" id="strength-bar"></div>
              </div>
              <span class="strength-text" id="strength-text">Password strength: Empty</span>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label for="confirm-password">Confirm New Password</label>
              <div class="input-wrapper">
                <input type="password" id="confirm-password" placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1rem;">Update Password</button>
          </form>
        </div>

        <!-- Step 4: Success Screen -->
        <div id="step-4-container" style="display: none; text-align: center;">
          <div class="success-icon">✓</div>
          <h2 style="font-size: 1.6rem; margin-bottom: 0.5rem; color: #fff;">Password Reset Complete!</h2>
          <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Your password has been successfully updated. You can now log in with your new password.</p>
          <a href="/login" class="btn btn-primary btn-block">Back to Login</a>
        </div>

        <div class="card-footer" style="margin-top: 1.5rem; text-align: center;">
          <a href="/login" class="back-link">← Return to Login</a>
        </div>
      </div>
    </div>
  `;

  const step1Container = container.querySelector('#step-1-container');
  const step2Container = container.querySelector('#step-2-container');
  const step3Container = container.querySelector('#step-3-container');
  const step4Container = container.querySelector('#step-4-container');

  const step1Badge = container.querySelector('#step1-badge');
  const step2Badge = container.querySelector('#step2-badge');
  const step3Badge = container.querySelector('#step3-badge');

  const step1Form = container.querySelector('#step-1-form');
  const step2Form = container.querySelector('#step-2-form');
  const step3Form = container.querySelector('#step-3-form');

  const alertStep1 = container.querySelector('#alert-step1');
  const alertStep2 = container.querySelector('#alert-step2');
  const alertStep3 = container.querySelector('#alert-step3');

  const resetEmail = container.querySelector('#reset-email');
  const otpSentText = container.querySelector('#otp-sent-text');

  const newPassword = container.querySelector('#new-password');
  const confirmPassword = container.querySelector('#confirm-password');
  const strengthBar = container.querySelector('#strength-bar');
  const strengthText = container.querySelector('#strength-text');

  // Supabase Password Recovery Token Check
  if (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
    step1Container.style.display = 'none';
    step2Container.style.display = 'none';
    step3Container.style.display = 'block';
    step1Badge.className = 'step completed';
    step2Badge.className = 'step completed';
    step3Badge.className = 'step active';
  }

  // Step 1: Send Password Reset Link
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
      }, 1000);
    } catch (err) {
      showAlert(alertStep1, err.message, 'error');
      submitBtn.textContent = 'Send Reset Code';
      submitBtn.disabled = false;
    }
  });

  // Step 2: Verification step
  step2Form.addEventListener('submit', (e) => {
    e.preventDefault();
    showAlert(alertStep2, 'Moving to password reset...', 'success');
    setTimeout(() => {
      step2Container.style.display = 'none';
      step3Container.style.display = 'block';
      step2Badge.className = 'step completed';
      step3Badge.className = 'step active';
      newPassword.focus();
    }, 600);
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

  // Step 3: Update Password
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
      }, 600);
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

  return () => {};
}
