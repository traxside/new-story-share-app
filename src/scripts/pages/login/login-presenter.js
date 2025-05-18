import Auth from '../../data/auth';
import { showAlert } from '../../utils';

export default class LoginPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model || Auth;
  }

  async login(email, password) {
    // Validate inputs
    if (!email || !password) {
      showAlert('Please fill in all fields', 'error');
      return false;
    }
    
    try {
      const response = await this.#model.login(email, password);
      
      if (response.error) {
        showAlert(response.message, 'error');
        return false;
      }
      
      showAlert('Login successful! Redirecting...', 'success');
      
      // Redirect after successful login
      setTimeout(() => {
        window.location.hash = '#/';
      }, 1500);
      
      return true;
    } catch (error) {
      showAlert(`Login failed: ${error.message}`, 'error');
      return false;
    }
  }
}