import Auth from './auth';
import { 
  getAllStories, 
  getStoryDetail, 
  addNewStory, 
  addNewStoryGuest 
} from './api';
import StoryIdb from './idb';
import { showAlert } from '../utils/index';

class Story {
  static async getAll({ page = null, size = null, location = null } = {}) {
    try {
      const token = Auth.getToken();
      
      if (token) {
        try {
          // Try to get data from network first
          const response = await getAllStories(token, { page, size, location });
          
          // If successful, store in IndexedDB
          if (!response.error && response.listStory) {
            await StoryIdb.putStories(response.listStory);
          }
          
          return response;
        } catch (error) {
          console.log('Network error, falling back to cached data');
          
          // If offline, get data from IndexedDB
          const stories = await StoryIdb.getAllStories();
          
          if (stories.length) {
            showAlert('Using cached data (offline mode)', 'info');
            return {
              error: false,
              message: 'Success (offline mode)',
              listStory: stories
            };
          } else {
            throw new Error("No cached stories available. Please check your connection.");
          }
        }
      } else {
        // Try to get cached data if available for non-authenticated users
        const stories = await StoryIdb.getAllStories();
        
        if (stories.length) {
          showAlert('Using cached data. Please log in for latest stories.', 'info');
          return {
            error: false,
            message: 'Success (cached data)',
            listStory: stories
          };
        } else {
          throw new Error("Missing Authentication : Please sign in or register to continue");
        }
      }
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const token = Auth.getToken();
      
      if (token) {
        try {
          // Try to get data from network first
          const response = await getStoryDetail(token, id);
          
          // If successful, store in IndexedDB
          if (!response.error && response.story) {
            await StoryIdb.putStory(response.story);
          }
          
          return response;
        } catch (error) {
          console.log('Network error, falling back to cached data');
          
          // If offline, get data from IndexedDB
          const story = await StoryIdb.getStoryById(id);
          
          if (story) {
            showAlert('Using cached data (offline mode)', 'info');
            return {
              error: false,
              message: 'Success (offline mode)',
              story
            };
          } else {
            throw new Error("Story not found in cache. Please check your connection.");
          }
        }
      } else {
        // Try to get cached data if available for non-authenticated users
        const story = await StoryIdb.getStoryById(id);
        
        if (story) {
          showAlert('Using cached data. Please log in for latest content.', 'info');
          return {
            error: false,
            message: 'Success (cached data)',
            story
          };
        } else {
          throw new Error("Missing Authentication");
        }
      }
    } catch (error) {
      throw error;
    }
  }

  static async add(description, photoFile, lat = null, lon = null) {
    try {
      const token = Auth.getToken();
      
      if (token) {
        const response = await addNewStory(token, description, photoFile, lat, lon);
        
        // If story added successfully, refresh stories in cache
        if (!response.error && response.story) {
          // Add the new story to IndexedDB
          await StoryIdb.putStory(response.story);
          
          // Also fetch latest stories to update cache
          try {
            const storiesResponse = await getAllStories(token, { page: 1, size: 10 });
            if (!storiesResponse.error && storiesResponse.listStory) {
              await StoryIdb.putStories(storiesResponse.listStory);
            }
          } catch (error) {
            console.log('Failed to refresh stories cache:', error.message);
          }
        }
        
        return response;
      } else {
        const response = await addNewStoryGuest(description, photoFile, lat, lon);
        return response;
      }
    } catch (error) {
      throw error;
    }
  }
  
  // New method to manage stored stories
  static async getStoredStories() {
    return await StoryIdb.getAllStories();
  }
  
  // New method to delete a stored story
  static async deleteStoredStory(id) {
    return await StoryIdb.deleteStory(id);
  }
  
  // New method to clear all stored stories
  static async clearStoredStories() {
    return await StoryIdb.clearAll();
  }
}

export default Story;