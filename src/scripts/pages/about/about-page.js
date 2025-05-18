import AboutPresenter from "./about-presenter.js";

export default class AboutPage {
  #presenter;

  constructor() {
    this.#presenter = new AboutPresenter({ view: this });
  }

  async render() {
    return `
      <div class="skip-link-container">
        <a href="#main-content" class="skip-link">Skip to content</a>
      </div>
      <section class="container about-page" id="main-content">
        <h1 class="page-title">About Story Share App</h1>
        
        <div class="about-content">
          <div class="about-section">
            <h2><i class="fas fa-info-circle"></i> About the App</h2>
            <p>Story Share is a platform for sharing your stories and moments with others. Capture special moments with photos, add descriptions, and even tag locations on the map.</p>
            <p>This application was built using modern web technologies including:</p>
            <ul>
              <li>Single-Page Application Architecture</li>
              <li>Model-View-Presenter (MVP) Pattern</li>
              <li>View Transitions API for smooth page transitions</li>
              <li>MapTiler integration for location mapping</li>
              <li>Camera API for direct photo capturing</li>
            </ul>
          </div>
          
          <div class="about-section">
            <h2><i class="fas fa-user"></i> Features</h2>
            <ul>
              <li>Share stories with photos and descriptions</li>
              <li>Capture photos directly using your device camera</li>
              <li>Tag locations on interactive maps</li>
              <li>View stories from other users</li>
              <li>Create an account to manage your stories</li>
            </ul>
          </div>
          
          <div class="about-section">
            <h2><i class="fas fa-code"></i> Technology Stack</h2>
            <p>This application is built with:</p>
            <ul>
              <li>HTML5, CSS3, and JavaScript</li>
              <li>Webpack for bundling</li>
              <li>Babel for transpiling</li>
              <li>Leaflet.js for mapping</li>
              <li>RESTful API integration</li>
            </ul>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
  }
}