import CONFIG from '../../config';
import { showAlert } from '../../utils';

export default class AddStoryPresenter {
  constructor({ view, model }) {
    this.view = view;
    this.model = model;
    this.photoBlob = null;
    this.selectedPosition = null;
  }
  
  // Map handlers
  selectPosition(lat, lng) {
    this.selectedPosition = { lat, lng };
    this.view.selectPosition(lat, lng);
  }
  
  resetMap() {
    const defaultLocation = CONFIG.DEFAULT_LOCATION || { lat: -6.2088, lng: 106.8456 };
    const defaultZoom = CONFIG.DEFAULT_ZOOM || 10;
    
    this.view.setMapView(defaultLocation.lat, defaultLocation.lng, defaultZoom);
    this.view.resetMap();
    this.selectedPosition = null;
  }
  
  useCurrentLocation() {
    if (navigator.geolocation) {
      this.view.disableButton('use-current-location', true, 'Getting location...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.selectPosition(latitude, longitude);
          this.view.setMapView(latitude, longitude, 15);
          
          this.view.enableButton('use-current-location', '<i class="fas fa-map-marker-alt"></i> Use My Current Location');
        },
        (error) => {
          this.showAlert(`Geolocation error: ${error.message}`, 'error');
          this.view.enableButton('use-current-location', '<i class="fas fa-map-marker-alt"></i> Use My Current Location');
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      this.showAlert('Geolocation is not supported by your browser', 'error');
    }
  }
  
  // Camera and photo handlers
  switchTab(tabName) {
    if (tabName === 'upload' && this.view.camera) {
      // Stop camera if running when switching to upload tab
      this.view.camera.stop();
      this.view.enableButton('start-camera', '<i class="fas fa-camera"></i> Start Camera');
      this.view.disableButton('capture-photo');
    }
  }
  
  async startCamera() {
    try {
      this.view.disableButton('start-camera', true, 'Starting camera...');
      
      await this.view.camera.start();
      
      this.view.enableButton('start-camera', '<i class="fas fa-camera"></i> Restart Camera');
      this.view.enableButton('capture-photo', '<i class="fas fa-camera-retro"></i> Take Photo');
    } catch (error) {
      this.view.enableButton('start-camera', '<i class="fas fa-camera"></i> Start Camera');
      this.showAlert('Failed to start camera: ' + (error.message || 'Unknown error'), 'error');
    }
  }
  
  async capturePhoto() {
    try {
      this.view.disableButton('capture-photo', true, 'Processing...');
      
      this.photoBlob = await this.view.camera.takeSnapshot();
      
      this.view.enableButton('capture-photo', '<i class="fas fa-camera-retro"></i> Retake Photo');
    } catch (error) {
      this.view.enableButton('capture-photo', '<i class="fas fa-camera-retro"></i> Take Photo');
      this.showAlert('Failed to capture photo: ' + (error.message || 'Unknown error'), 'error');
    }
  }
  
  handleFileUpload(file) {
    this.photoBlob = file;
    
    // Preview uploaded image
    const reader = new FileReader();
    reader.onload = (event) => {
      this.view.updateFilePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  }
  
  // Form submission
  async submitStory(description) {
    if (!description) {
      this.showAlert('Please enter a description', 'error');
      return;
    }
    
    if (!this.photoBlob) {
      this.showAlert('Please take or upload a photo', 'error');
      return;
    }
    
    try {
      // Prepare location data
      let lat = null;
      let lon = null;
      
      if (this.selectedPosition) {
        lat = this.selectedPosition.lat;
        lon = this.selectedPosition.lng;
      }
      
      // Submit the story
      const response = await this.model.add(description, this.photoBlob, lat, lon);
      
      if (response.error) {
        this.showAlert(response.message, 'error');
        return;
      }
      
      this.showAlert('Story shared successfully!', 'success');
      
      // Clean up
      this.cleanup();
      
      // Redirect to home page
      setTimeout(() => {
        window.location.hash = '#/';
      }, 1500);
    } catch (error) {
      this.showAlert(`Failed to share story: ${error.message}`, 'error');
    }
  }
  
  // Utility methods
  showAlert(message, type) {
    showAlert(message, type);
  }
  
  // Resource cleanup
  cleanup() {
    if (this.view.camera) {
      try {
        this.view.camera.stop();
        console.log("Camera stopped");
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
    }
  }
}