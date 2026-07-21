import { loginWithEmail, redirectIfAuthenticated } from '../../services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Redirect if user is already logged in
  await redirectIfAuthenticated();

  const roleBtns = document.querySelectorAll('.role-btn');
  const cardTitle = document.getElementById('card-title');
  const cardSubtitle = document.getElementById('card-subtitle');
  const submitBtn = document.getElementById('submit-btn');
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const alertBox = document.getElementById('alert-box');

  let currentRole = 'student';

  // Switch role
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

  // Handle Form Submit with Supabase Auth
  loginForm.addEventListener('submit', async (e) => {
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
      // Supabase Authentication
      const result = await loginWithEmail(email, password);
      const userRole = result.profile?.role || currentRole;

      showAlert('Authentication successful! Redirecting...', 'success');

      setTimeout(() => {
        if (userRole === 'admin') {
          window.location.href = '../admin/admin.html';
        } else {
          window.location.href = '../dashboard/dashboard.html';
        }
      }, 800);
    } catch (err) {
      showAlert(err.message, 'error');
      submitBtn.textContent = currentRole === 'admin' ? 'Sign In to Admin Dashboard' : 'Sign In to Student Portal';
      submitBtn.disabled = false;
    }
  });

  function showAlert(msg, type) {
    alertBox.textContent = msg;
    alertBox.className = `alert-box ${type}`;
    alertBox.style.display = 'block';
  }

  function hideAlert() {
    alertBox.style.display = 'none';
  }
});
