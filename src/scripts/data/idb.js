import { openDB } from 'idb';
import CONFIG from '../config';

const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAMES = {
  STORIES: 'stories',
  PENDING_STORIES: 'pending_stories',
  USER_PREFERENCES: 'user_preferences'
};

const openIDB = async () => {
  return openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      // Create stories object store if it doesn't exist
      if (!database.objectStoreNames.contains(OBJECT_STORE_NAMES.STORIES)) {
        database.createObjectStore(OBJECT_STORE_NAMES.STORIES, { keyPath: 'id' });
        console.log(`${OBJECT_STORE_NAMES.STORIES} store created`);
      }
      
      // Create pending stories object store for offline submissions
      if (!database.objectStoreNames.contains(OBJECT_STORE_NAMES.PENDING_STORIES)) {
        const pendingStore = database.createObjectStore(OBJECT_STORE_NAMES.PENDING_STORIES, { 
          keyPath: 'id',
          autoIncrement: true
        });
        console.log(`${OBJECT_STORE_NAMES.PENDING_STORIES} store created`);
      }
      
      // Create user preferences store
      if (!database.objectStoreNames.contains(OBJECT_STORE_NAMES.USER_PREFERENCES)) {
        database.createObjectStore(OBJECT_STORE_NAMES.USER_PREFERENCES, { keyPath: 'key' });
        console.log(`${OBJECT_STORE_NAMES.USER_PREFERENCES} store created`);
      }
    },
  });
};

class StoryIdb {
  // Stories methods
  static async getAllStories() {
    const db = await openIDB();
    return db.getAll(OBJECT_STORE_NAMES.STORIES);
  }

  static async getStoryById(id) {
    const db = await openIDB();
    return db.get(OBJECT_STORE_NAMES.STORIES, id);
  }

  static async putStories(stories) {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAMES.STORIES, 'readwrite');
    
    // Add all stories one by one
    const promises = stories.map((story) => tx.store.put(story));
    await Promise.all([...promises, tx.done]);
    
    return stories;
  }

  static async putStory(story) {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAMES.STORIES, 'readwrite');
    tx.store.put(story);
    await tx.done;
    return story;
  }

  static async deleteStory(id) {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAMES.STORIES, 'readwrite');
    tx.store.delete(id);
    await tx.done;
  }

  static async clearAllStories() {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAMES.STORIES, 'readwrite');
    tx.store.clear();
    await tx.done;
  }
  
  // Pending stories methods (for offline submissions)
  static async addPendingStory(storyData) {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAMES.PENDING_STORIES, 'readwrite');
    const id = await tx.store.add({
      ...storyData,
      timestamp: new Date().getTime()
    });
    await tx.done;
    return id;
  }
  
  static async getPendingStories() {
    const db = await openIDB();
    return db.getAll(OBJECT_STORE_NAMES.PENDING_STORIES);
  }
  
  static async deletePendingStory(id) {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAMES.PENDING_STORIES, 'readwrite');
    tx.store.delete(id);
    await tx.done;
  }
  
  static async clearAllPendingStories() {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAMES.PENDING_STORIES, 'readwrite');
    tx.store.clear();
    await tx.done;
  }
  
  // User preferences methods
  static async setPreference(key, value) {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAMES.USER_PREFERENCES, 'readwrite');
    tx.store.put({ key, value });
    await tx.done;
    return value;
  }
  
  static async getPreference(key) {
    const db = await openIDB();
    const preference = await db.get(OBJECT_STORE_NAMES.USER_PREFERENCES, key);
    return preference ? preference.value : null;
  }
  
  static async deletePreference(key) {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAMES.USER_PREFERENCES, 'readwrite');
    tx.store.delete(key);
    await tx.done;
  }
  
  // Connection status
  static async saveConnectionStatus(isOnline) {
    return this.setPreference('isOnline', isOnline);
  }
  
  static async getConnectionStatus() {
    const status = await this.getPreference('isOnline');
    return status !== null ? status : navigator.onLine;
  }
  
  // Last sync timestamp
  static async updateLastSyncTimestamp() {
    return this.setPreference('lastSync', new Date().getTime());
  }
  
  static async getLastSyncTimestamp() {
    return this.getPreference('lastSync');
  }
}

export default StoryIdb;