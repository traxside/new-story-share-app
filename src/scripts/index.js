import '../styles/styles.css';

import App from './pages/app';
import { registerServiceWorker, subscribeUserToPush } from './utils/notification-helper';
import Auth from './data/auth';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  
  // Register service worker first (before rendering app)
  const swRegistration = await registerServiceWorker();
  
  // If user is authenticated, subscribe to push notifications
  if (Auth.isLoggedIn() && swRegistration) {
    await subscribeUserToPush(swRegistration);
  }
  
  // Then render the application
  await app.renderPage();

  // Setup event listeners
  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  // Accessibility improvement - skip to content
  const mainContent = document.querySelector('#main-content');
  const skipLink = document.querySelector('.skip-link');
  
  if (skipLink && mainContent) {
    skipLink.addEventListener('click', function (event) {
      event.preventDefault(); // Prevent page refresh
      
      // Focus on main content and scroll to it
      mainContent.focus(); // Focus on main content
      mainContent.scrollIntoView({behavior: 'smooth'}); // Scroll to main content smoothly
    });
  }
  
  // Check if the app was launched from installed PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App is running in standalone mode (installed PWA)');
  }
});