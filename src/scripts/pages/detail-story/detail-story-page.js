import DetailStoryPresenter from './detail-story-presenter.js';
import Story from '../../data/story';
import { showLoading, showFormattedDate } from '../../utils';

export default class DetailStoryPage {
  #presenter;

  constructor() {
    // Presenter will be initialized in afterRender with the story ID
  }
  
  async render() {
    return `
      <div class="skip-link-container">
        <a href="#main-content" class="skip-link">Skip to content</a>
      </div>
      <section class="container detail-story-page" id="main-content">
        <div id="story-detail" class="story-detail"></div>
      </section>
    `;
  }

  async afterRender(id) {
    this.#presenter = new DetailStoryPresenter({ 
      view: this,
      model: Story,
      id
    });
    
    await this.#presenter.loadStoryDetail();
  }
  
  showLoading() {
    const storyDetailContainer = document.getElementById('story-detail');
    showLoading(storyDetailContainer);
  }
  
  showErrorMessage(message) {
    const storyDetailContainer = document.getElementById('story-detail');
    storyDetailContainer.innerHTML = `<div class="error-message">${message}</div>`;
  }
  
  showStoryDetail(story) {
    const storyDetailContainer = document.getElementById('story-detail');
    const hasLocation = story.lat && story.lon;
    
    storyDetailContainer.innerHTML = `
      <div class="story-header">
        <a href="#/" class="back-button">
          <i class="fas fa-arrow-left"></i> Back to Stories
        </a>
        <h1 class="story-title">Story by ${story.name}</h1>
      </div>
      
      <div class="story-content">
        <div class="story-detail-image-container">
          <img src="${story.photoUrl}" alt="Story image from ${story.name}" class="story-detail-image">
        </div>
        
        <div class="story-info">
          <p class="story-date"><i class="fas fa-calendar"></i> ${showFormattedDate(story.createdAt)}</p>
          <p class="story-detail-description">${story.description}</p>
          
          ${hasLocation ? `
            <div class="story-location">
              <h3><i class="fas fa-map-marker-alt"></i> Location</h3>
              <div id="story-map" class="story-detail-map" style="height: 400px; width: 100%;"></div>
              <p class="location-coordinates">
                <i class="fas fa-crosshairs"></i> Coordinates: ${parseFloat(story.lat).toFixed(6)}, ${parseFloat(story.lon).toFixed(6)}
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  showMapError() {
    const mapContainer = document.getElementById('story-map');
    if (mapContainer) {
      mapContainer.innerHTML = '<div class="error-message">Could not load map</div>';
    }
  }
}