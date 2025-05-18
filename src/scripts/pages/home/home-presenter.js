import Story from '../../data/story';
import CONFIG from '../../config';
import { initMap, addMarker } from '../../utils/index';

export default class HomePresenter {
  #view;
  #model;
  #stories = [];
  #storyMaps = {};

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model || Story;
  }

  async loadStories() {
    try {
      this.#view.showLoading();
      
      const response = await this.#model.getAll({ location: 1 });
      
      if (response.error) {
        this.#view.showErrorMessage(response.message);
        return;
      }
      
      if (response.listStory.length === 0) {
        this.#view.showEmptyMessage();
        return;
      }

      // Store stories data
      this.#stories = response.listStory;
      this.#view.showStories(response.listStory);
      
      // Setup inline maps after stories are rendered
      this.setupInlineMaps();
      
    } catch (error) {
      this.#view.showErrorMessage(`Failed to load stories: ${error.message}`);
    }
  }

  getStories() {
    return this.#stories;
  }

  findStoryById(id) {
    return this.#stories.find(story => story.id === id);
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