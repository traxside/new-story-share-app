/**
 * ProfilePresenter class handles the business logic for the Profile page.
 * Follows the MVP (Model-View-Presenter) pattern.
 */
export default class ProfilePresenter {
  #view;
  #authModel;
  #storyModel;
  #isStoriesVisible = false;
  #storedStories = [];
  #notificationEnabled = false;

  /**
   * Constructor for the ProfilePresenter
   * @param {Object} options - Configuration options
   * @param {Object} options.view - Reference to the View
   * @param {Object} options.authModel - Authentication Model
   * @param {Object} options.storyModel - Story Model
   */
  constructor({ view, authModel, storyModel }) {
    this.#view = view;
    this.#authModel = authModel;
    this.#storyModel = storyModel;
  }

  /**
   * Initialize the presenter
   */
  async init() {
    // Load stored stories for offline reading
    await this.loadStoredStories();
    
    // Check if notifications are enabled
    this.checkNotificationPermission();
  }

  /**
   * Log out the current user
   */
  logout() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
      this.#authModel.logout();
      window.location.hash = '#/login';
    }
  }

  /**
   * Check notification permission and update UI accordingly
   */
  async checkNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    try {
      // Check if service worker is registered
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        this.#notificationEnabled = false;
        this.#view.setNotificationToggle(false);
        return;
      }

      // Check if we have a push subscription
      const subscription = await registration.pushManager.getSubscription();
      this.#notificationEnabled = !!subscription;
      this.#view.setNotificationToggle(this.#notificationEnabled);
    } catch (error) {
      console.error('Error checking notification permission:', error);
      this.#view.setNotificationToggle(false);
    }
  }

  /**
   * Toggle push notifications
   * @param {boolean} enabled - Whether notifications should be enabled
   */
  async toggleNotifications(enabled) {
    try {
      if (enabled) {
        // First, check if notifications are supported
        if (!('Notification' in window)) {
          alert('This browser does not support notifications');
          this.#view.setNotificationToggle(false);
          return;
        }

        // Get notification permission
        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
          alert('You need to allow notification permission to receive notifications');
          this.#view.setNotificationToggle(false);
          return;
        }

        // Register service worker and subscribe to push notifications
        const registration = await registerServiceWorker();
        await subscribeUserToPush(registration);
        this.#notificationEnabled = true;
      } else {
        // Unsubscribe from push notifications
        await unsubscribeUserFromPush();
        this.#notificationEnabled = false;
      }

      // Update UI
      this.#view.setNotificationToggle(this.#notificationEnabled);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert(`Failed to ${enabled ? 'enable' : 'disable'} notifications. Please try again.`);
      this.#view.setNotificationToggle(this.#notificationEnabled);
    }
  }

  /**
   * Load stories stored for offline reading
   */
  async loadStoredStories() {
    try {
      this.#storedStories = await this.#storyModel.getStoredStories();
    } catch (error) {
      console.error('Error loading stored stories:', error);
      this.#storedStories = [];
    }
  }

  /**
   * Toggle the visibility of stored stories section
   */
  toggleStoredStoriesView() {
    this.#isStoriesVisible = !this.#isStoriesVisible;
    this.#view.toggleStoredStoriesContainer(this.#isStoriesVisible);
    
    if (this.#isStoriesVisible) {
      this.#view.showStoredStories(this.#storedStories);
    }
  }

  /**
   * Clear all stored stories from offline storage
   */
  clearStorage() {
    if (confirm('Are you sure you want to clear all stored stories? This cannot be undone.')) {
      try {
        this.#storyModel.clearStoredStories();
        this.#storedStories = [];
        
        if (this.#isStoriesVisible) {
          this.#view.showStoredStories([]);
        }
        
        alert('Storage cleared successfully');
      } catch (error) {
        console.error('Error clearing storage:', error);
        alert('Failed to clear storage. Please try again.');
      }
    }
  }

  /**
   * Delete a specific stored story
   * @param {string} storyId - ID of the story to delete
   */
  async deleteStoredStory(storyId) {
    if (confirm('Are you sure you want to delete this story from offline storage?')) {
      try {
        await this.#storyModel.removeStoredStory(storyId);
        
        // Update the local list
        this.#storedStories = this.#storedStories.filter(story => story.id !== storyId);
        
        // Update the UI if stories are visible
        if (this.#isStoriesVisible) {
          this.#view.showStoredStories(this.#storedStories);
        }
      } catch (error) {
        console.error('Error deleting story:', error);
        alert('Failed to delete story. Please try again.');
      }
    }
  }
}