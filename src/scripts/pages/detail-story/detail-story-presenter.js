import Story from '../../data/story';
import { initMap, addMarker } from '../../utils';

export default class DetailStoryPresenter {
  #view;
  #model;
  #id;
  #story = null;
  #map = null;

  constructor({ view, model, id }) {
    this.#view = view;
    this.#model = model || Story;
    this.#id = id;
  }

  async loadStoryDetail() {
    try {
      this.#view.showLoading();
      
      const response = await this.#model.getById(this.#id);
      
      if (response.error) {
        this.#view.showErrorMessage(response.message);
        return;
      }
      
      this.#story = response.story;
      this.#view.showStoryDetail(this.#story);
      
      // Initialize map if location exists
      if (this.#story.lat && this.#story.lon) {
        setTimeout(() => this._initializeMap(), 500);
      }
    } catch (error) {
      this.#view.showErrorMessage(`Failed to load story: ${error.message}`);
    }
  }
  
  _initializeMap() {
    try {
      // Initialize map
      this.#map = initMap('story-map', {
        center: { lat: this.#story.lat, lng: this.#story.lon },
        zoom: 15
      });
      
      if (this.#map) {
        // Add marker with popup
        addMarker(this.#map, this.#story.lat, this.#story.lon, {
          title: 'Story location',
          popupContent: `<strong>${this.#story.name}'s story</strong><br>Location`
        });
        
        setTimeout(() => {
          this.#map.invalidateSize(true);
        }, 300);
      }
    } catch (error) {
      console.error('Error initializing story map:', error);
      this.#view.showMapError();
    }
  }
}