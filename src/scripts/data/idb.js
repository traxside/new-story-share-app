import { openDB } from 'idb';
import CONFIG from '../config';

const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'stories';

const openIDB = async () => {
  return openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      // Create object store if it doesn't exist yet
      if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
        console.log(`${OBJECT_STORE_NAME} database created`);
      }
    },
  });
};

class StoryIdb {
  static async getAllStories() {
    const db = await openIDB();
    return db.getAll(OBJECT_STORE_NAME);
  }

  static async getStoryById(id) {
    const db = await openIDB();
    return db.get(OBJECT_STORE_NAME, id);
  }

  static async putStories(stories) {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    
    // Add all stories one by one
    const promises = stories.map((story) => tx.store.put(story));
    await Promise.all([...promises, tx.done]);
    
    return stories;
  }

  static async putStory(story) {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    tx.store.put(story);
    await tx.done;
    return story;
  }

  static async deleteStory(id) {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    tx.store.delete(id);
    await tx.done;
  }

  static async clearAll() {
    const db = await openIDB();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    tx.store.clear();
    await tx.done;
  }
}

export default StoryIdb;