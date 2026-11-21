const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.accessToken = localStorage.getItem('bidzone_access_token') || null;
    this.refreshToken = localStorage.getItem('bidzone_refresh_token') || null;
  }

  setTokens(access, refresh) {
    this.accessToken = access;
    if (access) {
      localStorage.setItem('bidzone_access_token', access);
    } else {
      localStorage.removeItem('bidzone_access_token');
    }

    if (refresh !== undefined) {
      this.refreshToken = refresh;
      if (refresh) {
        localStorage.setItem('bidzone_refresh_token', refresh);
      } else {
        localStorage.removeItem('bidzone_refresh_token');
      }
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('bidzone_access_token');
    localStorage.removeItem('bidzone_refresh_token');
    localStorage.removeItem('bidzone_user');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers
    });

    // Check for token expiry & attempt auto-refresh
    if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken })
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          this.setTokens(refreshData.accessToken);
          headers.Authorization = `Bearer ${refreshData.accessToken}`;

          // Retry initial request
          response = await fetch(url, {
            ...options,
            headers
          });
        } else {
          this.clearTokens();
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      } catch (err) {
        this.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'Network request failed');
      error.status = response.status;
      error.errors = data.errors || null;
      throw error;
    }

    return data;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options
    });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

export const api = new ApiService();
