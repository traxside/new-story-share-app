import '../styles/styles.css';

import App from './pages/app';
import { registerServiceWorker, subscribeUserToPush } from './utils/notification-helper';
import 'regenerator-runtime';
import Auth from './data/auth';
import StoryIdb from './data/idb';

// Service worker registration
const registerSW = async () => {
  // Skip service worker registration in development with HMR to avoid issues
  if (process.env.NODE_ENV !== 'production' && module.hot) {
    console.log('Development with HMR detected - skipping service worker registration');
    return null;
  }
  
  try {
    return await registerServiceWorker('/service-worker.js');
  } catch (error) {
    console.error('Failed to register service worker:', error);
    return null;
  }
};

let swRegistration = null;

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  
  // First register service worker - before app rendering
  swRegistration = await registerSW();
  
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
    const addNotificationButton = () => {
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
    };
    
    // Initial check for profile page
    if (window.location.hash === '#/profile') {
      setTimeout(addNotificationButton, 300);
    }
    
    // Add listener for navigation to profile page
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#/profile') {
        setTimeout(addNotificationButton, 300);
      }
    });
  }
});

// Accept HMR updates for development
if (module.hot) {
  // Accept updates for specific modules only
  module.hot.accept('./pages/app', () => {
    console.log('Hot Module Replacement: App module updated');
  });
  
  module.hot.accept('./utils/notification-helper', () => {
    console.log('Hot Module Replacement: Notification helper updated');
  });
  
  // Accept updates for modules that should not cause page refresh
  module.hot.accept('./data/auth', () => {
    console.log('Hot Module Replacement: Auth module updated');
  });
  
  module.hot.accept('./data/idb', () => {
    console.log('Hot Module Replacement: IndexedDB module updated');
  });
}