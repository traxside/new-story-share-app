import Story from '../../data/story';
import CONFIG from '../../config';
import { createCameraElement, initMap, updateLocationDisplay } from '../../utils';
import L from 'leaflet';
import AddStoryPresenter from './add-story-presenter.js';

export default class AddStoryPage {
  constructor() {
    this.camera = null;
    this.map = null;
    this.marker = null;
    this.mapInitialized = false;
    this.resizeTimeout = null;
    this.mapObserver = null;
    this.markerIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    // Will be initialized in afterRender
    this.presenter = null;
  }

  async render() {
    return `
      <section class="container add-story-page" id="main-content">
        <h1 class="page-title">Share Your Story</h1>
        
        <form id="add-story-form" class="add-story-form">
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" name="description" rows="4" required></textarea>
          </div>
          
          <div class="form-group">
            <label for="photo">Photo</label>
            <div class="photo-input-container">
              <div class="tabs">
                <button type="button" id="camera-tab" class="tab-button active">Camera</button>
                <button type="button" id="upload-tab" class="tab-button">Upload</button>
              </div>
              
              <div id="camera-container" class="tab-content active">
                <div id="video-container" class="video-container"></div>
                <div class="camera-controls">
                  <button type="button" id="start-camera" class="btn btn-secondary">
                    <i class="fas fa-camera"></i> Start Camera
                  </button>
                  <button type="button" id="capture-photo" class="btn btn-primary" disabled>
                    <i class="fas fa-camera-retro"></i> Take Photo
                  </button>
                </div>
              </div>
              
              <div id="upload-container" class="tab-content">
                <input type="file" id="photo-upload" name="photo" accept="image/*">
                <label for="photo-upload" class="file-input-label">
                  <i class="fas fa-upload"></i> Choose a file
                </label>
              </div>
              
              <div id="snapshot-container" class="snapshot-container"></div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="location">Location</label>
            <div id="location-map" class="location-map"></div>
            <div class="map-controls">
              <p class="map-instructions">Click on the map to set your location or use the button below.</p>
              <button type="button" id="use-current-location" class="btn btn-secondary">
                <i class="fas fa-map-marker-alt"></i> Use My Current Location
              </button>
              <button type="button" id="reset-map-view" class="btn btn-outline-secondary">
                <i class="fas fa-sync"></i> Reset Map
              </button>
            </div>
            <div id="selected-location" class="selected-location"></div>
          </div>
          
          <button type="submit" id="submit-story" class="btn btn-primary">Share Story</button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    // Initialize camera
    this.camera = createCameraElement('video-container', 'snapshot-container');
    
    // Setup map observation
    this._setupMapInitialization();
    
    // Initialize presenter
    this.presenter = new AddStoryPresenter({
      view: this,
      model: Story
    });
    
    // Setup event listeners
    this._setupEventListeners();
    
  }
  
  _setupMapInitialization() {
    const mapContainer = document.getElementById('location-map');
    
    // Reset mapInitialized flag
    this.mapInitialized = false;
    
    // Create and store the observer
    this.mapObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.mapInitialized) {
        this._initializeMap();
        this.mapInitialized = true;
      }
    }, { threshold: 0.1 });
    
    this.mapObserver.observe(mapContainer);
    
    // Also initialize if user scrolled to map section manually
    mapContainer.addEventListener('mouseenter', () => {
      if (!this.mapInitialized) {
        this._initializeMap();
        this.mapInitialized = true;
      }
    }, { once: true });
  }
  
  _initializeMap() {
    try {
      const mapContainer = document.getElementById('location-map');
      
      // Ensure map container is empty before initialization
      while (mapContainer.firstChild) {
        mapContainer.removeChild(mapContainer.firstChild);
      }
      
      if (!mapContainer.style.height) {
        mapContainer.style.height = '400px';
      }
      
      // Initialize map with default location
      this.map = initMap('location-map', {
        center: CONFIG.DEFAULT_LOCATION || { lat: -6.2088, lng: 106.8456 }, // Fallback to Jakarta
        zoom: CONFIG.DEFAULT_ZOOM || 10
      });
      
      // Add click event to map
      this.map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        this.presenter.selectPosition(lat, lng);
      });
      
      // Force a resize after initialization
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize(true);
        }
      }, 500);
    } catch (error) {
      console.error('Map initialization error:', error);
      this.presenter.showAlert('Failed to initialize map. Please try refreshing the page.', 'error');
    }
  }
  
  // View methods called by presenter
  selectPosition(lat, lng) {
    try {
      if (!this.map) {
        console.warn('Map not initialized when attempting to select position');
        return;
      }
      
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], {
          draggable: true,
          autoPan: true,
          title: 'Your selected location'
        }).addTo(this.map);
        
        // Add popup with information
        this.marker.bindPopup('Your story location').openPopup();
        
        // Update location when marker is dragged
        this.marker.on('dragend', (e) => {
          const position = e.target.getLatLng();
          this.presenter.selectPosition(position.lat, position.lng);
        });
      }
      
      // Update display with formatted coordinates
      updateLocationDisplay('selected-location', lat, lng);
    } catch (error) {
      console.error('Error setting map position:', error);
      this.presenter.showAlert('Failed to set map position. Please try again.', 'error');
    }
  }
  
  setMapView(lat, lng, zoom) {
    if (this.map) {
      this.map.setView([lat, lng], zoom);
    }
  }
  
  resetMap() {
    if (this.map && this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
      document.getElementById('selected-location').innerHTML = '';
    }
  }
  
  disableButton(buttonId, loading = false, text = '') {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = true;
      if (loading) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (text || 'Loading...');
      }
    }
  }
  
  enableButton(buttonId, text = '') {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = false;
      if (text) {
        button.innerHTML = text;
      }
    }
  }
  
  updateFilePreview(dataUrl) {
    document.getElementById('snapshot-container').innerHTML = `
      <img src="${dataUrl}" alt="Preview" class="snapshot-preview">
    `;
  }
  
  _setupEventListeners() {
    // Camera tab switching
    const cameraTab = document.getElementById('camera-tab');
    const uploadTab = document.getElementById('upload-tab');
    const cameraContainer = document.getElementById('camera-container');
    const uploadContainer = document.getElementById('upload-container');
    
    cameraTab.addEventListener('click', () => {
      this.presenter.switchTab('camera');
      cameraTab.classList.add('active');
      uploadTab.classList.remove('active');
      cameraContainer.classList.add('active');
      uploadContainer.classList.remove('active');
    });
    
    uploadTab.addEventListener('click', () => {
      this.presenter.switchTab('upload');
      uploadTab.classList.add('active');
      cameraTab.classList.remove('active');
      uploadContainer.classList.add('active');
      cameraContainer.classList.remove('active');
    });
    
    // Camera controls
    const startCameraButton = document.getElementById('start-camera');
    const capturePhotoButton = document.getElementById('capture-photo');
    
    startCameraButton.addEventListener('click', () => {
      this.presenter.startCamera();
    });
    
    capturePhotoButton.addEventListener('click', () => {
      this.presenter.capturePhoto();
    });
    
    // File upload
    const photoUpload = document.getElementById('photo-upload');
    photoUpload.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.presenter.handleFileUpload(e.target.files[0]);
      }
    });
    
    // Current location
    const useCurrentLocationButton = document.getElementById('use-current-location');
    useCurrentLocationButton.addEventListener('click', () => {
      this.presenter.useCurrentLocation();
    });
    
    // Reset map view
    const resetMapButton = document.getElementById('reset-map-view');
    resetMapButton.addEventListener('click', () => {
      this.presenter.resetMap();
    });
    
    // Form submission
    const addStoryForm = document.getElementById('add-story-form');
    addStoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const description = document.getElementById('description').value;
      this.presenter.submitStory(description);
    });
    
    // Handle window resize events to update map
    window.addEventListener('resize', this._handleResize.bind(this));
    window.addEventListener('hashchange', this.destroy.bind(this));
  }
  
  _handleResize() {
    // Debounce the resize event
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    
    this.resizeTimeout = setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 250);
  }
  
  // Cleanup resources when page is unloaded
  destroy() {
    // Let presenter handle cleanup logic
    if (this.presenter) {
      this.presenter.cleanup();
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this._handleResize.bind(this));
    window.addEventListener('hashchange', this.destroy.bind(this));
    // Disconnect observer to prevent memory leaks
    if (this.mapObserver) {
      this.mapObserver.disconnect();
      this.mapObserver = null;
    }
    
    // Clean up map
    if (this.map) {
      // Remove any markers first
      if (this.marker) {
        this.map.removeLayer(this.marker);
        this.marker = null;
      }
      
      // Remove all event listeners
      this.map.off();
      
      // Remove the map
      this.map.remove();
      this.map = null;
    }
    
    // Clear the map container to ensure a clean slate for next initialization
    const mapContainer = document.getElementById('location-map');
    if (mapContainer) {
      mapContainer.innerHTML = '';
    }
    
    // Reset state
    this.mapInitialized = false;
  }
}