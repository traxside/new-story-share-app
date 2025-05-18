import ProfilePresenter from './profile-presenter.js';
import Auth from '../../data/auth';
import Story from '../../data/story';
import { 
  isPushNotificationSupported, 
  isUserSubscribed, 
  togglePushNotification,
  updateSubscriptionButton,
  registerServiceWorker
} from '../../utils/notification-helper';
import { showAlert } from '../../utils/index';

class ProfilePage {
  #presenter;
  #swRegistration = null;
  
  constructor() {
    this.#presenter = new ProfilePresenter({
      view: this,
      model: Story
    });
  }

  async render() {
    const currentUser = Auth.getUser();

    if (!currentUser) {
      return `
        <section class="container">
          <h1>Profile</h1>
          <div class="alert alert-danger">
            You need to login first to view your profile
          </div>
        </section>
      `;
    }

    return `
      <section class="container profile-page">
        <h1 class="page-title">Profile</h1>
        
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar">
              <div class="avatar-placeholder">${currentUser.name.charAt(0).toUpperCase()}</div>
            </div>
            <div class="profile-info">
              <h2>${currentUser.name}</h2>
              <p>${currentUser.email}</p>
            </div>
          </div>
          
          <div class="profile-actions">
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </div>
        
        <div class="profile-section">
          <h2>App Settings</h2>
          
          <div class="setting-item">
            <div class="setting-info">
              <h3>Push Notifications</h3>
              <p>Get notified when new stories are posted</p>
            </div>
            <div class="setting-action">
              <button id="notification-btn" class="btn btn-primary" disabled>
                Loading...
              </button>
            </div>
          </div>
          
          <div class="setting-item">
            <div class="setting-info">
              <h3>Offline Data</h3>
              <p>Manage stories saved for offline use</p>
            </div>
            <div class="setting-action">
              <button id="offline-data-btn" class="btn btn-primary">Manage</button>
            </div>
          </div>
        </div>
        
        <div id="offline-data-container" class="profile-section offline-data" style="display: none;">
          <h2>Saved Stories <span id="offline-story-count">(0)</span></h2>
          <p class="section-description">These stories are available for offline viewing</p>
          
          <div id="offline-stories-list" class="offline-stories-list">
            <div class="loading-container">
              <div class="lds-ripple"><div></div><div></div></div>
            </div>
          </div>
          
          <div class="offline-actions">
            <button id="clear-all-btn" class="btn btn-danger">Clear All Offline Data</button>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Setup logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.logout();
        window.location.hash = '#/';
      });
    }

    // Handle push notification subscription
    if (isPushNotificationSupported()) {
      this.#swRegistration = await registerServiceWorker();
      const notificationBtn = document.getElementById('notification-btn');
      
      if (this.#swRegistration && notificationBtn) {
        // Update button state based on subscription status
        await updateSubscriptionButton(this.#swRegistration, notificationBtn);
        
        // Add click event listener
        notificationBtn.addEventListener('click', async () => {
          await togglePushNotification(this.#swRegistration, notificationBtn);
        });
      }
    } else {
      const notificationBtn = document.getElementById('notification-btn');
      if (notificationBtn) {
        notificationBtn.textContent = 'Not Supported';
        notificationBtn.disabled = true;
      }
    }

    // Setup offline data management
    const offlineDataBtn = document.getElementById('offline-data-btn');
    const offlineDataContainer = document.getElementById('offline-data-container');
    
    if (offlineDataBtn && offlineDataContainer) {
      offlineDataBtn.addEventListener('click', () => {
        const isVisible = offlineDataContainer.style.display !== 'none';
        offlineDataContainer.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
          this.#presenter.loadOfflineStories();
        }
      });
    }

    // Setup clear all button
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
          await this.#presenter.clearAllOfflineData();
        }
      });
    }
  }
  
  showOfflineStories(stories) {
    const offlineStoriesList = document.getElementById('offline-stories-list');
    const offlineStoryCount = document.getElementById('offline-story-count');
    
    if (offlineStoriesList) {
      if (stories.length === 0) {
        offlineStoriesList.innerHTML = `
          <div class="empty-message">No stories saved for offline use</div>
        `;
      } else {
        offlineStoriesList.innerHTML = stories.map(story => `
          <div class="offline-story-item" data-id="${story.id}">
            <div class="offline-story-info">
              <h3>${story.name}</h3>
              <p>${story.description.length > 100 ? story.description.slice(0, 100) + '...' : story.description}</p>
            </div>
            <div class="offline-story-actions">
              <button class="btn btn-primary view-story-btn" data-id="${story.id}">View</button>
              <button class="btn btn-danger delete-story-btn" data-id="${story.id}">Delete</button>
            </div>
          </div>
        `).join('');
        
        // Add event listeners for view and delete buttons
        document.querySelectorAll('.view-story-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const storyId = btn.dataset.id;
            window.location.hash = `#/story/${storyId}`;
          });
        });
        
        document.querySelectorAll('.delete-story-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const storyId = btn.dataset.id;
            await this.#presenter.deleteOfflineStory(storyId);
          });
        });
      }
    }
    
    if (offlineStoryCount) {
      offlineStoryCount.textContent = `(${stories.length})`;
    }
  }
  
  showLoading() {
    const offlineStoriesList = document.getElementById('offline-stories-list');
    if (offlineStoriesList) {
      offlineStoriesList.innerHTML = `
        <div class="loading-container">
          <div class="lds-ripple"><div></div><div></div></div>
        </div>
      `;
    }
  }
  
  showError(message) {
    const offlineStoriesList = document.getElementById('offline-stories-list');
    if (offlineStoriesList) {
      offlineStoriesList.innerHTML = `
        <div class="error-message">${message}</div>
      `;
    }
  }
}

export default ProfilePage;