import Story from '../../data/story';

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
      
      const stories = await this.#model.getStoredStories();
      this.#view.showOfflineStories(stories);
    } catch (error) {
      console.error('Error loading offline stories:', error);
      this.#view.showError('Failed to load offline stories');
    }
  }
  
  async deleteOfflineStory(id) {
    try {
      await this.#model.deleteStoredStory(id);
      
      // Reload stories after deletion
      await this.loadOfflineStories();
    } catch (error) {
      console.error('Error deleting offline story:', error);
      alert('Failed to delete story');
    }
  }
  
  async clearAllOfflineData() {
    try {
      await this.#model.clearStoredStories();
      
      // Reload stories (should be empty now)
      await this.loadOfflineStories();
      
      alert('All offline data has been cleared');
    } catch (error) {
      console.error('Error clearing offline data:', error);
      alert('Failed to clear offline data');
    }
  }
}

export default ProfilePresenter;