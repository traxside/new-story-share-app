import CONFIG from '../config';
import { login, register } from './api';

class Auth {
  static setToken(token) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
  }

  static getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  }

  static removeToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
  }

  static setUser(user) {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  }

  static getUser() {
    const user = localStorage.getItem(CONFIG.USER_KEY);
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }

  static removeUser() {
    localStorage.removeItem(CONFIG.USER_KEY);
  }

  static isLoggedIn() {
    return !!this.getToken();
  }

  static async login(email, password) {
    try {
      const response = await login({ email, password });
      
      if (response.error) {
        return response;
      }

      this.setToken(response.loginResult.token);
      this.setUser({
        id: response.loginResult.userId,
        name: response.loginResult.name,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  static async register(name, email, password) {
    try {
      const response = await register({ name, email, password });
      return response;
    } catch (error) {
      throw error;
    }
  }

  static logout() {
    this.removeToken();
    this.removeUser();
  }
}

export default Auth;