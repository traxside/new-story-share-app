import LoginPresenter from './login-presenter.js';
import Auth from '../../data/auth';

export default class LoginPage {
  #presenter;

  constructor() {
    this.#presenter = new LoginPresenter({ 
      view: this,
      model: Auth
    });
  }
  
  async render() {
    return `  
      <section class="container auth-page">
        <div class="auth-container" id="main-content">
          <h1 class="page-title">Login</h1>
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary">Login</button>
          </form>
          <p class="auth-link">Don't have an account? <a href="#/register">Register here</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._setupEventListeners();
  }
  
  _setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      await this.#presenter.login(email, password);
    });
  }
}