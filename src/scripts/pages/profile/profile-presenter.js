import Story from '../../data/story';
import StoryIdb from '../../data/idb';

class ProfilePresenter {
  #view;
  #model;
  
  constructor({ view, model }) {
    this.#view = view;
    this.#model = model || Story;
  }
  
  async loadOfflineStories() {
    try {
      this.#view.showLoading();
      
      // Get stories from IndexedDB
      const stories = await StoryIdb.getAllStories();
      
      // Get last sync time
      const lastSync = await StoryIdb.getLastSyncTimestamp();
      
      this.#view.showOfflineStories(stories, lastSync ? new Date(lastSync) : null);
    } catch (error) {
      console.error('Error loading offline stories:', error);
      this.#view.showError('Failed to load offline stories');
    }
  }
  
  async deleteOfflineStory(id) {
    try {
      // Delete from IndexedDB
      await StoryIdb.deleteStory(id);
      
      // Reload stories after deletion
      await this.loadOfflineStories();
      return true;
    } catch (error) {
      console.error('Error deleting offline story:', error);
      return false;
    }
  }
  
  async clearAllOfflineData() {
    try {
      // Clear stories from IndexedDB
      await StoryIdb.clearAllStories();
      
      // Clear pending stories too
      await StoryIdb.clearAllPendingStories();
      
      // Update last sync timestamp to null
      await StoryIdb.setPreference('lastSync', null);
      
      // Reload stories (should be empty now)
      await this.loadOfflineStories();
      
      return true;
    } catch (error) {
      console.error('Error clearing offline data:', error);
      return false;
    }
  }
  
  async getPendingSubmissions() {
    try {
      return await StoryIdb.getPendingStories();
    } catch (error) {
      console.error('Error loading pending submissions:', error);
      return [];
    }
  }
  
  async deletePendingSubmission(id) {
    try {
      await StoryIdb.deletePendingStory(id);
      return true;
    } catch (error) {
      console.error('Error deleting pending submission:', error);
      return false;
    }
  }
  
  async getStorageStats() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          percent: estimate.quota > 0 ? Math.round((estimate.usage / estimate.quota) * 100) : 0
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  }
}

export default ProfilePresenter;