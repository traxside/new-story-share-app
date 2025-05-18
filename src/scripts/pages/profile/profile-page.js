import ProfilePresenter from './profile-presenter.js';
import Auth from '../../data/auth';
import Story from '../../data/story';
import { registerServiceWorker, subscribeUserToPush, unsubscribeUserFromPush } from '../../utils/notification-helper';
import { showAlert } from '../../utils/index';

export default class ProfilePage {
  #presenter;
  
  constructor() {
    this.#presenter = new ProfilePresenter({ 
      view: this,
      authModel: Auth,
      storyModel: Story
    });
  }

  async render() {
    const user = Auth.getUser();
    
    if (!user) {
      window.location.hash = '#/login';
      return '';
    }
    
    return `
      <section class="container profile-page">
        <h1 class="page-title">Profile</h1>
        
        <div class="profile-info">
          <div class="profile-header">
            <div class="profile-avatar">
              <i class="fas fa-user-circle"></i>
            </div>
            <div class="profile-details">
              <h2>${user.name}</h2>
              <p>${user.email}</p>
            </div>
          </div>
          
          <div class="profile-actions">
            <button id="logout-button" class="button button-danger">
              <i class="fas fa-sign-out-alt"></i> Logout
            </button>
            
            <div class="notification-settings">
              <h3>Notification Settings</h3>
              <div class="form-group">
                <label for="notification-toggle">Push Notifications</label>
                <div class="toggle-switch">
                  <input type="checkbox" id="notification-toggle" class="toggle-input">
                  <label for="notification-toggle" class="toggle-label"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="offline-storage">
          <h3>Offline Storage</h3>
          <div class="storage-info">
            <p>Manage your stored stories for offline reading.</p>
            <div class="storage-actions">
              <button id="view-stored-button" class="button button-primary">
                <i class="fas fa-eye"></i> View Stored Stories
              </button>
              <button id="clear-storage-button" class="button button-warning">
                <i class="fas fa-trash"></i> Clear Storage
              </button>
            </div>
          </div>
          
          <div id="stored-stories-container" class="stored-stories-container" style="display: none;">
            <h4>Stored Stories</h4>
            <div id="stored-stories-list" class="stored-stories-list">
              <p class="loading-text">Loading stored stories...</p>
            </div>
          </div>
        </div>
        
        <div class="app-info">
          <h3>App Information</h3>
          <div class="app-details">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Mode:</strong> <span id="connection-status">Online</span></p>
            <p><strong>Installable:</strong> <span id="installable-status">Checking...</span></p>
            <div id="install-app-container" style="display: none;">
              <button id="install-app-button" class="button button-primary">
                <i class="fas fa-download"></i> Install App
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Initialize presenter
    await this.#presenter.init();
    
    // Set up event listeners
    document.getElementById('logout-button').addEventListener('click', () => {
      this.#presenter.logout();
    });
    
    document.getElementById('notification-toggle').addEventListener('change', (event) => {
      this.#presenter.toggleNotifications(event.target.checked);
    });
    
    document.getElementById('view-stored-button').addEventListener('click', () => {
      this.#presenter.toggleStoredStoriesView();
    });
    
    document.getElementById('clear-storage-button').addEventListener('click', () => {
      this.#presenter.clearStorage();
    });
    
    // Check connection status
    this.updateConnectionStatus();
    window.addEventListener('online', () => this.updateConnectionStatus());
    window.addEventListener('offline', () => this.updateConnectionStatus());
    
    // Check installability
    this.checkInstallability();
    
    // Check notification permission
    this.#presenter.checkNotificationPermission();
  }
  
  updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    if (navigator.onLine) {
      statusElement.textContent = 'Online';
      statusElement.classList.remove('offline');
      statusElement.classList.add('online');
    } else {
      statusElement.textContent = 'Offline';
      statusElement.classList.remove('online');
      statusElement.classList.add('offline');
    }
  }
  
  async checkInstallability() {
    const installableStatusElement = document.getElementById('installable-status');
    const installAppContainer = document.getElementById('install-app-container');
    
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isStandalone) {
      installableStatusElement.textContent = 'Already Installed';
      return;
    }
    
    // Store the deferredPrompt for later use
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the default prompt
      e.preventDefault();
      
      // Store the event for later use
      deferredPrompt = e;
      
      // Update UI to show it's installable
      installableStatusElement.textContent = 'Yes';
      installAppContainer.style.display = 'block';
      
      // Add click handler for install button
      document.getElementById('install-app-button').addEventListener('click', async () => {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          showAlert('App installation started!', 'success');
          installAppContainer.style.display = 'none';
          installableStatusElement.textContent = 'Installing...';
        } else {
          showAlert('App installation declined', 'info');
        }
        
        // Clear the deferredPrompt
        deferredPrompt = null;
      });
    });
    
    // If no install prompt after 3 seconds, update UI
    setTimeout(() => {
      if (!deferredPrompt) {
        installableStatusElement.textContent = 'Not available';
      }
    }, 3000);
  }
  
  showStoredStories(stories) {
    const container = document.getElementById('stored-stories-list');
    
    if (stories.length === 0) {
      container.innerHTML = '<p class="empty-message">No stories stored for offline reading</p>';
      return;
    }
    
    const storiesHTML = stories.map(story => `
      <div class="stored-story-item">
        <div class="stored-story-info">
          <h4>${story.name}</h4>
          <p class="stored-story-desc">${story.description.substring(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
        </div>
        <div class="stored-story-actions">
          <a href="#/story/${story.id}" class="button button-small button-primary">View</a>
          <button class="button button-small button-danger delete-story" data-id="${story.id}">Delete</button>
        </div>
      </div>
    `).join('');
    
    container.innerHTML = storiesHTML;
    
    // Add event listeners for delete buttons
    container.querySelectorAll('.delete-story').forEach(button => {
      button.addEventListener('click', (e) => {
        const storyId = e.target.dataset.id;
        this.#presenter.deleteStoredStory(storyId);
      });
    });
  }
  
  setNotificationToggle(enabled) {
    document.getElementById('notification-toggle').checked = enabled;
  }
  
  toggleStoredStoriesContainer(show) {
    const container = document.getElementById('stored-stories-container');
    container.style.display = show ? 'block' : 'none';
    
    // Update button text
    const viewButton = document.getElementById('view-stored-button');
    viewButton.innerHTML = show ? 
      '<i class="fas fa-eye-slash"></i> Hide Stored Stories' : 
      '<i class="fas fa-eye"></i> View Stored Stories';
  }
}