import { render, logout } from './router.js?v=10';

window.addEventListener('hashchange', render);
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action="logout"]');
  if (el) { e.preventDefault(); logout(); }
});
render();
