import Story from '../../data/story';
import CONFIG from '../../config';
import { initMap, addMarker } from '../../utils/index';
import StoryIdb from '../../data/idb';

export default class HomePresenter {
  #view;
  #model;
  #stories = [];
  #storyMaps = {};
  #isOnline = navigator.onLine;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model || Story;
    
    // Listen for online/offline status changes
    this.#setupNetworkListeners();
  }

  #setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.#isOnline = true;
      this.#view.showOnlineStatus(true);
      // Reload stories when back online to get fresh data
      this.loadStories();
    });
    
    window.addEventListener('offline', () => {
      this.#isOnline = false;
      this.#view.showOnlineStatus(false);
    });
  }

  async loadStories() {
    try {
      this.#view.showLoading();
      
      // Show correct network status
      this.#view.showOnlineStatus(this.#isOnline);
      
      // Try to load stories from API if online
      if (this.#isOnline) {
        try {
          const response = await this.#model.getAll({ location: 1 });
          
          if (!response.error) {
            // Store stories in IndexedDB for offline use
            await StoryIdb.putStories(response.listStory);
            
            // Update last sync timestamp
            await StoryIdb.updateLastSyncTimestamp();
            
            // Store stories data
            this.#stories = response.listStory;
            this.#view.showStories(response.listStory);
            
            // Setup inline maps after stories are rendered
            this.setupInlineMaps();
            return;
          }
        } catch (error) {
          console.error('Failed to fetch stories from API:', error);
          // Fall back to cached data
        }
      }
      
      // If we're offline or API request failed, load from IndexedDB
      const cachedStories = await StoryIdb.getAllStories();
      
      if (cachedStories.length === 0) {
        this.#view.showEmptyMessage('No stories available offline');
        return;
      }

      // Store stories data from cache
      this.#stories = cachedStories;
      this.#view.showStories(cachedStories, !this.#isOnline);
      
      // Setup inline maps if possible (maps won't work offline but we can try)
      if (this.#isOnline) {
        this.setupInlineMaps();
      }
      
      // Show last sync time
      const lastSync = await StoryIdb.getLastSyncTimestamp();
      if (lastSync) {
        this.#view.showLastSyncTime(new Date(lastSync));
      }
      
    } catch (error) {
      console.error('Error loading stories:', error);
      this.#view.showErrorMessage(`Failed to load stories: ${error.message}`);
      
      // Try to load from cache as a last resort
      try {
        const cachedStories = await StoryIdb.getAllStories();
        if (cachedStories.length > 0) {
          this.#stories = cachedStories;
          this.#view.showStories(cachedStories, true);
        }
      } catch (cacheError) {
        console.error('Failed to load from cache:', cacheError);
      }
    }
  }

  getStories() {
    return this.#stories;
  }

  findStoryById(id) {
    return this.#stories.find(story => story.id === id);
  }
  
  async saveStoryForOffline(storyId) {
    try {
      const story = this.findStoryById(storyId);
      if (story) {
        await StoryIdb.putStory(story);
        this.#view.showSavedConfirmation(story.name);
      }
    } catch (error) {
      console.error('Failed to save story for offline:', error);
    }
  }
  
  setupInlineMaps() {
    const mapContainers = document.querySelectorAll('.story-map-container');
    
    // Initialize maps for each story that has location data
    mapContainers.forEach(container => {
      const storyID = container.dataset.id;
      const lat = parseFloat(container.dataset.lat);
      const lon = parseFloat(container.dataset.lon);
      const mapElementId = `map-${storyID}`;
      
      // Clean up any existing map
      if (this.#storyMaps[storyID]) {
        this.#storyMaps[storyID].map.remove();
        this.#storyMaps[storyID] = null;
      }
      
      // Only initialize map if online
      if (this.#isOnline && !isNaN(lat) && !isNaN(lon)) {
        // Initialize map
        const map = initMap(mapElementId, {
          center: { lat, lng: lon },
          zoom: 13
        });
        
        if (map) {
          // Add marker
          const story = this.findStoryById(storyID);
          const marker = addMarker(map, lat, lon, {
            title: 'Story location',
            popupContent: `<strong>${story.name}'s story</strong><br>Location`
          });
          
          // Store references
          this.#storyMaps[storyID] = { map, marker };
          
          // Fix map rendering issues by invalidating size after a short delay
          setTimeout(() => {
            if (map) {
              map.invalidateSize(true);
            }
          }, 300);
        }
      } else {
        // Show offline map placeholder if offline
        const mapElement = document.getElementById(mapElementId);
        if (mapElement) {
          mapElement.innerHTML = '<div class="offline-map-placeholder">Map unavailable offline</div>';
        }
      }
    });
  }
  
  _cleanupMaps() {
    // Clean up all maps
    Object.values(this.#storyMaps).forEach(mapData => {
      if (mapData && mapData.map) {
        mapData.map.remove();
      }
    });
    
    this.#storyMaps = {};
  }
}