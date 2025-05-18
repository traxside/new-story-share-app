import Auth from '../../data/auth';
import { showAlert } from '../../utils';

export default class RegisterPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model || Auth;
  }

  async register(name, email, password, confirmPassword) {
    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      showAlert('Please fill in all fields', 'error');
      return false;
    }
    
    if (password !== confirmPassword) {
      showAlert('Passwords do not match', 'error');
      return false;
    }
    
    try {
      const response = await this.#model.register(name, email, password);
      
      if (response.error) {
        showAlert(response.message, 'error');
        return false;
      }
      
      showAlert('Registration successful! Please login.', 'success');
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        window.location.hash = '#/login';
      }, 1500);
      
      return true;
    } catch (error) {
      showAlert(`Registration failed: ${error.message}`, 'error');
      return false;
    }
  }
}