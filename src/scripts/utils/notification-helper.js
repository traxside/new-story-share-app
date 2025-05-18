// CSS imports
import '../styles/styles.css';

import App from './pages/app';
import { registerServiceWorker, subscribeUserToPush } from './utils/notification-helper';
import CONFIG from './config';
import Auth from './data/auth';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  const mainContent = document.querySelector('#main-content');
  const skipLink = document.querySelector('.skip-link');
  
  skipLink.addEventListener('click', function (event) {
      event.preventDefault(); // Prevent page refresh
      
      // Focus on main content and scroll to it
      mainContent.focus(); // Focus on main content
      mainContent.scrollIntoView({behavior: 'smooth'}); // Scroll to main content smoothly
  });

  // Register service worker
  const swRegistration = await registerServiceWorker();
  
  // If user is authenticated, subscribe to push notifications
  if (Auth.isAuthenticated() && swRegistration) {
    await subscribeUserToPush(swRegistration);
  }
});