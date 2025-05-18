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
        <div id="main-content" class="story-list-container">
          <div id="story-list" class="story-list"></div>
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
  
  showEmptyMessage() {
    const storyListContainer = document.getElementById('story-list');
    storyListContainer.innerHTML = '<div class="empty-message">No stories found</div>';
  }
  
  showStories(stories) {
    const storyListContainer = document.getElementById('story-list');
    storyListContainer.innerHTML = stories
      .map(story => createStoryItemTemplate(story))
      .join('');
  }
}