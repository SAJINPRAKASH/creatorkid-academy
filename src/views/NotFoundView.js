import logoImg from '../assets/logo/logo.png';

export async function render(container, { router }) {
  container.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: var(--color-bg); padding: 2rem; text-align: center;">
      <a href="/" style="margin-bottom: 2rem;">
        <img src="${logoImg}" alt="CreatorKid Academy" style="height: 48px;" />
      </a>
      <h1 style="font-size: 4rem; font-weight: 800; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem;">404</h1>
      <h2 style="font-size: 1.5rem; color: var(--color-text); margin-bottom: 1rem;">Page Not Found</h2>
      <p style="color: var(--color-text-muted); max-width: 450px; margin-bottom: 2rem; line-height: 1.6;">The page you are looking for doesn't exist or has been moved.</p>
      <a href="/" class="btn btn-primary" style="padding: 0.75rem 1.75rem;">Return to Home</a>
    </div>
  `;

  return () => {};
}
