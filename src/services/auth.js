import { supabase } from './supabase.js';
import { router } from '../router/router.js';

/**
 * Log in student or administrator with Email and Password.
 */
export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }

  // Fetch user profile to get role
  const profile = await getCurrentProfile();
  return { user: data.user, session: data.session, profile };
}

/**
 * Log out current user and clear session.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
  }
  router.navigate('/login');
}

/**
 * Send password reset recovery email.
 */
export async function requestPasswordReset(email) {
  const redirectTo = `${window.location.origin}/reset-password`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
  return data;
}

/**
 * Update current logged-in user password.
 */
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
  return data;
}

/**
 * Get current active session.
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error fetching session:', error.message);
    return null;
  }
  return session;
}

/**
 * Get current authenticated user.
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get user profile record from `profiles` table.
 */
export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error.message);
  }

  // Fallback profile if record not yet populated
  return profile || {
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email.split('@')[0],
    email: user.email,
    role: user.user_metadata?.role || 'student',
    avatar_url: user.user_metadata?.avatar_url || null,
  };
}

/**
 * Protect private pages: Redirects to login if user is not authenticated or not authorized.
 */
export async function requireAuth(allowedRoles = ['student', 'admin']) {
  const session = await getCurrentSession();
  if (!session) {
    router.navigate('/login');
    return null;
  }

  const profile = await getCurrentProfile();
  if (!profile || !allowedRoles.includes(profile.role)) {
    if (profile && profile.role === 'admin') {
      router.navigate('/admin');
    } else {
      router.navigate('/dashboard');
    }
    return null;
  }

  return { session, profile };
}

/**
 * Redirect logged-in users away from auth pages (login, reset password) to their dashboard.
 */
export async function redirectIfAuthenticated() {
  const session = await getCurrentSession();
  if (session) {
    const profile = await getCurrentProfile();
    if (profile && profile.role === 'admin') {
      router.navigate('/admin');
    } else {
      router.navigate('/dashboard');
    }
  }
}

/**
 * Subscribe to auth state changes (login, logout, token refresh).
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * Converts Supabase auth error codes to user-friendly error messages.
 */
function getFriendlyErrorMessage(error) {
  const msg = error.message.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Your email has not been confirmed yet.';
  }
  if (msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (msg.includes('user not found')) {
    return 'No account registered with this email address.';
  }
  return error.message || 'An unexpected error occurred. Please try again.';
}
