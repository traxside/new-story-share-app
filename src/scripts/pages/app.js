import routes from '../routes/routes';
import { getActiveRoute, parseActivePathname } from '../routes/url-parser';
import Auth from '../data/auth';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #navList = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#navList = document.querySelector('#nav-list');

    this._setupDrawer();
    this._updateNavigation();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  _updateNavigation() {
    const isLoggedIn = Auth.isLoggedIn();
    
    let navItems = `
      <li><a href="#/">Beranda</a></li>
      <li><a href="#/about">About</a></li>
    `;

    if (isLoggedIn) {
      navItems += `
        <li><a href="#/add">Add Story</a></li>
        <li><a href="#/profile">Profile</a></li>
        <li><a href="#/" id="logout-button">Logout</a></li>
      `;
    } else {
      navItems += `
        <li><a href="#/login">Login</a></li>
        <li><a href="#/register">Register</a></li>
      `;
    }

    this.#navList.innerHTML = navItems;
    
    // Logout handler
    const logoutButton = document.querySelector('#logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        Auth.logout();
        window.location.hash = '#/';
        this._updateNavigation();
      });
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const { id } = parseActivePathname();
    
    // Check if route requires authentication
    const protectedRoutes = ['/add', '/profile'];
    if (protectedRoutes.includes(url) && !Auth.isLoggedIn()) {
      window.location.hash = '#/login';
      return;
    }

    // Update navigation before rendering
    this._updateNavigation();

    // Use View Transition API if supported
    if (document.startViewTransition && document.startViewTransition.isSupported) {
      document.startViewTransition(async () => {
        const page = routes[url];
        if (!page) {
          this.#content.innerHTML = `
            <section class="container error-container">
              <h2>404 - Page Not Found</h2>
              <p>The page you're looking for doesn't exist.</p>
            </section>
          `;
          return;
        }

        this.#content.innerHTML = await page.render(id);
        await page.afterRender(id);
      });
    } else {
      // Fallback for browsers that don't support View Transition API
      const page = routes[url];
      if (!page) {
        this.#content.innerHTML = `
          <section class="container error-container">
            <h2>404 - Page Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>
          </section>
        `;
        return;
      }

      this.#content.innerHTML = await page.render(id);
      await page.afterRender(id);
    }
  }
}

export default App;