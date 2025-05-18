import HomePresenter from './home-presenter.js';
import Story from '../../data/story';
import { createStoryItemTemplate, showLoading } from '../../utils/index';

export default class HomePage {
  #presenter;
  
  constructor() {
    this.#presenter = new HomePresenter({ 
      view: this,
      model: Story
    });
  }

  async render() {
    return `
      <section class="container home-page">
        <h1 class="page-title">Latest Stories</h1>
        
        <div id="connection-status"></div>
        <div id="last-sync" class="last-sync"></div>
        
        <div id="main-content" class="story-list-container">
          <div id="story-list" class="story-list"></div>
          <div id="saved-confirmation" class="saved-confirmation" style="display:none">
            <div class="saved-message">Story saved for offline!</div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.#presenter.loadStories();
  }
  
  showLoading() {
    const storyListContainer = document.getElementById('story-list');
    showLoading(storyListContainer);
  }
  
  showErrorMessage(message) {
    const storyListContainer = document.getElementById('story-list');
    storyListContainer.innerHTML = `<div class="error-message">${message}</div>`;
  }
  
  showEmptyMessage(message = 'No stories found') {
    const storyListContainer = document.getElementById('story-list');
    storyListContainer.innerHTML = `<div class="empty-message">${message}</div>`;
  }
  
  showOnlineStatus(isOnline) {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
      if (isOnline) {
        statusEl.innerHTML = `<div class="online-status"><span class="status-icon online"></span>You are online</div>`;
        statusEl.classList.remove('offline');
        statusEl.classList.add('online');
      } else {
        statusEl.innerHTML = `<div class="offline-status"><span class="status-icon offline"></span>You are offline - viewing cached stories</div>`;
        statusEl.classList.remove('online');
        statusEl.classList.add('offline');
      }
    }
  }
  
  showLastSyncTime(time) {
    const syncEl = document.getElementById('last-sync');
    if (syncEl && time) {
      const formattedTime = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(time);
      
      syncEl.innerHTML = `<div class="sync-info">Last synchronized: ${formattedTime}</div>`;
      syncEl.style.display = 'block';
    } else if (syncEl) {
      syncEl.style.display = 'none';
    }
  }
  
  showSavedConfirmation(storyName) {
    const confirmationEl = document.getElementById('saved-confirmation');
    const messageEl = confirmationEl.querySelector('.saved-message');
    
    if (confirmationEl && messageEl) {
      messageEl.textContent = `"${storyName}" saved for offline viewing!`;
      confirmationEl.style.display = 'flex';
      
      // Hide after 3 seconds
      setTimeout(() => {
        confirmationEl.style.display = 'none';
      }, 3000);
    }
  }
  
  showStories(stories, isFromCache = false) {
    const storyListContainer = document.getElementById('story-list');
    
    // Create story markup with offline save button
    storyListContainer.innerHTML = stories
      .map(story => {
        // Create the basic story template
        const storyTemplate = createStoryItemTemplate(story);
        
        // If we're online, add the save offline button
        if (!isFromCache && navigator.onLine) {
          // Insert save offline button before the closing div tag
          return storyTemplate.replace(
            /<\/div>$/,
            `<button class="save-offline-btn" data-id="${story.id}">Save for Offline</button></div>`
          );
        }
        
        return storyTemplate;
      })
      .join('');
    
    // Add event listeners to save offline buttons
    const saveButtons = storyListContainer.querySelectorAll('.save-offline-btn');
    saveButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const storyId = button.dataset.id;
        this.#presenter.saveStoryForOffline(storyId);
        
        // Change the button to indicate success
        button.textContent = 'Saved ✓';
        button.disabled = true;
        button.classList.add('saved');
      });
    });
  }
}