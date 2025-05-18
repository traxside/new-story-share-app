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
  const swRegistration = await registerServiceWorker('/service-worker.js');
  
  // Then render the application
  await app.renderPage();

  // If user is authenticated, subscribe to push notifications after app renders
  if (Auth.isLoggedIn() && swRegistration) {
    try {
      await subscribeUserToPush(swRegistration);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

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

  // Add notification toggle button to profile page if user is logged in
  if (Auth.isLoggedIn()) {
    window.addEventListener('hashchange', () => {
      const currentUrl = window.location.hash;
      if (currentUrl === '#/profile') {
        setTimeout(() => {
          // Check if button already exists
          if (!document.getElementById('notification-toggle')) {
            const profileSection = document.querySelector('.profile-section');
            if (profileSection) {
              const notificationBtn = document.createElement('button');
              notificationBtn.id = 'notification-toggle';
              notificationBtn.className = 'btn btn-primary';
              notificationBtn.textContent = 'Enable Notifications';
              profileSection.appendChild(notificationBtn);
              
              // Update button state based on current subscription
              const { updateSubscriptionButton, togglePushNotification } = require('./utils/notification-helper');
              updateSubscriptionButton(swRegistration, notificationBtn);
              
              // Add event listener
              notificationBtn.addEventListener('click', () => {
                togglePushNotification(swRegistration, notificationBtn);
              });
            }
          }
        }, 300);
      }
    });
  }
});